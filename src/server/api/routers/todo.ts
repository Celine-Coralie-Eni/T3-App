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
      where: { userId: ctx.session.user.id },
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Ensure the user exists in the DB (some earlier debug code may have deleted users)
      const { rawDb } = await import("~/server/db");
      await rawDb.user.upsert({
        where: { id: ctx.session.user.id },
        update: {},
        create: {
          id: ctx.session.user.id,
          email: ctx.session.user.email!,
          name: ctx.session.user.name ?? null,
          image: ctx.session.user.image ?? null,
        },
      });

      // Create todo for the authenticated user
      const todo = await ctx.db.todo.create({
        data: {
          title: input.title,
          userId: ctx.session.user.id,
        },
      });
      return todo;
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
