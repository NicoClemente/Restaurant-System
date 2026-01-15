import "server-only";

import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { type NextAuthConfig } from "next-auth";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";

import { prisma } from "@/db";
import { env } from "@/lib/env";

const authConfig: NextAuthConfig = {
  adapter: PrismaAdapter(prisma),
  session: { strategy: "database" },
  secret: env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/staff/login",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = credentials?.email?.toString().toLowerCase().trim();
        const password = credentials?.password?.toString() ?? "";

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({
          where: { email },
        });

        if (!user?.passwordHash) return null;

        const valid = await bcrypt.compare(password, user.passwordHash);
        if (!valid) return null;

        return { id: user.id, email: user.email, name: user.name };
      },
    }),
  ],
  callbacks: {
    async session({ session, user }) {
      if (!session.user) return session;

      const staff = await prisma.restaurantUser.findMany({
        where: { userId: user.id },
        include: {
          role: {
            include: {
              permissions: { include: { permission: true } },
            },
          },
        },
      });

      session.user.id = user.id;
      session.user.restaurants = staff.map((record: {
        restaurantId: string;
        role: {
          key: string;
          permissions: Array<{ permission: { key: string } }>;
        };
        isOwner: boolean;
      }) => ({
        restaurantId: record.restaurantId,
        role: record.role.key,
        permissions: record.role.permissions.map((p) => p.permission.key),
        isOwner: record.isOwner,
      }));

      return session;
    },
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isStaffArea =
        pathname.startsWith("/admin") ||
        pathname.startsWith("/kitchen") ||
        pathname.startsWith("/staff");
      if (!isStaffArea) return true;
      return Boolean(auth?.user);
    },
  },
};

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);
export { authConfig };
