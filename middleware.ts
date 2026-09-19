import { withAuth } from 'next-auth/middleware'
import { NextResponse } from 'next/server'

export default withAuth(
  function middleware(req) {
    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow the login page without a token
        if (req.nextUrl.pathname === '/admin/login') {
          return true
        }
        // All other /admin routes require a token
        return !!token
      },
    },
  }
)

export const config = {
  matcher: ['/admin/:path*'],
}
