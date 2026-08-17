import connectDB from "@/lib/mongodb";
import Note from "@/models/Note";
import Quiz from "@/models/Quiz";
import QuizResult from "@/models/QuizResult";
import Course from "@/models/Course";

interface NoteDoc {
  prompt?: string;
  createdAt: Date;
}

interface QuizDoc {
  topic?: string;
  isTaken?: boolean;
  score?: number;
}

interface QuizResultDoc {
  quizID?: string;
  score?: number;
  total?: number;
  percentage?: number;
}

interface CourseDoc {
  title?: string;
  subject?: string;
  level?: string;
}

export async function getUserCogniviaContext(userId: string): Promise<string> {
  try {
    await connectDB();

    const [notes, quizzes, quizResults, courses] = await Promise.all([
      Note.find({ userID: userId }).sort({ createdAt: -1 }).limit(5).lean<NoteDoc[]>(),
      Quiz.find({ userID: userId }).sort({ createdAt: -1 }).limit(5).lean<QuizDoc[]>(),
      QuizResult.find({ userID: userId }).sort({ createdAt: -1 }).limit(5).lean<QuizResultDoc[]>(),
      Course.find({
        $or: [{ createdBy: userId }, { teacher: userId }, { students: userId }],
      })
        .sort({ createdAt: -1 })
        .limit(5)
        .lean<CourseDoc[]>(),
    ]);

    let contextText = `You are Cognivia AI, an intelligent, empathetic, and expert educational assistant built exclusively for Cognivia.\n`;
    contextText += `Your goal is to help the user with their studies, course materials, note reviews, and quiz preparation.\n\n`;

    contextText += `--- USER'S COGNIVIA PLATFORM DATA CONTEXT ---\n`;

    if (courses && courses.length > 0) {
      contextText += `\nEnrolled & Created Courses:\n`;
      courses.forEach((c, i) => {
        contextText += `${i + 1}. Title: "${c.title || "Untitled"}" | Subject: ${c.subject || "N/A"} | Level: ${c.level || "N/A"}\n`;
      });
    }

    if (notes && notes.length > 0) {
      contextText += `\nRecently Generated Notes:\n`;
      notes.forEach((n, i) => {
        const promptSummary = n.prompt ? n.prompt.substring(0, 100) : "Study Note";
        contextText += `${i + 1}. Topic/Prompt: "${promptSummary}" (Created: ${new Date(n.createdAt).toLocaleDateString()})\n`;
      });
    }

    if (quizzes && quizzes.length > 0) {
      contextText += `\nRecent Quizzes:\n`;
      quizzes.forEach((q, i) => {
        contextText += `${i + 1}. Topic: "${q.topic || "Untitled"}" | Taken: ${q.isTaken ? "Yes" : "No"} | Score: ${q.score || 0}\n`;
      });
    }

    if (quizResults && quizResults.length > 0) {
      contextText += `\nRecent Quiz Performance Results:\n`;
      quizResults.forEach((r, i) => {
        contextText += `${i + 1}. Quiz ID: ${r.quizID || "N/A"} | Score: ${r.score}/${r.total} (${r.percentage}%)\n`;
      });
    }

    contextText += `\n--- INSTRUCTIONS FOR RESPONDING ---\n`;
    contextText += `- Address the user directly as Cognivia AI.\n`;
    contextText += `- Refer to the user's specific notes, quizzes, or courses if relevant to their prompt.\n`;
    contextText += `- Be clear, structured, encouraging, and educationally precise.\n`;

    return contextText;
  } catch (error) {
    console.error("Error gathering user Cognivia context:", error);
    return "You are Cognivia AI, an educational assistant for the Cognivia platform.";
  }
}
