import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const todoRouter = createTRPCRouter({
  getAll: protectedProcedure.query(({ ctx }) => {
    // ZenStack automatically filters based on access control rules
    return (ctx.db as any).todo.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // ZenStack automatically sets userId based on context
      return (ctx.db as any).todo.create({
        data: {
          title: input.title,
          userId: ctx.session.user.id,
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
      return (ctx.db as any).todo.update({
        where: { id: input.id },
        data: { title: input.title },
      });
    }),

  toggle: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ZenStack automatically enforces access control
      const todo = await (ctx.db as any).todo.findFirst({
        where: { id: input.id },
      });

      if (!todo) {
        throw new Error("Todo not found");
      }

      return (ctx.db as any).todo.update({
        where: { id: input.id },
        data: { completed: !todo.completed },
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // ZenStack automatically enforces access control
      return (ctx.db as any).todo.delete({
        where: { id: input.id },
      });
    }),
});
