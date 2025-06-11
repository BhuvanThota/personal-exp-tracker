import GoogleProvider from "next-auth/providers/google";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export const authOptions = {
    
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    // Called after successful sign-in
    async signIn({ user }: { user: { email?: string | null; name?: string | null; image?: string | null } }) {
      try {
        await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            ...(user.name != null ? { name: user.name } : {}),
            ...(user.image != null ? { image: user.image } : {}),
          },
          create: {
            email: user.email!,
            name: user.name ?? "",
            image: user.image,
          },
        });
        return true;
      } catch (error) {
        console.error("Error saving user to DB", error);
        return false;
      }
    },

    // Add the user ID to the session
    async session({ session }: { session: { user?: { email?: string | null; id?: string } } }) {
          const dbUser = await prisma.user.findUnique({
        where: { email: session.user?.email ?? "" },
        select: { id: true },
      });

      if (dbUser && session.user) {
        session.user.id = dbUser.id;
      }

      return session;
    },
  },
  session: {
    strategy: "jwt", // avoids DB-based session storage
  },
};
