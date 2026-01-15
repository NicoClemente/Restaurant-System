import "server-only";

import { Pool } from "pg";

const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (...args: any[]) => any;
};
const { PrismaPg } = require("@prisma/adapter-pg") as {
  PrismaPg: new (...args: any[]) => any;
};

const globalForPrisma = globalThis as unknown as {
  prisma?: any;
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
    adapter,
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
