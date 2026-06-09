import { AuthOptions } from "next-auth";
import DiscordProvider from "next-auth/providers/discord";
import { prisma } from "./prisma";

export const authOptions: AuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      authorization: { params: { scope: "identify email" } },
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (account?.provider === "discord") {
        const discordProfile = profile as any;
        await prisma.user.upsert({
          where: { discordId: discordProfile.id },
          update: {
            discordUsername: discordProfile.username,
            avatar: discordProfile.avatar
              ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
              : null,
            email: user.email,
          },
          create: {
            discordId: discordProfile.id,
            discordUsername: discordProfile.username,
            avatar: discordProfile.avatar
              ? `https://cdn.discordapp.com/avatars/${discordProfile.id}/${discordProfile.avatar}.png`
              : null,
            email: user.email,
            points: 0,
          },
        });
      }
      return true;
    },
    async session({ session, token }) {
      if (token.sub) {
        const dbUser = await prisma.user.findUnique({
          where: { discordId: token.sub },
        });
        if (dbUser) {
          (session.user as any).id = dbUser.id;
          (session.user as any).points = dbUser.points;
          (session.user as any).discordId = dbUser.discordId;
        }
      }
      return session;
    },
    async jwt({ token, account, profile }) {
      if (account?.provider === "discord") {
        token.sub = (profile as any).id;
      }
      return token;
    },
  },
  pages: { signIn: "/login" },
};
