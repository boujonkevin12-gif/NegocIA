import { prisma } from "@/lib/prisma";
import type { Adapter, AdapterSession, AdapterAccount, AdapterUser } from "@auth/core/adapters";

export function PrismaAdapter(): Adapter {
  return {
    async createUser(user: Omit<AdapterUser, "id">) {
      return prisma.user.create({
        data: {
          id: crypto.randomUUID(),
          email: user.email!,
          name: user.name ?? null,
          avatarUrl: user.image ?? null,
          emailVerified: user.emailVerified ?? null,
          passwordHash: "",
        },
      });
    },

    async getUser(id: string) {
      return prisma.user.findUnique({ where: { id } });
    },

    async getUserByEmail(email: string) {
      return prisma.user.findUnique({ where: { email } });
    },

    async getUserByAccount({ providerAccountId, provider }: { providerAccountId: string; provider: string }) {
      const account = await prisma.account.findUnique({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
      if (!account) return null;
      return prisma.user.findUnique({ where: { id: account.userId } });
    },

    async updateUser(user: Partial<AdapterUser> & { id: string }) {
      return prisma.user.update({
        where: { id: user.id },
        data: {
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          avatarUrl: user.image ?? undefined,
          emailVerified: user.emailVerified ?? undefined,
        },
      });
    },

    async deleteUser(userId: string) {
      return prisma.user.delete({ where: { id: userId } });
    },

    async linkAccount(account: AdapterAccount) {
      await prisma.account.create({
        data: {
          userId: account.userId,
          type: account.type,
          provider: account.provider,
          providerAccountId: account.providerAccountId,
          refresh_token: account.refresh_token ?? null,
          access_token: account.access_token ?? null,
          expires_at: account.expires_at ?? null,
          token_type: account.token_type ?? null,
          scope: account.scope ?? null,
          id_token: account.id_token ?? null,
          session_state: account.session_state != null ? String(account.session_state) : null,
        },
      });
    },

    async unlinkAccount({ providerAccountId, provider }: Pick<AdapterAccount, "provider" | "providerAccountId">) {
      await prisma.account.delete({
        where: { provider_providerAccountId: { provider, providerAccountId } },
      });
    },

    async createSession({ sessionToken, userId, expires }: { sessionToken: string; userId: string; expires: Date }) {
      return prisma.session.create({
        data: { sessionToken, userId, expires },
      });
    },

    async getSessionAndUser(sessionToken: string) {
      const session = await prisma.session.findUnique({ where: { sessionToken } });
      if (!session) return null;
      const user = await prisma.user.findUnique({ where: { id: session.userId } });
      if (!user) return null;
      return { session, user };
    },

    async updateSession({ sessionToken, expires }: { sessionToken: string; userId: string; expires: Date }) {
      return prisma.session.update({
        where: { sessionToken },
        data: { expires },
      });
    },

    async deleteSession(sessionToken: string) {
      return prisma.session.delete({ where: { sessionToken } });
    },

    async useVerificationToken({ identifier, token }: { identifier: string; token: string }) {
      const verificationToken = await prisma.verificationToken.findUnique({
        where: { identifier_token: { identifier, token } },
      });
      if (!verificationToken) return null;
      await prisma.verificationToken.delete({
        where: { identifier_token: { identifier, token } },
      });
      return verificationToken;
    },
  };
}
