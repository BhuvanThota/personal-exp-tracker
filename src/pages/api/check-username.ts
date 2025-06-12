import { NextApiRequest, NextApiResponse } from "next";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { username } = req.query;

  if (!username || typeof username !== "string") {
    return res.status(400).json({ error: "Username is required" });
  }

  // Basic username validation
  const trimmedUsername = username.trim();
  
  if (trimmedUsername.length === 0) {
    return res.status(400).json({ error: "Username cannot be empty" });
  }

  if (trimmedUsername.length < 3) {
    return res.status(400).json({ 
      error: "Username must be at least 3 characters long",
      available: false 
    });
  }

  if (trimmedUsername.length > 30) {
    return res.status(400).json({ 
      error: "Username must be 30 characters or less",
      available: false 
    });
  }

  // Check for valid characters (alphanumeric, underscore, hyphen)
  const validUsernameRegex = /^[a-zA-Z0-9_-]+$/;
  if (!validUsernameRegex.test(trimmedUsername)) {
    return res.status(400).json({ 
      error: "Username can only contain letters, numbers, underscores, and hyphens",
      available: false 
    });
  }

  try {
    const profile = await prisma.userProfile.findUnique({
      where: { username: trimmedUsername },
      select: { id: true },
    });

    const isAvailable = !profile;

    return res.status(200).json({ 
      available: isAvailable,
      username: trimmedUsername,
      message: isAvailable ? "Username is available" : "Username is already taken"
    });
  } catch (error) {
    console.error("Error checking username:", error);
    return res.status(500).json({ error: "Internal server error" });
  } finally {
    // Clean up Prisma connection
    await prisma.$disconnect();
  }
}