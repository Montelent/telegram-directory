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
        type: { label: 'Type', type: 'text' }, // 'user' | 'admin'
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const isAdminAttempt = credentials.type === 'admin'

        if (isAdminAttempt) {
          const admin = await prisma.adminUser.findUnique({
            where: { email: credentials.email },
          })

          if (admin?.password) {
            const isValid = await compare(credentials.password, admin.password)
            if (isValid) {
              return {
                id: admin.id,
                email: admin.email,
                name: admin.name,
                role: 'admin',
              }
            }
          }

          if (
            process.env.ADMIN_EMAIL &&
            process.env.ADMIN_PASSWORD &&
            credentials.email === process.env.ADMIN_EMAIL &&
            credentials.password === process.env.ADMIN_PASSWORD
          ) {
            return {
              id: 'env-admin',
              email: process.env.ADMIN_EMAIL,
              name: 'Admin',
              role: 'admin',
            }
          }

          return null
        }

        // Regular user
        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) return null

        const isValid = await compare(credentials.password, user.password)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: 'user',
        }
      },
    }),
  ],
  session: {
    strategy: 'jwt',
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
}
