// the "bridge" between your code and your docker container
// it tells Drizzle Kit which database to talk to
import { defineConfig } from "drizzle-kit";
import { loadEnvConfig } from "@next/env";

// Load environment variables from .env.local file
const projectDir = process.cwd();
loadEnvConfig(projectDir);

export default defineConfig({
    schema: "./db/schema.ts",
    out: "./drizzle", // folder where migrations will be stored
    dialect: "postgresql",
    dbCredentials: {
        url: process.env.DATABASE_URL as string,
    },
    verbose: true, // print all SQL statements being executed
    strict: true, // ensure DB state matches schema exactly
});
