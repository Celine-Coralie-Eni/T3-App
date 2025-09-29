import { NextResponse } from 'next/server';

export async function GET() {
  const res = NextResponse.json({ ok: true, message: 'Test cookie set' });
  // host-only, not secure, lax
  res.cookies.set('debug-cookie', 'hello', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
  });
  return res;
}
