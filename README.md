# Premium Auto Analysis Automation Platform

A full-stack web app for automated signal collection and analysis from five premium automotive brands: **Mercedes-Benz, BMW, Audi, Volvo, Porsche**.

## What It Does

- **Collects signals** from Google Alerts (IMAP), brand app pages (web scraping), and app stores
- **AI-categorizes** each signal using Claude: signal type (A–E), ownership narrative element, confidence level, limitations, content angles
- **Review inbox**: approve/skip/duplicate each signal with editable AI suggestions
- **Syncs to Google Sheets** on approval (always append-only, never overwrites)
- **Health dashboard**: 5 real-time monitors with 🟢/🟡/🔴 status
- **Analytics**: signal progress, brand distribution, narrative element breakdown, weekly patterns

## Quick Start (Local Dev with Mock Mode)

```bash
# 1. Install dependencies
cd server && npm install
cd ../client && npm install

# 2. Copy and configure env
cd ../server && cp .env.example .env
# Edit .env — set USE_MOCK_INTEGRATIONS=true for dev (no real API keys needed)

# 3. Start server
cd server && npm run dev

# 4. Start client (new terminal)
cd client && npm run dev

# 5. Open http://localhost:5173
# Click "Dev: Mock Login" to skip OAuth
# Click "Check Alerts" in Inbox to load mock signals
```

## Architecture

```
/
├── shared/          # Zod schemas shared between client & server
├── server/          # Node.js + Express + tRPC backend
│   └── src/
│       ├── db/          # Drizzle ORM + SQLite
│       ├── integrations/ # IMAP, Sheets, Claude, Scraper
│       ├── jobs/         # Cron jobs: ingest, health, analytics
│       └── router/       # tRPC routers
└── client/          # React + Vite + TailwindCSS frontend
    └── src/
        ├── pages/       # Inbox, Health, Analytics, Setup
        └── components/  # SignalCard, ReviewModal, StatusDot
```

## Configuration

### Google OAuth
1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create OAuth 2.0 credentials (Web Application)
3. Add authorized redirect URI: `http://localhost:3001/auth/google/callback`
4. Copy Client ID + Secret to `server/.env`

### Google Sheets API
1. Create a Service Account in Google Cloud Console
2. Download the JSON key file
3. Paste the entire JSON as `GOOGLE_SERVICE_ACCOUNT_JSON` in `server/.env`
4. Share your Signal Log spreadsheet with the service account email

### Gmail IMAP (for Google Alerts)
1. Enable 2FA on your Google Account
2. Create an [App Password](https://myaccount.google.com/apppasswords)
3. Set up Google Alerts for each brand, delivered to your Gmail
4. Enter IMAP credentials in the Setup page

### Claude API
1. Get an API key from [console.anthropic.com](https://console.anthropic.com)
2. Set `ANTHROPIC_API_KEY` in `server/.env`

## Background Jobs (worker process)

Run the worker separately to enable scheduled ingestion:

```bash
cd server && npm run dev:worker
```

- **Hourly**: IMAP check for new Google Alerts
- **Daily 8 AM**: Brand page scraping (detects changes)
- **Daily 9 AM**: App store page scraping
- **Friday 5 PM**: Weekly analytics report generation
- **Every 6 hours**: Health checks

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, TypeScript, Vite, TailwindCSS, Recharts |
| API layer | tRPC v10 (type-safe, no REST boilerplate) |
| Backend | Node.js, Express, TypeScript |
| Database | SQLite via Drizzle ORM + better-sqlite3 |
| AI | Claude (claude-sonnet-4-6) with prompt caching |
| Auth | Google OAuth 2.0 via Passport.js |
| Scraping | Cheerio + native fetch |
| Email | IMAP (imapflow) + SMTP (nodemailer) |
| Jobs | node-cron (separate worker process) |

## Brands Monitored

| Brand | App Page | App Store | LinkedIn |
|-------|----------|-----------|---------|
| Mercedes-Benz | mercedes-benz.com/en/features/app | mercedes me | linkedin.com/company/mercedes-benz |
| BMW | bmw.com/connected-drive | MyBMW | linkedin.com/company/bmw |
| Audi | audi.com/myaudi-app | myAudi | linkedin.com/company/audi |
| Volvo | volvocars.com/support/app | Volvo Cars | linkedin.com/company/volvo-cars |
| Porsche | porsche.com/porsche-connect | Porsche Connect | linkedin.com/company/porsche-ag |

## Signal Types

| Type | Meaning |
|------|---------|
| A | Primary Signal — official announcement, release note |
| B | Contextual Signal — industry news, partnership |
| C | User Signal — review, community discussion |
| D | Question — raises interesting question |
| E | Rabbit Hole — tangential, time-sink |

## Ownership Narrative Elements

Onboarding · Control · Trust · Status · Support · Partnership · EV/Charging · Personalization
