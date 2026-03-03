import { cookies } from 'next/headers';
import prisma from '@/lib/prisma';
import { AUTH_COOKIE_NAME, verifyAuthToken } from '@/lib/auth-token';

export async function getAuthSession() {
  const cookieStore = cookies();
  const token = cookieStore.get(AUTH_COOKIE_NAME)?.value;
  const payload = verifyAuthToken(token);
  if (!payload?.userId) return null;
  return payload;
}

export async function getCurrentUser() {
  const session = await getAuthSession();
  if (!session?.userId) return null;

  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      avatar: true,
      timezone: true,
      language: true,
      role: true,
      status: true,
    },
  }).catch(() => null);

  return user;
}

export function getUserInitial(user) {
  const source = user?.firstName || user?.email || '?';
  return source.trim().charAt(0).toUpperCase();
}
