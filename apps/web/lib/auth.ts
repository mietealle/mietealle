import { NextAuthOptions, getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import type { Role, VerificationStatus } from "@mietealle/db";

export const authOptions: NextAuthOptions = {
  session: { strategy: "jwt" },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials.password) return null;

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });

        if (!user?.hashedPassword) return null;

        // Block suspended or GDPR-deleted accounts
        if (user.status === "SUSPENDED") return null;
        if (user.status === "DELETED") return null;

        const valid = await bcrypt.compare(
          credentials.password,
          user.hashedPassword
        );
        if (!valid) return null;

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          verificationStatus: user.verificationStatus,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token["role"] = (user as typeof user & { role: Role }).role;
        token["verificationStatus"] = (
          user as typeof user & { verificationStatus: string }
        ).verificationStatus;
        token["id"] = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token["id"] as string;
        session.user.role = token["role"] as Role;
        session.user.verificationStatus = token[
          "verificationStatus"
        ] as VerificationStatus;
      }
      return session;
    },
  },
};

export const getSession = () => getServerSession(authOptions);

export async function requireSession() {
  const session = await getSession();
  if (!session) throw new Error("Unauthorized");
  return session;
}

export async function requireRole(role: Role) {
  const session = await requireSession();
  if (session.user.role !== role) throw new Error("Forbidden");
  return session;
}

/**
 * API-route-safe version: returns the session or null (never throws).
 * Use in route handlers to avoid unhandled 500s.
 */
export async function getSessionForApi() {
  try {
    return await getSession();
  } catch {
    return null;
  }
}

/**
 * Returns the session if the user has the required role, otherwise null.
 */
export async function requireRoleForApi(role: Role) {
  try {
    const session = await getSession();
    if (!session || session.user.role !== role) return null;
    return session;
  } catch {
    return null;
  }
}
