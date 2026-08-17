import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { generateCogniviaAIChatResponse } from "@/lib/gemini";
import pdfParse from "pdf-parse";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const contentType = req.headers.get("content-type") || "";

    let documentText = "";
    let userQuery = "";
    let documentName = "Uploaded Document";

    if (contentType.includes("multipart/form-data")) {
      const formData = await req.formData();
      const file = formData.get("file") as File | null;
      userQuery = (formData.get("query") as string) || "Summarize this document.";
      const rawText = formData.get("documentText") as string | null;

      if (file) {
        documentName = file.name;
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        if (file.name.endsWith(".pdf") || file.type === "application/pdf") {
          const pdfData = await pdfParse(buffer);
          documentText = pdfData.text;
        } else {
          documentText = buffer.toString("utf-8");
        }
      } else if (rawText) {
        documentText = rawText;
      }
    } else {
      const body = await req.json();
      documentText = body.documentText || "";
      userQuery = body.query || "Summarize this document.";
      documentName = body.documentName || "Document";
    }

    if (!documentText || !documentText.trim()) {
      return NextResponse.json(
        { error: "No document text or file provided for analysis." },
        { status: 400 }
      );
    }

    // Truncate document text if extremely long to fit within token context window
    const truncatedText = documentText.substring(0, 15000);

    const systemContext = `You are Cognivia Document AI, an expert study assistant.\n` +
      `Below is the text content from document "${documentName}":\n\n` +
      `--- DOCUMENT START ---\n${truncatedText}\n--- DOCUMENT END ---\n\n` +
      `Instructions: Answer the user's question clearly, concisely, and accurately based on the document content above. If asking for a summary, provide bullet points of key takeaways and concepts.`;

    const aiResponseText = await generateCogniviaAIChatResponse({
      systemContext,
      contentsHistory: [{ role: "user", parts: [{ text: userQuery }] }],
    });

    return NextResponse.json({
      documentName,
      extractedTextLength: documentText.length,
      response: aiResponseText,
    });
  } catch (error) {
    console.error("Error processing document AI query:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to analyze document." },
      { status: 500 }
    );
  }
}
