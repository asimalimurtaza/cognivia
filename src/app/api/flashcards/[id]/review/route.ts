import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import FlashcardSet from "@/models/FlashcardSet";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    const body = await req.json();
    const { cardId, rating } = body; // rating: "hard" | "good" | "easy"

    if (!cardId || !rating) {
      return NextResponse.json(
        { error: "cardId and rating are required." },
        { status: 400 }
      );
    }

    await connectDB();
    const setDoc = await FlashcardSet.findOne({
      _id: id,
      userId: session.user.id,
    });

    if (!setDoc) {
      return NextResponse.json({ error: "Flashcard set not found." }, { status: 404 });
    }

    const card = setDoc.cards.id(cardId);
    if (!card) {
      return NextResponse.json({ error: "Card not found in deck." }, { status: 404 });
    }

    let newBox = card.box || 1;
    if (rating === "hard") {
      newBox = 1;
    } else if (rating === "good") {
      newBox = Math.min(5, newBox + 1);
    } else if (rating === "easy") {
      newBox = 5;
    }

    // Days interval for Leitner boxes: Box 1 = 1d, 2 = 2d, 3 = 4d, 4 = 7d, 5 = 14d
    const daysIntervalMap: Record<number, number> = {
      1: 1,
      2: 2,
      3: 4,
      4: 7,
      5: 14,
    };

    const daysToAdd = daysIntervalMap[newBox] || 1;
    const nextReviewDate = new Date();
    nextReviewDate.setDate(nextReviewDate.getDate() + daysToAdd);

    card.box = newBox;
    card.lastReviewed = new Date();
    card.nextReviewDate = nextReviewDate;

    await setDoc.save();

    return NextResponse.json(setDoc);
  } catch (error) {
    console.error("Error updating card review:", error);
    return NextResponse.json(
      { error: "Failed to update flashcard review status." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = params;
    await connectDB();
    await FlashcardSet.findOneAndDelete({ _id: id, userId: session.user.id });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting flashcard set:", error);
    return NextResponse.json(
      { error: "Failed to delete flashcard set" },
      { status: 500 }
    );
  }
}
