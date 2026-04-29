import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "./prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          if (!credentials?.username || !credentials?.password) return null;

          const user = await prisma.user.findUnique({
            where: { username: credentials.username as string },
          });

          console.log("[auth] lookup:", credentials.username, "found:", !!user);
          if (!user) return null;

          const valid = await bcrypt.compare(
            credentials.password as string,
            user.passwordHash
          );

          console.log("[auth] password valid:", valid);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.displayName,
            email: user.email,
            role: user.role,
            username: user.username,
          };
        } catch (err) {
          console.error("[auth] error:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.username = (user as any).username;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        (session.user as any).role = token.role;
        (session.user as any).username = token.username;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: { strategy: "jwt" },
});

export async function requireAuth() {
  const session = await auth();
  if (!session?.user) throw new Error("Unauthorized");
  return session.user;
}

export async function requireAdmin() {
  const user = await requireAuth();
  if ((user as any).role !== "admin") throw new Error("Forbidden");
  return user;
}