import { NextResponse } from 'next/server';
import { rawDb } from '~/server/db';

export async function GET() {
  try {
    // Database connectivity + diagnostic check
    const result: any = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: 'todo-app',
      db: {
        connected: false,
        users: -1,
        todos: -1,
        test: {
          createdUserId: null as string | null,
          createdTodoId: null as string | null,
          error: null as string | null,
        },
      },
    };

    try {
      await rawDb.$connect();
      result.db.connected = true;
      result.db.users = await rawDb.user.count();
      result.db.todos = await rawDb.todo.count();

      // Attempt a scoped test create (user + todo) to surface FK issues
      const testUserId = `health-user-${Date.now()}`;
      try {
        const user = await rawDb.user.create({
          data: { id: testUserId, email: null, name: 'HealthCheck', image: null },
        });
        result.db.test.createdUserId = user.id;

        const todo = await rawDb.todo.create({
          data: { title: 'health-check', userId: user.id },
        });
        result.db.test.createdTodoId = todo.id;
      } catch (e: any) {
        result.db.test.error = e?.message ?? String(e);
      }
    } catch (e: any) {
      result.db.connected = false;
      result.db.test.error = e?.message ?? String(e);
    } finally {
      try {
        await rawDb.$disconnect();
      } catch {}
    }

    return NextResponse.json(result, { status: 200 });
  } catch (error) {
    return NextResponse.json(
      { 
        status: 'unhealthy', 
        timestamp: new Date().toISOString(),
        error: 'Service unavailable'
      },
      { status: 503 }
    );
  }
}
