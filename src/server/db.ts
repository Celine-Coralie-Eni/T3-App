import { PrismaClient } from "@prisma/client";
import { enhance } from "@zenstackhq/runtime";

import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Eagerly connect the Prisma engine once at module load to avoid cold-start issues
(async () => {
  try {
    await prisma.$connect();
    // console.debug("Prisma connected");
  } catch (e) {
    // console.error("Prisma initial connect failed", e);
  }
})();

// Enhanced database client with ZenStack access control
export const db = enhance(prisma);

// Raw Prisma client for operations that need to bypass access control
export const rawDb = prisma;

// Function to create enhanced database client with user context
export const createEnhancedDb = (user?: { id: string }) => {
  return enhance(prisma, { user });
};

// Helper to ensure the engine is connected (idempotent)
export const ensureConnected = async () => {
  try {
    await prisma.$connect();
  } catch {}
};
