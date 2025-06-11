import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// This will show you what's available
console.log(Object.keys(prisma));
