import { authOptions } from "@/app/api/auth/[...nextauth]/options";
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import dbConnect from "@/lib/mongodb";
import Assignment from "@/models/Assignment";
import AssignmentSubmission from "@/models/AssignmentSubmission";
import JSZip from "jszip";

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  await dbConnect();
  const session = await getServerSession(authOptions);

  if (!session || !session.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const assignmentId = params.id;

  const assignment = await Assignment.findById(assignmentId).populate(
    "courseId",
    "title"
  );
  if (!assignment) {
    return NextResponse.json(
      { error: "Assignment not found" },
      { status: 404 }
    );
  }

  const submissions = await AssignmentSubmission.find({
    assignmentId: assignmentId,
  }).populate("studentId", "name email");

  if (!submissions || submissions.length === 0) {
    return NextResponse.json(
      { error: "No submission found or file not available" },
      { status: 404 }
    );
  }

  const zip = new JSZip();

  for (const submission of submissions) {
    try {
      const response = await fetch(submission.fileUrl);
      if (!response.ok) {
        console.error(`Failed to fetch file: ${submission.fileUrl}`);
        continue;
      }
      const data = await response.arrayBuffer();
      const fileExtension = submission.fileUrl.split(".").pop();
      const filename = `${submission.studentId.name}_${assignment.title}.${fileExtension}`;
      zip.file(filename, data);
    } catch (err) {
      console.error(`Failed to fetch file: ${submission.fileUrl}`, err);
    }
  }

  const zipBuffer = await zip.generateAsync({ type: "nodebuffer" });

  return new NextResponse(zipBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${assignment.courseId.title}_${assignment.title}_submissions.zip"`,
    },
  });
}
