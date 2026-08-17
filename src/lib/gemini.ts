// lib/gemini.ts

export interface GeminiContentTurn {
  role: "user" | "model";
  parts: Array<{ text: string }>;
}

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

const GEMINI_PRIMARY_MODEL = "gemini-3.6-flash";
const GEMINI_FALLBACK_MODEL = process.env.GEMINI_FALLBACK_MODEL;

export async function generateGeminiContent(prompt: string): Promise<string> {
  return generateCogniviaAIChatResponse({
    contentsHistory: [{ role: "user", parts: [{ text: prompt }] }],
  });
}

export async function generateCogniviaAIChatResponse({
  systemContext,
  contentsHistory,
}: {
  systemContext?: string;
  contentsHistory: GeminiContentTurn[];
}): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }

    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_PRIMARY_MODEL}:generateContent?key=${apiKey}`;

    const payload: Record<string, unknown> = {
      contents: contentsHistory,
    };

    if (systemContext) {
      payload.systemInstruction = {
        parts: [{ text: systemContext }],
      };
    }

    let response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        `Primary model ${GEMINI_PRIMARY_MODEL} failed, trying ${GEMINI_FALLBACK_MODEL}...`,
      );
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:generateContent?key=${apiKey}`;
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error Response:", response.status, errorText);
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiApiResponse = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return reply || "I'm sorry, I couldn't generate a response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "I encountered an error connecting to Cognivia AI. Please try again.";
  }
}

export async function streamCogniviaAIChatResponse({
  systemContext,
  contentsHistory,
  onChunk,
}: {
  systemContext?: string;
  contentsHistory: GeminiContentTurn[];
  onChunk: (chunkText: string) => void;
}): Promise<string> {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is not configured.");
    }

    let geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_PRIMARY_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;

    const payload: Record<string, unknown> = {
      contents: contentsHistory,
    };

    if (systemContext) {
      payload.systemInstruction = {
        parts: [{ text: systemContext }],
      };
    }

    let response = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      console.warn(
        `Streaming primary model ${GEMINI_PRIMARY_MODEL} failed (${response.status}), trying ${GEMINI_FALLBACK_MODEL}...`,
      );
      geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_FALLBACK_MODEL}:streamGenerateContent?alt=sse&key=${apiKey}`;
      response = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    }

    if (!response.ok || !response.body) {
      console.error("Gemini stream failed with status:", response.status);
      const fallbackText = await generateCogniviaAIChatResponse({
        systemContext,
        contentsHistory,
      });
      onChunk(fallbackText);
      return fallbackText;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let accumulatedText = "";
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.startsWith("data: ")) {
          const jsonStr = trimmed.slice(6);
          if (jsonStr === "[DONE]") continue;
          try {
            const data: GeminiApiResponse = JSON.parse(jsonStr);
            const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
            if (textChunk) {
              accumulatedText += textChunk;
              onChunk(textChunk);
            }
          } catch {
            // Ignore incomplete line parse errors
          }
        }
      }
    }

    // Process leftover buffer line if any
    if (buffer.trim().startsWith("data: ")) {
      const jsonStr = buffer.trim().slice(6);
      try {
        const data: GeminiApiResponse = JSON.parse(jsonStr);
        const textChunk = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (textChunk) {
          accumulatedText += textChunk;
          onChunk(textChunk);
        }
      } catch {
        // Ignore parse error
      }
    }

    return accumulatedText || "No response generated.";
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    const fallbackText = await generateCogniviaAIChatResponse({
      systemContext,
      contentsHistory,
    });
    onChunk(fallbackText);
    return fallbackText;
  }
}
