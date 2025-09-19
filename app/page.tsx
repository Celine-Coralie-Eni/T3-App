import Link from "next/link";

import { TodoList } from "./_components/todo-list";
import { getServerAuthSession } from "~/server/auth/index";
import { api, HydrateClient } from "~/trpc/server";

export default async function Home() {
  const session = await getServerAuthSession();

  if (session?.user) {
    void api.todo.getAll.prefetch();
  }

  return (
    <HydrateClient>
      <main className="flex min-h-screen flex-col bg-gradient-to-b from-[#2e026d] to-[#15162c] text-white">
        {/* Top navigation bar */}
        <nav className="flex justify-between items-center p-6">
          <div className="text-xl font-bold">
            Todo <span className="text-[hsl(280,100%,70%)]">App</span>
          </div>
          
          {session && (
            <div className="flex items-center gap-4">
              <span className="text-white/70">Welcome, {session.user?.name}</span>
              <Link
                href="/api/auth/signout"
                className="rounded-full bg-white/10 px-6 py-2 font-semibold no-underline transition hover:bg-white/20"
              >
                Sign out
              </Link>
            </div>
          )}
          
          {!session && (
            <Link
              href="/api/auth/signin"
              className="rounded-full bg-white/10 px-6 py-2 font-semibold no-underline transition hover:bg-white/20"
            >
              Sign in
            </Link>
          )}
        </nav>

        {/* Main content */}
        <div className="flex-1 flex flex-col items-center justify-center px-4 py-8">
          {!session && (
            <div className="text-center mb-8">
              <h1 className="text-5xl font-extrabold tracking-tight sm:text-[5rem] mb-6">
                Todo <span className="text-[hsl(280,100%,70%)]">App</span>
              </h1>
              <p className="text-lg text-white/70">
                Sign in to start managing your todos
              </p>
            </div>
          )}

          {session?.user && <TodoList />}
        </div>
      </main>
    </HydrateClient>
  );
}
