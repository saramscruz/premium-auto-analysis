import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@premium-auto/shared": path.resolve(__dirname, "../shared/schemas.ts"),
    },
  },
  server: {
    port: 5173,
    proxy: {
      "/trpc": "http://localhost:3001",
      "/auth": "http://localhost:3001",
    },
  },
});
