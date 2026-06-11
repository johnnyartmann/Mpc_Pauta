import { PrismaClient } from "@/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import dotenv from "dotenv";
import path from "path";

// Explicitly load .env file from absolute path to solve Next.js Turbopack issue on Windows
dotenv.config({ path: path.resolve(process.cwd(), ".env"), override: true });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient };

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not set in environment variables!");
}

const isLocalhost = connectionString.includes("localhost") || connectionString.includes("127.0.0.1");
const isPooler = connectionString.includes("pooler.supabase.com");

const poolConfig: pg.PoolConfig = {
  connectionString,
};

if (!isLocalhost && !isPooler) {
  // Direct remote connection requires SSL
  poolConfig.ssl = { rejectUnauthorized: false };
} else {
  // Localhost and Supabase poolers do not support SSL or do not require it
  poolConfig.ssl = false;
}

const pool = new pg.Pool(poolConfig);

pool.on("error", (err) => {
  console.error("Unexpected error on idle pg client", err);
});

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    adapter: new PrismaPg(pool),
  });

// Cache globally in ALL environments (including production/serverless)
// In Vercel, globalThis persists across invocations of the same worker,
// allowing pg.Pool reuse instead of creating a new connection per request.
globalForPrisma.prisma = prisma;


