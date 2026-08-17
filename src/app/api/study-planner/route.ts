import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import connectDB from "@/lib/mongodb";
import StudyPlan from "@/models/StudyPlan";
import Course from "@/models/Course";
import QuizResult from "@/models/QuizResult";
import { generateGeminiContent } from "@/lib/gemini";

interface CourseAssignment {
  title: string;
  dueDate: string;
}

interface CourseItem {
  title: string;
  subject?: string;
  assignments?: CourseAssignment[];
}

interface QuizResultItem {
  percentage: number;
}

interface RawTaskItem {
  title?: string;
  courseTitle?: string;
  priority?: "high" | "medium" | "low";
  scheduledDate?: string;
  recommendedMinutes?: number;
}

// GET: Load user's active study plan
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const plan = await StudyPlan.findOne({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .lean();

    return NextResponse.json(plan || null);
  } catch (error) {
    console.error("Error fetching study plan:", error);
    return NextResponse.json(
      { error: "Failed to fetch study plan" },
      { status: 500 }
    );
  }
}

// POST: Generate AI Smart Study Plan based on course assignment due dates
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    await connectDB();

    const courses = await Course.find({
      $or: [{ createdBy: userId }, { teacher: userId }, { students: userId }],
    })
      .populate("assignments")
      .lean<CourseItem[]>();

    const quizResults = await QuizResult.find({ userID: userId })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean<QuizResultItem[]>();

    let coursesSummary = "";
    courses.forEach((c) => {
      coursesSummary += `Course: "${c.title}" (${c.subject || "General"})\n`;
      if (c.assignments && c.assignments.length > 0) {
        c.assignments.forEach((asg) => {
          coursesSummary += `  - Assignment: "${asg.title}" | Due: ${new Date(asg.dueDate).toLocaleDateString()}\n`;
        });
      }
    });

    let performanceSummary = "";
    if (quizResults.length > 0) {
      performanceSummary = "Recent Quiz Scores:\n";
      quizResults.forEach((q) => {
        performanceSummary += `  - Score: ${q.percentage}%\n`;
      });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const aiPrompt = `Act as an expert AI academic planner for a student.
Given the student's current enrolled courses, assignment deadlines, and quiz scores:

${coursesSummary || "General Education Courses"}
${performanceSummary}

Current Date: ${todayStr}

Generate a structured 7-day study plan (from today onwards) with 6 to 10 actionable daily study tasks.
Return ONLY a valid JSON array of objects with the exact schema:
[
  {
    "title": "Review Physics Chapter 4 notes & practice problems",
    "courseTitle": "Physics",
    "priority": "high",
    "scheduledDate": "${todayStr}",
    "recommendedMinutes": 45,
    "completed": false
  }
]
- Priority must be one of: "high", "medium", "low".
- scheduledDate must be in YYYY-MM-DD format starting from ${todayStr}.
- Do not wrap in extra explanation outside JSON array.`;

    const aiResponseText = await generateGeminiContent(aiPrompt);

    const jsonMatch = aiResponseText.match(/\[[\s\S]*\]/);
    if (!jsonMatch) {
      throw new Error("AI failed to format study plan as JSON.");
    }

    const rawTasks: RawTaskItem[] = JSON.parse(jsonMatch[0]);

    const formattedTasks = rawTasks.map((t) => ({
      title: t.title || "Study Session",
      courseTitle: t.courseTitle || "General",
      priority: t.priority && ["high", "medium", "low"].includes(t.priority) ? t.priority : "medium",
      scheduledDate: t.scheduledDate || todayStr,
      recommendedMinutes: t.recommendedMinutes || 30,
      completed: false,
    }));

    let studyPlanDoc = await StudyPlan.findOne({ userId });
    if (!studyPlanDoc) {
      studyPlanDoc = new StudyPlan({
        userId,
        weekStartDate: new Date(),
        tasks: formattedTasks,
      });
    } else {
      studyPlanDoc.weekStartDate = new Date();
      studyPlanDoc.tasks = formattedTasks;
    }

    await studyPlanDoc.save();
    return NextResponse.json(studyPlanDoc, { status: 201 });
  } catch (error) {
    console.error("Error generating study plan:", error);
    return NextResponse.json(
      { error: (error as Error).message || "Failed to generate study plan." },
      { status: 500 }
    );
  }
}

// PATCH: Toggle task completion status
export async function PATCH(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId, completed } = body;

    if (!taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    await connectDB();
    const plan = await StudyPlan.findOne({ userId: session.user.id });
    if (!plan) {
      return NextResponse.json({ error: "Study plan not found" }, { status: 404 });
    }

    const task = plan.tasks.id(taskId);
    if (task) {
      task.completed = typeof completed === "boolean" ? completed : !task.completed;
      await plan.save();
    }

    return NextResponse.json(plan);
  } catch (error) {
    console.error("Error updating study task:", error);
    return NextResponse.json(
      { error: "Failed to update study task." },
      { status: 500 }
    );
  }
}
