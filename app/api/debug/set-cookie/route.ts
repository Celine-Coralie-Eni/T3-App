import { NextResponse } from 'next/server';

export async function GET() {
  // Create response body
  const res = NextResponse.json({ ok: true, message: 'Test cookie set' });

  // Method 1: Via cookies API
  res.cookies.set('debug-cookie', 'hello', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: false,
  });

  // Method 2: Explicit Set-Cookie header (duplicate on purpose for diagnostics)
  // Note: host-only cookie (no Domain attribute), Lax, HttpOnly, not Secure
  res.headers.append(
    'Set-Cookie',
    'debug-cookie=hello; Path=/; HttpOnly; SameSite=Lax'
  );

  return res;
}
