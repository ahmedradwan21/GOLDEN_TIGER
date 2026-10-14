import 'server-only';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'gt_session';
const ADMIN_COOKIE = 'gt_admin';
const SESSION_MAX_AGE = 7 * 24 * 60 * 60; // 7 days
const ADMIN_MAX_AGE = 8 * 60 * 60; // 8 hours

function getSecret(): Uint8Array {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error('JWT_SECRET must be set and at least 32 characters');
  }
  return new TextEncoder().encode(secret);
}

export interface SessionPayload {
  userId: string;
  email: string;
  type: 'customer';
}

export interface AdminPayload {
  adminId: string;
  email: string;
  role: string;
  type: 'admin';
}

export async function createSessionCookie(userId: string, email: string): Promise<void> {
  const token = await new SignJWT({ userId, email, type: 'customer' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_MAX_AGE}s`)
    .sign(getSecret());

  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_MAX_AGE,
    path: '/',
  });
}

export async function createAdminCookie(adminId: string, email: string, role: string): Promise<void> {
  const token = await new SignJWT({ adminId, email, role, type: 'admin' })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime(`${ADMIN_MAX_AGE}s`)
    .sign(getSecret());

  cookies().set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: ADMIN_MAX_AGE,
    path: '/',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookie = cookies().get(SESSION_COOKIE);
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie.value, getSecret());
    if (payload.type !== 'customer') return null;
    return payload as unknown as SessionPayload;
  } catch {
    return null;
  }
}

export async function getAdminSession(): Promise<AdminPayload | null> {
  const cookie = cookies().get(ADMIN_COOKIE);
  if (!cookie) return null;
  try {
    const { payload } = await jwtVerify(cookie.value, getSecret());
    if (payload.type !== 'admin') return null;
    return payload as unknown as AdminPayload;
  } catch {
    return null;
  }
}

export function clearSessionCookie(): void {
  cookies().delete(SESSION_COOKIE);
}

export function clearAdminCookie(): void {
  cookies().delete(ADMIN_COOKIE);
}

export async function verifyToken(token: string): Promise<SessionPayload | AdminPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret());
    return payload as unknown as SessionPayload | AdminPayload;
  } catch {
    return null;
  }
}
