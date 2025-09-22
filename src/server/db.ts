import { PrismaClient } from "@prisma/client";
import { enhance, type Enhanced } from "@zenstackhq/runtime";

import { env } from "~/env";

const createPrismaClient = () =>
  new PrismaClient({
    log:
      env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
  });

const globalForPrisma = globalThis as unknown as {
  prisma: ReturnType<typeof createPrismaClient> | undefined;
};

const basePrisma = globalForPrisma.prisma ?? createPrismaClient();

// Create ZenStack enhanced client factory
export const createEnhancedDb = (userId?: string): Enhanced<PrismaClient> => {
  return enhance(basePrisma, { user: userId ? { id: userId } : undefined });
};

// Export base client for NextAuth adapter only
export const rawDb = basePrisma;

if (env.NODE_ENV !== "production") globalForPrisma.prisma = basePrisma;
