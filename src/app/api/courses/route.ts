import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import Course from "@/models/Course";

export async function GET() {
  try {
    await connectDB();
    const courses = await Course.find({}).sort({ createdAt: -1 });
    return NextResponse.json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error);
    return NextResponse.json({ error: "Failed to fetch courses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "teacher") {
      return NextResponse.json(
        { error: "Only teachers can create courses" },
        { status: 403 }
      );
    }

    await connectDB();
    const body = await req.json();
    const { title, description, subject, level } = body;

    if (!title || !subject || !level) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const joinCode = Math.random().toString(36).substring(2, 8).toUpperCase();

    const newCourse = await Course.create({
      title,
      description,
      subject,
      level,
      createdBy: session.user.id,
      teacher: session.user.id,
      joinCode,
      students: [],
      assignments: [],
      liveClasses: [],
      messages: [],
    });

    return NextResponse.json(newCourse, { status: 201 });
  } catch (error) {
    console.error("Error creating course:", error);
    return NextResponse.json(
      { error: "Failed to create course" },
      { status: 500 }
    );
  }
}
