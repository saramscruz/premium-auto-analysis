import "dotenv/config";
import express from "express";
import session from "express-session";
import cors from "cors";
import passport from "passport";
import { Strategy as GoogleStrategy } from "passport-google-oauth20";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "./router";
import type { Context } from "./trpc";
import { runAllHealthChecks } from "./jobs/healthChecks";

declare module "express-session" {
  interface SessionData {
    userId: string;
    userEmail: string;
    userName: string;
    userPicture: string;
  }
}

const app = express();
const PORT = parseInt(process.env.PORT || "3001");
const CLIENT_URL = process.env.CLIENT_URL || "http://localhost:5173";

app.use(
  cors({
    origin: CLIENT_URL,
    credentials: true,
  })
);

app.use(express.json());

app.use(
  session({
    secret: process.env.SESSION_SECRET || "dev-secret-change-me-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 7 * 24 * 60 * 60 * 1000,
    },
  })
);

app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user: any, done) => done(null, user));
passport.deserializeUser((user: any, done) => done(null, user));

if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(
    new GoogleStrategy(
      {
        clientID: process.env.GOOGLE_CLIENT_ID,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET,
        callbackURL: `${process.env.SERVER_URL || `http://localhost:${PORT}`}/auth/google/callback`,
        scope: ["profile", "email"],
      },
      (_accessToken, _refreshToken, profile, done) => {
        done(null, {
          id: profile.id,
          email: profile.emails?.[0]?.value || "",
          name: profile.displayName,
          picture: profile.photos?.[0]?.value || "",
        });
      }
    )
  );
}

app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get(
  "/auth/google/callback",
  passport.authenticate("google", { failureRedirect: `${CLIENT_URL}/login?error=auth` }),
  (req, res) => {
    const user = req.user as any;
    req.session.userId = user.id;
    req.session.userEmail = user.email;
    req.session.userName = user.name;
    req.session.userPicture = user.picture;
    res.redirect(CLIENT_URL);
  }
);

if (process.env.USE_MOCK_INTEGRATIONS === "true") {
  app.get("/auth/mock-login", (req, res) => {
    req.session.userId = "mock-user-1";
    req.session.userEmail = "demo@example.com";
    req.session.userName = "Demo User";
    req.session.userPicture = "";
    res.redirect(CLIENT_URL);
  });
}

app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
    createContext: ({ req, res }): Context => ({ req: req as any, res }),
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

app.listen(PORT, async () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);
  console.log(`[Server] Mock mode: ${process.env.USE_MOCK_INTEGRATIONS === "true"}`);

  setTimeout(() => runAllHealthChecks().catch(console.error), 2000);
});

export type { AppRouter } from "./router";
