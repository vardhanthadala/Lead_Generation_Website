import { PrismaClient } from "@prisma/client";

// Global caching for hot‑reloading in development
const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Initialise PrismaClient with the datasource URL (required for Prisma 7)
export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
