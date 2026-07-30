import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const skip = parseInt(searchParams.get("skip") || "0", 10);
    const limit = parseInt(searchParams.get("limit") || "6", 10);

    await connectDB();

    const userId = session.user.id;

    const notes = await Note.find({ userID: userId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Note.countDocuments({ userID: userId });

    return NextResponse.json({ notes, total }, { status: 200 });
  } catch (err) {
    console.error("Notes Fetch Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
