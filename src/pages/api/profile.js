import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming this path is correct
import { prisma } from "@/lib/prisma"; // Fixed: use named import

// Helper function for authorization
async function authorizeRequest() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { authorized: false, user: null };
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return { authorized: false, user: null };
  }
  return { authorized: true, user };
}

export default async function handler(req, res) {
  const method = req.method;
  if (method === "GET") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    try {
      const userProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: { profile: true },
      });
      return res.status(200).json(userProfile?.profile || {});
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  } else if (method === "POST") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    try {
      const body = req.body;
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      if (existingProfile) {
        return res.status(409).json({ error: "Profile already exists. Use PUT to update." });
      }
      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          ...body,
        },
      });
      return res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      return res.status(500).json({ error: "Failed to create profile" });
    }
  } else if (method === "PUT") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    try {
      const body = req.body;
      const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: body,
        create: {
          userId: user.id,
          ...body,
        },
      });
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Profile not found for update. Consider using POST to create." });
      }
      return res.status(500).json({ error: "Failed to update profile" });
    }
  } else if (method === "DELETE") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    try {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      if (!existingProfile) {
        return res.status(404).json({ message: "Profile not found" });
      }
      await prisma.userProfile.delete({ where: { userId: user.id } });
      return res.status(200).json({ message: "Profile deleted successfully" });
    } catch (error) {
      console.error("Error deleting user profile:", error);
      if (error.code === 'P2025') {
        return res.status(404).json({ error: "Profile not found for deletion." });
      }
      return res.status(500).json({ error: "Failed to delete profile" });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}
