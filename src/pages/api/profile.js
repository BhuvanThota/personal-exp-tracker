import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// Helper function for authorization
async function authorizeRequest() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { authorized: false, user: null };
  }
  
  const user = await prisma.user.findUnique({ 
    where: { email: session.user.email } 
  });
  
  if (!user) {
    return { authorized: false, user: null };
  }
  
  return { authorized: true, user };
}

// Helper function to validate profile data
function validateProfileData(data) {
  const errors = [];
  
  // Required fields validation
  if (!data.displayName || data.displayName.trim().length === 0) {
    errors.push("Display name is required");
  }
  
  if (!data.username || data.username.trim().length === 0) {
    errors.push("Username is required");
  }
  
  // Username validation
  if (data.username) {
    const username = data.username.trim();
    if (username.length < 3) {
      errors.push("Username must be at least 3 characters long");
    }
    if (username.length > 30) {
      errors.push("Username must be 30 characters or less");
    }
    if (!/^[a-zA-Z0-9_-]+$/.test(username)) {
      errors.push("Username can only contain letters, numbers, underscores, and hyphens");
    }
  }
  
  // Phone validation (if provided)
  if (data.phone && data.phone.trim().length > 0) {
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(data.phone.replace(/[\s\-\(\)]/g, ''))) {
      errors.push("Invalid phone number format");
    }
  }
  
  // Date of birth validation (if provided)
  if (data.dob) {
    const dobDate = new Date(data.dob);
    const now = new Date();
    const age = (now - dobDate) / (365.25 * 24 * 60 * 60 * 1000);
    
    if (dobDate > now) {
      errors.push("Date of birth cannot be in the future");
    }
    if (age > 150) {
      errors.push("Invalid date of birth");
    }
  }
  
  return errors;
}

// Helper function to sanitize profile data
function sanitizeProfileData(data) {
  const sanitized = {};
  
  // Handle string fields with trimming
  if (data.displayName) sanitized.displayName = data.displayName.trim();
  if (data.username) sanitized.username = data.username.trim().toLowerCase();
  if (data.phone) sanitized.phone = data.phone.trim();
  if (data.address) sanitized.address = data.address.trim();
  if (data.city) sanitized.city = data.city.trim();
  if (data.state) sanitized.state = data.state.trim();
  if (data.country) sanitized.country = data.country.trim();
  if (data.profilePic) sanitized.profilePic = data.profilePic.trim();
  
  // Handle date field
  if (data.dob) {
    sanitized.dob = new Date(data.dob);
  }
  
  return sanitized;
}

export default async function handler(req, res) {
  const method = req.method;
  
  if (method === "GET") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const userWithProfile = await prisma.user.findUnique({
        where: { id: user.id },
        include: { 
          profile: true,
          accounts: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              type: true,
              currentBalance: true,
              currency: true
            }
          },
          accountGroups: {
            where: { isActive: true },
            select: {
              id: true,
              name: true,
              description: true,
              isDefault: true
            }
          }
        },
      });
      
      if (!userWithProfile) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const response = {
        user: {
          id: userWithProfile.id,
          email: userWithProfile.email,
          name: userWithProfile.name,
          image: userWithProfile.image,
          createdAt: userWithProfile.createdAt,
          updatedAt: userWithProfile.updatedAt
        },
        profile: userWithProfile.profile || null,
        accounts: userWithProfile.accounts || [],
        accountGroups: userWithProfile.accountGroups || [],
        hasProfile: !!userWithProfile.profile
      };
      
      return res.status(200).json(response);
    } catch (error) {
      console.error("Error fetching user profile:", error);
      return res.status(500).json({ error: "Failed to fetch profile" });
    }
  } 
  
  else if (method === "POST") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const sanitizedData = sanitizeProfileData(req.body);
      const validationErrors = validateProfileData(sanitizedData);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }
      
      // Check if profile already exists
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (existingProfile) {
        return res.status(409).json({ 
          error: "Profile already exists. Use PUT to update." 
        });
      }
      
      // Check if username is already taken
      if (sanitizedData.username) {
        const existingUsername = await prisma.userProfile.findUnique({
          where: { username: sanitizedData.username },
        });
        
        if (existingUsername) {
          return res.status(409).json({ 
            error: "Username is already taken" 
          });
        }
      }
      
      const profile = await prisma.userProfile.create({
        data: {
          userId: user.id,
          ...sanitizedData,
        },
      });
      
      return res.status(201).json(profile);
    } catch (error) {
      console.error("Error creating user profile:", error);
      
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'username') {
          return res.status(409).json({ error: "Username is already taken" });
        }
        return res.status(409).json({ error: "Profile data conflicts with existing data" });
      }
      
      return res.status(500).json({ error: "Failed to create profile" });
    }
  } 
  
  else if (method === "PUT") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const sanitizedData = sanitizeProfileData(req.body);
      const validationErrors = validateProfileData(sanitizedData);
      
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: "Validation failed", 
          details: validationErrors 
        });
      }
      
      // Check if username is being changed and if new username is available
      if (sanitizedData.username) {
        const existingUsername = await prisma.userProfile.findUnique({
          where: { username: sanitizedData.username },
        });
        
        if (existingUsername && existingUsername.userId !== user.id) {
          return res.status(409).json({ 
            error: "Username is already taken" 
          });
        }
      }
      
      const profile = await prisma.userProfile.upsert({
        where: { userId: user.id },
        update: {
          ...sanitizedData,
          updatedAt: new Date()
        },
        create: {
          userId: user.id,
          ...sanitizedData,
        },
      });
      
      return res.status(200).json(profile);
    } catch (error) {
      console.error("Error updating user profile:", error);
      
      // Handle unique constraint violations
      if (error.code === 'P2002') {
        const field = error.meta?.target?.[0];
        if (field === 'username') {
          return res.status(409).json({ error: "Username is already taken" });
        }
        return res.status(409).json({ error: "Profile data conflicts with existing data" });
      }
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: "Profile not found for update. Consider using POST to create." 
        });
      }
      
      return res.status(500).json({ error: "Failed to update profile" });
    }
  } 
  
  else if (method === "DELETE") {
    const { authorized, user } = await authorizeRequest();
    if (!authorized) return res.status(401).json({ error: "Unauthorized" });
    
    try {
      const existingProfile = await prisma.userProfile.findUnique({
        where: { userId: user.id },
      });
      
      if (!existingProfile) {
        return res.status(404).json({ 
          error: "Profile not found" 
        });
      }
      
      await prisma.userProfile.delete({ 
        where: { userId: user.id } 
      });
      
      return res.status(200).json({ 
        message: "Profile deleted successfully" 
      });
    } catch (error) {
      console.error("Error deleting user profile:", error);
      
      if (error.code === 'P2025') {
        return res.status(404).json({ 
          error: "Profile not found for deletion." 
        });
      }
      
      return res.status(500).json({ error: "Failed to delete profile" });
    }
  } 
  
  else {
    res.setHeader('Allow', ['GET', 'POST', 'PUT', 'DELETE']);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}