import { todoRouter } from "~/server/api/routers/todo";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";


export const appRouter = createTRPCRouter({
  todo: todoRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

export const createCaller = createCallerFactory(appRouter);
