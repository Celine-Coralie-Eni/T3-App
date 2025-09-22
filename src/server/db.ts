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

// Enhanced database client with ZenStack access control
export const db = enhance(prisma);

// Raw Prisma client for operations that need to bypass access control
export const rawDb = prisma;

// Function to create enhanced database client with user context
export const createEnhancedDb = (user?: { id: string }) => {
  return enhance(prisma, { user });
};
