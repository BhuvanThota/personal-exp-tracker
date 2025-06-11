import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // Assuming this path is correct
import prisma from "@/lib/prisma"; // Assuming this path is correct
import { NextResponse } from "next/server";

// Helper function for authorization
async function authorizeRequest() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return { authorized: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  const user = await prisma.user.findUnique({ where: { email: session.user.email } });
  if (!user) {
    return { authorized: false, response: NextResponse.json({ error: "User not found" }, { status: 404 }) };
  }
  return { authorized: true, user };
}

// GET /api/user/profile (assuming this route handler is in app/api/user/profile/route.js)
export async function GET() { 
  const { authorized, response, user } = await authorizeRequest();
  if (!authorized) return response;

  try {
    const userProfile = await prisma.user.findUnique({
      where: { id: user.id }, // Use user.id which is more robust than email after fetching
      include: { profile: true },
    });

    return NextResponse.json(userProfile?.profile || {});
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Failed to fetch profile" }, { status: 500 });
  }
}

// POST /api/user/profile
export async function POST(req) { 
  const { authorized, response, user } = await authorizeRequest();
  if (!authorized) return response;

  try {
    const body = await req.json();

    // Check if a profile already exists to prevent duplicate creation
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (existingProfile) {
      return NextResponse.json({ error: "Profile already exists. Use PUT to update." }, { status: 409 });
    }

    const profile = await prisma.userProfile.create({
      data: {
        userId: user.id,
        ...body,
      },
    });

    return NextResponse.json(profile, { status: 201 }); // 201 Created
  } catch (error) {
    console.error("Error creating user profile:", error);
    return NextResponse.json({ error: "Failed to create profile" }, { status: 500 });
  }
}

// PUT /api/user/profile
export async function PUT(req) { 
  const { authorized, response, user } = await authorizeRequest();
  if (!authorized) return response;

  try {
    const body = await req.json();

    // Use upsert to create if not exists, or update if exists
    const profile = await prisma.userProfile.upsert({
      where: { userId: user.id },
      update: body,
      create: {
        userId: user.id,
        ...body, // Include body for initial creation
      },
    });

    // If you strictly want PUT to only update and not create,
    // you would use update and handle the error if not found.
    // const profile = await prisma.userProfile.update({
    //   where: { userId: user.id },
    //   data: body,
    // });

    return NextResponse.json(profile);
  } catch (error) {
    console.error("Error updating user profile:", error);
    // Specifically catch P2025 error for record not found if not using upsert
    if (error.code === 'P2025') {
        return NextResponse.json({ error: "Profile not found for update. Consider using POST to create." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}

// DELETE /api/user/profile
export async function DELETE() { 
  const { authorized, response, user } = await authorizeRequest();
  if (!authorized) return response;

  try {
    // Optional: Check if profile exists before attempting to delete
    const existingProfile = await prisma.userProfile.findUnique({
      where: { userId: user.id },
    });

    if (!existingProfile) {
      return NextResponse.json({ message: "Profile not found" }, { status: 404 });
    }

    await prisma.userProfile.delete({ where: { userId: user.id } });

    return NextResponse.json({ message: "Profile deleted successfully" }, { status: 200 }); // Explicit 200 OK
  } catch (error) {
    console.error("Error deleting user profile:", error);
    // Specific error code for record not found
    if (error.code === 'P2025') {
        return NextResponse.json({ error: "Profile not found for deletion." }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete profile" }, { status: 500 });
  }
}