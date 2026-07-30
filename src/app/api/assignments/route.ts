import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import Course from "@/models/Course";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || session.user.role !== "teacher") {
      return NextResponse.json({ error: "Unauthorized or insufficient permissions" }, { status: 403 });
    }

    await connectDB();
    const body = await req.json();
    const { courseId, title, description, dueDate, fileUrl, files } = body;

    if (!courseId || !title || !dueDate) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const createdAssignment = await Assignment.create({
      courseId,
      title,
      description: description || "",
      dueDate: new Date(dueDate),
      fileUrl: fileUrl || (Array.isArray(files) && files.length > 0 ? files[0] : ""),
    });

    await Course.findByIdAndUpdate(courseId, {
      $push: { assignments: createdAssignment._id },
    });

    return NextResponse.json(createdAssignment, { status: 201 });
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json({ error: "Failed to create assignment" }, { status: 500 });
  }
}
