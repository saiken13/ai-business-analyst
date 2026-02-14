import GitHubProvider from "next-auth/providers/github"
import type { NextAuthOptions } from "next-auth"
import { PrismaAdapter } from "@next-auth/prisma-adapter"
import { prisma } from "@/lib/prisma"

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },

  providers: [
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      // First login: user exists, store user.id on token
      if (user?.id) {
        token.id = user.id
      }

      // If old token / refresh without id, backfill using email
      if (!token.id && token.email) {
        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
          select: { id: true },
        })
        if (dbUser?.id) token.id = dbUser.id
      }

      return token
    },

    async session({ session, token }) {
      // Always ensure session.user exists
      if (!session.user) {
        session.user = { name: null, email: null, image: null }
      }

      // Attach id only if we actually have it
      if (token?.id) {
        // TypeScript: add custom field
        ;(session.user as { id?: string }).id = token.id as string
      }

      return session
    },
  },
}
