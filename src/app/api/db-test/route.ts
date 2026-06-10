import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    // Attempt a simple query
    const userCount = await prisma.user.count();
    const users = await prisma.user.findMany({
      select: { email: true, role: true, active: true },
    });
    
    return NextResponse.json({
      success: true,
      message: "Database connection successful!",
      userCount,
      users,
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        databaseUrlStart: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.substring(0, 30) + "..."
          : "undefined",
      },
    });
  } catch (err: any) {
    return NextResponse.json({
      success: false,
      message: "Database connection failed!",
      error: err.message || err.toString(),
      code: err.code || "unknown",
      stack: err.stack || "",
      env: {
        hasDatabaseUrl: !!process.env.DATABASE_URL,
        hasAuthSecret: !!process.env.AUTH_SECRET,
        databaseUrlStart: process.env.DATABASE_URL
          ? process.env.DATABASE_URL.substring(0, 30) + "..."
          : "undefined",
      },
    }, { status: 500 });
  }
}
