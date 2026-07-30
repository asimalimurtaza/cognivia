// lib/gemini.ts

type GeminiApiResponse = {
  candidates?: Array<{
    content?: {
      parts?: Array<{
        text?: string;
      }>;
    };
  }>;
};

export async function generateGeminiContent(prompt: string) {
  try {
    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(geminiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data: GeminiApiResponse = await response.json();
    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;

    return reply || "No response.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "Something went wrong.";
  }
}
