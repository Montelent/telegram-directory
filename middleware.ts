import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Already on login
    if (path === '/admin/login') {
      return NextResponse.next()
    }

    // Must be admin role for all other /admin routes
    if (token?.role !== 'admin') {
      const login = new URL('/admin/login', req.nextUrl.origin)
      // Same-origin callback only — never jump to another *.vercel.app deployment
      login.searchParams.set('callbackUrl', `${req.nextUrl.origin}/admin`)
      return NextResponse.redirect(login)
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        if (req.nextUrl.pathname === '/admin/login') return true
        // Let the function above handle role redirect; require some session first
        return !!token
      },
    },
    pages: {
      signIn: '/admin/login',
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
