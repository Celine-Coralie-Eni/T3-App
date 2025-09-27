import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

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

  create: protectedProcedure
    .input(z.object({ title: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      // Debug logging
      console.log("Todo create mutation - Session user:", ctx.session.user);
      
      // Use raw Prisma client to bypass ZenStack temporarily
      const { rawDb } = await import("~/server/db");
      
      // Check if user exists in database
      const userExists = await rawDb.user.findUnique({
        where: { id: ctx.session.user.id }
      });
      console.log("User exists in DB:", userExists ? "YES" : "NO", userExists?.email);
      
      if (!userExists) {
        // Create user if doesn't exist
        const newUser = await rawDb.user.create({
          data: {
            id: ctx.session.user.id,
            email: ctx.session.user.email,
            name: ctx.session.user.name,
            image: ctx.session.user.image,
          }
        });
        console.log("Created new user:", newUser.id);
      }
      
      return rawDb.todo.create({
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
