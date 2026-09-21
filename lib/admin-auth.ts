import { getServerSession } from 'next-auth'
import { getToken } from 'next-auth/jwt'
import { NextRequest } from 'next/server'
import { authOptions } from './auth'

/**
 * Resolve admin access from session cookie OR JWT token.
 * Preview/production domain mismatches sometimes drop role on session only.
 */
export async function requireAdmin(req?: NextRequest): Promise<
  | { ok: true; email?: string | null }
  | { ok: false; status: 401; error: string; debug?: string }
> {
  const session = await getServerSession(authOptions)
  const role = (session?.user as any)?.role

  if (session && role === 'admin') {
    return { ok: true, email: session.user?.email }
  }

  // Fallback: read JWT directly (works better on some Vercel preview hosts)
  if (req) {
    try {
      const token = await getToken({
        req: req as any,
        secret: process.env.NEXTAUTH_SECRET,
      })
      if (token && (token as any).role === 'admin') {
        return { ok: true, email: (token.email as string) || null }
      }
      if (token && !(token as any).role) {
        return {
          ok: false,
          status: 401,
          error: 'Unauthorized',
          debug:
            'Logged in but role is missing from JWT. Sign out and sign in again at /admin/login (not /login).',
        }
      }
    } catch {
      /* ignore */
    }
  }

  if (session && role === 'user') {
    return {
      ok: false,
      status: 401,
      error: 'Unauthorized',
      debug: 'You are logged in as a regular user. Use /admin/login with admin credentials.',
    }
  }

  return {
    ok: false,
    status: 401,
    error: 'Unauthorized',
    debug:
      'No admin session. Open /admin/login, sign in, then try again. Ensure NEXTAUTH_SECRET and NEXTAUTH_URL are set on Vercel.',
  }
}
