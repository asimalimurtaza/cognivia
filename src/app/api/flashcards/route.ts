import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import FlashcardSet from "@/models/FlashcardSet";
import { generateGeminiContent } from "@/lib/gemini";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const flashcardSets = await FlashcardSet.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(flashcardSets);
  } catch (error) {
    console.error("Error fetching flashcards:", error);
    return NextResponse.json(
      { error: "Failed to fetch flashcards" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { title, subject, prompt } = body;

    if (!prompt || !prompt.trim()) {
      return NextResponse.json(
        { error: "Topic or text prompt is required." },
        { status: 400 }
      );
    }

    const aiPrompt = `Generate a set of 6 to 10 high-quality educational flashcards for study on the topic: "${prompt}".
Return ONLY a valid JSON array of objects with keys "front" (question/concept) and "back" (explanation/answer).
Do not include markdown formatting or extra text outside JSON.
Example format:
[
  { "front": "What is the mitochondria?", "back": "The powerhouse of the cell responsible for ATP energy production." }
]`;

    const aiResponseText = await generateGeminiContent(aiPrompt);
    
    // Clean JSON response
    const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI failed to output valid JSON flashcard format.");
    }

    const rawCards = JSON.parse(jsonMatch[0]);

    const formattedCards = rawCards.map((c: { front: string; back: string }) => ({
      front: c.front,
      back: c.back,
      box: 1,
      nextReviewDate: new Date(),
    }));

    await connectDB();
    const newSet = await FlashcardSet.create({
      userId: session.user.id,
      title: title || prompt.substring(0, 30),
      subject: subject || "General",
      cards: formattedCards,
    });

    return NextResponse.json(newSet, { status: 201 });
  } catch (error) {
    console.error("Error generating flashcards:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate flashcard deck." },
      { status: 500 }
    );
  }
}
