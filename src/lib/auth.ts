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
        // First, upsert the User
        const dbUser = await prisma.user.upsert({
          where: { email: user.email! },
          update: {
            ...(user.name != null ? { name: user.name } : {}),
            ...(user.image != null ? { image: user.image } : {}),
          },
          create: {
            email: user.email!,
            name: user.name || "",
            image: user.image,
          },
        });

        // Then, upsert the UserProfile
        await prisma.userProfile.upsert({
          where: { userId: dbUser.id },
          update: {
            // Update profile fields if needed
            displayName: user.name || dbUser.name,
          },
          create: {
            userId: dbUser.id,
            displayName: user.name || dbUser.name,
            username: user.email!.split('@')[0] + '_' + Date.now(), // Ensure unique username
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
      try {
        const dbUser = await prisma.user.findUnique({
          where: { email: session.user?.email ?? "" },
          select: { id: true },
          include: {
            profile: {
              select: { id: true }
            }
          }
        });

        if (dbUser && session.user) {
          session.user.id = dbUser.id;
        }

        return session;
      } catch (error) {
        console.error("Error fetching user session", error);
        return session;
      }
    },
  },
  session: {
    strategy: "jwt" as const, // avoids DB-based session storage
  },
};