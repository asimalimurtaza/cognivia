import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import ChatSession from "@/models/ChatSession";
import { getUserCogniviaContext } from "@/lib/cogniviaContext";
import { streamCogniviaAIChatResponse, GeminiContentTurn } from "@/lib/gemini";

export const dynamic = "force-dynamic";

function sanitizePrompt(input: string): string {
  return input
    .replace(/<script.*?>.*?<\/script>/gi, "")
    .replace(/<\/?[^>]+(>|$)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

// GET: Load all saved chat sessions for the logged-in user
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const chatSessions = await ChatSession.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(chatSessions);
  } catch (error) {
    console.error("Error fetching chat sessions:", error);
    return NextResponse.json(
      { error: "Failed to fetch chat history" },
      { status: 500 }
    );
  }
}

// POST: Stream message response from Cognivia AI & update/create ChatSession
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const body = await req.json();
    const { sessionId, prompt } = body;

    if (!prompt || typeof prompt !== "string" || !prompt.trim()) {
      return NextResponse.json(
        { error: "Prompt text is required." },
        { status: 400 }
      );
    }

    const sanitizedUserPrompt = sanitizePrompt(prompt);

    await connectDB();

    let chatSessionDoc;

    if (sessionId) {
      chatSessionDoc = await ChatSession.findOne({
        _id: sessionId,
        userId,
      });
    }

    if (!chatSessionDoc) {
      const defaultTitle =
        sanitizedUserPrompt.split(" ").slice(0, 5).join(" ") + "...";
      chatSessionDoc = new ChatSession({
        userId,
        title: defaultTitle || "New Chat",
        messages: [],
      });
      await chatSessionDoc.save();
    }

    const contentsHistory: GeminiContentTurn[] = [];

    chatSessionDoc.messages.forEach((msg: { sender: string; content: string }) => {
      contentsHistory.push({
        role: msg.sender === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      });
    });

    contentsHistory.push({
      role: "user",
      parts: [{ text: sanitizedUserPrompt }],
    });

    const systemContext = await getUserCogniviaContext(userId);

    const encoder = new TextEncoder();
    const currentSessionId = chatSessionDoc._id.toString();

    const stream = new ReadableStream({
      async start(controller) {
        let fullResponse = "";

        await streamCogniviaAIChatResponse({
          systemContext,
          contentsHistory,
          onChunk(chunkText) {
            fullResponse += chunkText;
            controller.enqueue(encoder.encode(chunkText));
          },
        });

        chatSessionDoc.messages.push({
          sender: "user",
          content: sanitizedUserPrompt,
          createdAt: new Date(),
        });

        chatSessionDoc.messages.push({
          sender: "assistant",
          content: fullResponse,
          createdAt: new Date(),
        });

        await chatSessionDoc.save();

        controller.close();
      },
    });

    return new NextResponse(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform, no-store",
        "Connection": "keep-alive",
        "X-Content-Type-Options": "nosniff",
        "X-Session-Id": currentSessionId,
        "X-Session-Title": encodeURIComponent(chatSessionDoc.title),
      },
    });
  } catch (error) {
    console.error("Error in Cognivia AI Chat POST:", error);
    return NextResponse.json(
      { error: "Failed to process chat message" },
      { status: 500 }
    );
  }
}
