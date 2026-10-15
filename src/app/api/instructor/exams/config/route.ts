import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/session";
import { createOrUpdateExam, createOrUpdateExamForCourse, getExamByLessonId, getExamForCourse } from "@/lib/db/exams.queries";

const ConfigSchema = z.object({
  lessonId: z.number().int().positive().optional(),
  courseId: z.number().int().positive().optional(),
  title: z.string().min(1),
  description: z.string().nullable().optional(),
  passingScore: z.number().int().min(1).max(100).default(70),
  durationMinutes: z.number().int().min(1).max(300).default(60),
  content: z.record(z.string(), z.any()),
  speakingPrompt: z.string().nullable().optional(),
});

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const lessonId = Number(searchParams.get("lessonId"));
  const courseId = Number(searchParams.get("courseId"));

  if (courseId) {
    const exam = await getExamForCourse(courseId);
    return NextResponse.json({ data: exam });
  }

  if (lessonId) {
    const exam = await getExamByLessonId(lessonId);
    return NextResponse.json({ data: exam });
  }

  return NextResponse.json({ error: "lessonId or courseId required" }, { status: 400 });
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.user.role !== "instructor" && session.user.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const parsed = ConfigSchema.safeParse(body);
  if (!parsed.success) {
    const firstIssue = parsed.error.issues?.[0];
    const errorMsg = firstIssue
      ? `${firstIssue.path.join(".") || "field"}: ${firstIssue.message}`
      : "Invalid exam configuration. Passing score must be between 1 and 100.";
    return NextResponse.json({ error: errorMsg }, { status: 422 });
  }

  if (parsed.data.courseId) {
    const exam = await createOrUpdateExamForCourse({
      courseId: parsed.data.courseId,
      title: parsed.data.title,
      description: parsed.data.description,
      passingScore: parsed.data.passingScore,
      durationMinutes: parsed.data.durationMinutes,
      content: parsed.data.content as any,
      speakingPrompt: parsed.data.speakingPrompt,
    });
    return NextResponse.json({ data: exam });
  }

  if (parsed.data.lessonId) {
    const exam = await createOrUpdateExam({
      lessonId: parsed.data.lessonId,
      title: parsed.data.title,
      description: parsed.data.description,
      passingScore: parsed.data.passingScore,
      durationMinutes: parsed.data.durationMinutes,
      content: parsed.data.content as any,
      speakingPrompt: parsed.data.speakingPrompt,
    });
    return NextResponse.json({ data: exam });
  }

  return NextResponse.json({ error: "courseId or lessonId required" }, { status: 400 });
}
