import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import QuizResult from "@/models/QuizResult";
import Quiz from "@/models/Quiz";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { userID, quizID, score, total, percentage } = body;

    if (
      !userID ||
      !quizID ||
      score === undefined ||
      total === undefined ||
      percentage === undefined
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    if (session.user.id !== userID) {
      return NextResponse.json({ error: "User ID mismatch" }, { status: 403 });
    }

    await connectDB();

    const createdResult = await QuizResult.create({
      userID,
      quizID,
      score,
      total,
      percentage,
    });

    await Quiz.updateOne(
      { $or: [{ _id: quizID }, { quizID }] },
      { $set: { score, isTaken: true } }
    );

    return NextResponse.json(
      {
        message: "Result stored successfully",
        resultId: createdResult._id,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Results POST Error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
