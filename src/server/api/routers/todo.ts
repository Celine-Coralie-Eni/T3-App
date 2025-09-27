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
      // Debug logging - log to both console and response
      const sessionUser = ctx.session.user;
      console.log("=== TODO CREATE DEBUG ===");
      console.log("Session user:", JSON.stringify(sessionUser, null, 2));
      
      // Use raw Prisma client to bypass ZenStack temporarily
      const { rawDb } = await import("~/server/db");
      
      // Check all users in database
      const allUsers = await rawDb.user.findMany();
      console.log("All users in DB:", allUsers.map(u => ({ id: u.id, email: u.email })));
      
      // Check if current session user exists in database
      const userExists = await rawDb.user.findUnique({
        where: { id: sessionUser.id }
      });
      console.log("Current user exists in DB:", userExists ? "YES" : "NO");
      
      if (!userExists) {
        console.log("Creating new user with data:", {
          id: sessionUser.id,
          email: sessionUser.email,
          name: sessionUser.name,
          image: sessionUser.image,
        });
        
        try {
          const newUser = await rawDb.user.create({
            data: {
              id: sessionUser.id,
              email: sessionUser.email || null,
              name: sessionUser.name || null,
              image: sessionUser.image || null,
            }
          });
          console.log("Successfully created user:", newUser.id);
        } catch (createError) {
          console.error("Failed to create user:", createError);
          throw createError;
        }
      }
      
      console.log("Attempting to create todo with userId:", sessionUser.id);
      
      try {
        const todo = await rawDb.todo.create({
          data: {
            title: input.title,
            userId: sessionUser.id,
          },
        });
        console.log("Successfully created todo:", todo.id);
        return todo;
      } catch (todoError) {
        console.error("Failed to create todo:", todoError);
        throw todoError;
      }
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
