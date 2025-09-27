import { z } from "zod";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "~/server/api/trpc";

export const todoRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
  //   return rawDb.todo.findMany({
  //     orderBy: { createdAt: "desc" },
  //   });
  // }),
    // ZenStack version (secure) 
    return ctx.db.todo.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: publicProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ input }) => {
      // Bypass authentication temporarily to debug
      const { rawDb } = await import("~/server/db");
      
      // Get or create a default user for testing
      let user = await rawDb.user.findFirst({
        where: { email: "celinecoralie0@gmail.com" }
      });
      
      if (!user) {
        user = await rawDb.user.create({
          data: {
            id: "debug-user-" + Date.now(),
            email: "celinecoralie0@gmail.com",
            name: "Celine-Coralie",
            image: null,
          }
        });
      }
      
      return rawDb.todo.create({
        data: {
          title: input.title,
          userId: user.id,
        },
      });
    }),

  update: protectedProcedure
    .input(z.object({ 
      id: z.string(),
      title: z.string().min(1)
    }))
    .mutation(async ({ ctx, input }) => {
      // ZenStack automatically enforces access control
      return ctx.db.todo.update({
        where: { id: input.id },
        data: { title: input.title },
      });
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ZenStack automatically enforces access control
      const todo = await ctx.db.todo.findFirst({
        where: { id: input.id },
      });

      if (!todo) {
        throw new Error("Todo not found");
      }

      return ctx.db.todo.update({
        where: { id: input.id },
        data: { completed: !todo.completed },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ZenStack automatically enforces access control
      return ctx.db.todo.delete({
        where: { id: input.id },
      });
    }),
});
