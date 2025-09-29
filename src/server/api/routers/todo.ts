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
      // Direct database test - create user and todo in single transaction
      const { rawDb } = await import("~/server/db");
      
      return rawDb.$transaction(async (tx) => {
        // Delete all existing data first
        await tx.todo.deleteMany({});
        await tx.session.deleteMany({});
        await tx.account.deleteMany({});
        await tx.user.deleteMany({});
        
        // Create fresh user
        const user = await tx.user.create({
          data: {
            id: "test-user-" + Date.now(),
            email: "celinecoralie0@gmail.com",
            name: "Celine-Coralie",
            image: null,
          }
        });
        
        // Create todo with the fresh user
        const todo = await tx.todo.create({
          data: {
            title: input.title,
            userId: user.id,
          },
        });
        
        return { todo, user };
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
