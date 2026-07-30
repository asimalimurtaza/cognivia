import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import CourseModel from "@/models/Course";
import "@/models/Assignment";
import "@/models/Message";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await connectDB();
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const course = await CourseModel.findById(params.id)
      .populate("assignments")
      .populate("messages");

    if (!course) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    return NextResponse.json(course);
  } catch (error) {
    console.error("Error fetching course:", error);
    return NextResponse.json(
      { error: "Failed to fetch course" },
      { status: 500 }
    );
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const updates = await req.json();
  const updated = await CourseModel.findOneAndUpdate(
    { _id: params.id, createdBy: session.user.id },
    updates,
    { new: true }
  );

  if (!updated) {
    return NextResponse.json(
      { error: "Not found or not allowed" },
      { status: 404 }
    );
  }

  return NextResponse.json(updated);
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await connectDB();
  const session = await getServerSession(authOptions);

  if (!session || session?.user?.role !== "teacher") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const deleted = await CourseModel.findOneAndDelete({
    _id: params.id,
    createdBy: session.user.id,
  });

  if (!deleted) {
    return NextResponse.json(
      { error: "Not found or not allowed" },
      { status: 404 }
    );
  }

  return NextResponse.json({ message: "Deleted successfully" });
}