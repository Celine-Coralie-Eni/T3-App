import { NextResponse } from 'next/server';
import { auth } from '~/server/auth';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const headers: Record<string, string> = {};
  for (const [k, v] of (request.headers as any).entries()) headers[k] = v;

  const session = await auth();

  return NextResponse.json({
    now: new Date().toISOString(),
    url: url.toString(),
    cookies: headers['cookie'] ?? null,
    session
  });
}
