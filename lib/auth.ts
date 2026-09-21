import { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { compare } from 'bcryptjs'
import { prisma } from './prisma'

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
        type: { label: 'Type', type: 'text' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const isAdminAttempt = credentials.type === 'admin'

        if (isAdminAttempt) {
          try {
            const admin = await prisma.adminUser.findUnique({
              where: { email: credentials.email.toLowerCase() },
            })

            if (admin?.password) {
              const isValid = await compare(credentials.password, admin.password)
              if (isValid) {
                return {
                  id: admin.id,
                  email: admin.email,
                  name: admin.name,
                  role: 'admin' as const,
                }
              }
            }
          } catch {
            // table may not exist — fall through to env admin
          }

          if (
            process.env.ADMIN_EMAIL &&
            process.env.ADMIN_PASSWORD &&
            credentials.email.toLowerCase() === process.env.ADMIN_EMAIL.toLowerCase() &&
            credentials.password === process.env.ADMIN_PASSWORD
          ) {
            return {
              id: 'env-admin',
              email: process.env.ADMIN_EMAIL,
              name: 'Admin',
              role: 'admin' as const,
            }
          }

          return null
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email.toLowerCase() },
        })

        if (!user) return null
        if ((user as any).isActive === false) return null

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'user' as const,
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role
        token.id = user.id
      }
      // Keep role stable across refreshes
      if (!token.role && user) {
        token.role = (user as any).role
      }
      return token
    },
    async session({ session, token }) {
      if (session.user) {
        ;(session.user as any).role = token.role
        ;(session.user as any).id = token.id
      }
      return session
    },
  },
  secret: process.env.NEXTAUTH_SECRET,
  // Helps on Vercel preview URLs
  trustHost: true,
} as NextAuthOptions
