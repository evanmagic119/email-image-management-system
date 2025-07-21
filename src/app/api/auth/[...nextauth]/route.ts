// src/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'

const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60
  },

  providers: [
    CredentialsProvider({
      name: '密码登录',
      credentials: {
        password: { label: '密码', type: 'password' }
      },
      async authorize(credentials) {
        if (credentials?.password === process.env.NEXTAUTH_PASSWORD) {
          return { id: '1', name: 'Admin' }
        }
        return null
      }
    })
  ],

  pages: {
    signIn: '/login'
  },

  secret: process.env.NEXTAUTH_SECRET
}

const handler = NextAuth(authOptions)
export { handler as GET, handler as POST }
