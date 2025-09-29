import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type DefaultSession, type NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { env } from "~/env";
import { rawDb } from "~/server/db";

// Use raw Prisma client for NextAuth adapter to avoid ZenStack conflicts

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      // role: UserRole;
    } & DefaultSession["user"];
  }

  // interface User {
  //   // ...other properties
  //   // role: UserRole;
  // }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authConfig = {
  trustHost: true,
  providers: [
    GoogleProvider({
      clientId: process.env.AUTH_GOOGLE_ID!,
      clientSecret: process.env.AUTH_GOOGLE_SECRET!,
      // Allow linking accounts that share the same verified email across providers
      // Fixes: "Sign in with the same account you used originally" loop
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await rawDb.user.findUnique({
          where: {
            email: credentials.email as string,
          },
        });

        if (!user || !(user as any).password) {
          return null;
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password as string,
          (user as any).password
        );

        if (!isPasswordValid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
        };
      },
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
  adapter: PrismaAdapter(rawDb),
  session: {
    strategy: "jwt",
  },
  pages: {
    error: "/auth/signin",
  },
  debug: true, // Enable debug in production for OAuth troubleshooting
  callbacks: {
    async jwt({ token, user, account, profile }) {
      console.log("JWT callback:", { token, user, account, profile });
      // Persist user info in JWT token
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.image = user.image;
      }
      return token;
    },
    async session({ session, token, user }) {
      console.log("Session callback:", { session, token, user });
      // With JWT strategy, read from token
      if (token) {
        session.user.id = (token as any).id as string;
        session.user.email = token.email as string | null;
        session.user.name = token.name as string | null;
        session.user.image = token.image as string | null;
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      console.log("SignIn callback:", { user, account, profile });
      return true;
    },
    async redirect({ url, baseUrl }) {
      console.log("Redirect callback:", { url, baseUrl });
      // If url is relative, prepend baseUrl
      if (url.startsWith("/")) return `${baseUrl}${url}`;
      // If url is on same origin, allow it
      if (new URL(url).origin === baseUrl) return url;
      // Otherwise redirect to home page
      return baseUrl;
    },
  },
} satisfies NextAuthConfig;
