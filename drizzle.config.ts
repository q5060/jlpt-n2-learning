import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: "./lib/db/remote/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgresql://localhost:5432/n2study",
  },
});
