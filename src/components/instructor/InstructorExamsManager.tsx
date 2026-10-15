import Link from "next/link";
import { LandingIcon } from "@/components/landing/LandingIcon";
import { ExamConfigDialog } from "@/components/instructor/ExamConfigDialog";
import type { Exam } from "@/types/db";
import type { InstructorSubmissionRow } from "@/components/instructor/InstructorExamReviewWorkbench";

export function InstructorExamsManager({
  courseId,
  courseTitle,
  exam,
  submissions,
}: {
  courseId: number;
  courseTitle: string;
  exam: Exam | null;
  submissions: InstructorSubmissionRow[];
}) {
  const pendingCount = submissions.filter((s) => s.status === "pending").length;
  const passedCount = submissions.filter((s) => s.status === "passed").length;
  const failedCount = submissions.filter((s) => s.status === "failed").length;

  return (
    <div className="space-y-6">
      {/* Top Action Bar in Exam Tab */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-zinc-50 border border-zinc-200/80 rounded-2xl p-4">
        <div>
          <span className="text-xs font-bold text-zinc-800 flex items-center gap-1.5">
            <LandingIcon name="Award" size={15} color="#2563eb" />
            Exam & Grading Panel — {courseTitle}
          </span>
          <p className="text-[11px] text-zinc-500 mt-0.5">
            Manage exam question papers (PDF) and grade student submissions.
          </p>
        </div>

        <Link
          href={`/instructor/exams/review?courseId=${courseId}`}
          className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-1.5 shadow-xs shrink-0"
        >
          <LandingIcon name="Award" size={14} color="#fff" />
          <span>Grading & Review Panel &rarr;</span>
          {pendingCount > 0 && (
            <span className="ml-1 rounded-full bg-amber-500 text-white px-1.5 py-0.2 text-[10px] font-extrabold">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>

      {/* 2 Dedicated Cards: Soal Utama vs Soal Remedial */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Soal Ujian Utama (Reguler) */}
        <div className="rounded-2xl border border-blue-200/80 bg-gradient-to-br from-white to-blue-50/30 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700 font-bold border border-blue-200">
                <LandingIcon name="FileText" size={20} color="currentColor" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-blue-800">
                    1. Main Exam Paper
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-800 font-extrabold px-1.5 py-0.2 rounded-md border border-blue-200">
                    Regular (Required)
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-900 truncate mt-0.5">
                  {exam?.title || `Final Examination — ${courseTitle}`}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  Passing Score: <strong>{exam?.passingScore || 70}</strong> &bull; Maks. 5MB &bull; Taken first by all enrolled students
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                exam?.content?.questionFileUrl
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-200"
                  : "bg-red-100 text-red-700 border border-red-200"
              }`}
            >
              {exam?.content?.questionFileUrl ? "✓ File Ready" : "No File Uploaded"}
            </span>
          </div>

          <div className="pt-2 border-t border-zinc-100 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              {exam?.content?.questionFileUrl ? (
                <div className="flex items-center gap-1.5 text-zinc-700 text-[11px] truncate">
                  <span className="font-semibold truncate">
                    📄 {exam.content.questionFileName || "Exam_Paper.pdf"}
                  </span>
                  <a
                    href={exam.content.questionFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline font-bold text-[10px] shrink-0"
                  >
                    (Open File)
                  </a>
                </div>
              ) : (
                <span className="text-red-600 text-[11px] font-semibold">
                  Students cannot take the exam yet
                </span>
              )}
            </div>

            <ExamConfigDialog
              courseId={courseId}
              courseTitle={courseTitle}
              initialExam={exam}
              initialTab="main"
              iconName={exam?.content?.questionFileUrl ? "FileText" : "Plus"}
              triggerLabel={exam?.content?.questionFileUrl ? "Manage Main Paper" : "Upload Main Paper"}
              triggerClassName="btn btn-secondary btn-sm shrink-0 font-bold border-blue-200 text-blue-900 hover:bg-blue-50"
            />
          </div>
        </div>

        {/* Card 2: Soal Khusus Remedial (Paket B) */}
        <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-white to-amber-50/40 p-5 shadow-xs flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-800 font-bold border border-amber-200">
                <LandingIcon name="RotateCcw" size={20} color="currentColor" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-black uppercase tracking-wider text-amber-900">
                    2. Remedial Exam Paper
                  </span>
                  <span className="text-[10px] bg-amber-100 text-amber-800 font-extrabold px-1.5 py-0.2 rounded-md border border-amber-200">
                    Set B (Optional)
                  </span>
                </div>
                <p className="text-sm font-bold text-zinc-900 truncate mt-0.5">
                  {exam?.content?.remedialFileName || (exam?.content?.remedialFileUrl ? "Remedial Paper Attached" : "Default: Same as Main Exam Paper")}
                </p>
                <p className="text-[11px] text-zinc-500 mt-0.5">
                  For students who have not passed (&lt; {exam?.passingScore || 70}) &bull; Maks. 5MB
                </p>
              </div>
            </div>

            <span
              className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full shrink-0 ${
                exam?.content?.remedialFileUrl
                  ? "bg-amber-100 text-amber-900 border border-amber-300"
                  : "bg-zinc-100 text-zinc-600 border border-zinc-200"
              }`}
            >
              {exam?.content?.remedialFileUrl ? "Set B Active" : "Same as Main"}
            </span>
          </div>

          <div className="pt-2 border-t border-amber-100 flex items-center justify-between gap-3 text-xs">
            <div className="min-w-0">
              {exam?.content?.remedialFileUrl ? (
                <div className="flex items-center gap-1.5 text-zinc-700 text-[11px] truncate">
                  <span className="font-semibold text-amber-950 truncate">
                    🔄 {exam.content.remedialFileName || "Remedial_Paper.pdf"}
                  </span>
                  <a
                    href={exam.content.remedialFileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-amber-800 hover:underline font-bold text-[10px] shrink-0"
                  >
                    (Open File)
                  </a>
                </div>
              ) : (
                <span className="text-zinc-500 text-[11px]">
                  Remedial students will revise using the main exam paper
                </span>
              )}
            </div>

            <ExamConfigDialog
              courseId={courseId}
              courseTitle={courseTitle}
              initialExam={exam}
              initialTab="remedial"
              iconName={exam?.content?.remedialFileUrl ? "RotateCcw" : "Plus"}
              triggerLabel={exam?.content?.remedialFileUrl ? "Manage Remedial Paper" : "Upload Remedial Paper"}
              triggerClassName={`btn btn-sm shrink-0 font-bold ${
                exam?.content?.remedialFileUrl
                  ? "btn-secondary border-amber-300 bg-amber-50/70 text-amber-900 hover:bg-amber-100"
                  : "bg-amber-600 hover:bg-amber-700 text-white border border-amber-600 shadow-xs"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-4 rounded-xl bg-white border border-zinc-200 shadow-xs">
          <span className="text-zinc-400 font-semibold block">Total Submissions</span>
          <span className="text-2xl font-black text-zinc-900 mt-1 block">{submissions.length}</span>
          <span className="text-[11px] text-zinc-400">Answer sheets submitted</span>
        </div>
        <div className="p-4 rounded-xl bg-amber-50/60 border border-amber-200 shadow-xs">
          <span className="text-amber-700 font-semibold block">Pending Review</span>
          <span className="text-2xl font-black text-amber-700 mt-1 block">{pendingCount}</span>
          <span className="text-[11px] text-amber-600 font-medium">Needs grading</span>
        </div>
        <div className="p-4 rounded-xl bg-emerald-50/60 border border-emerald-200 shadow-xs">
          <span className="text-emerald-700 font-semibold block">Passed & Certified</span>
          <span className="text-2xl font-black text-emerald-700 mt-1 block">{passedCount}</span>
          <span className="text-[11px] text-emerald-600 font-medium">Nilai &ge; {exam?.passingScore || 70} (Lulus)</span>
        </div>
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 shadow-xs">
          <span className="text-zinc-500 font-semibold block">Needs Remedial</span>
          <span className="text-2xl font-black text-zinc-700 mt-1 block">{failedCount}</span>
          <span className="text-[11px] text-zinc-400">Nilai &lt; {exam?.passingScore || 70} (Remedial)</span>
        </div>
      </div>

      {/* Submissions List Section */}
      <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-zinc-900 font-[family-name:var(--font-heading)]">
            Student Submissions ({submissions.length})
          </h2>
          {pendingCount > 0 && (
            <span className="text-xs font-bold text-amber-700 bg-amber-100 px-2.5 py-0.5 rounded-full">
              {pendingCount} submission{pendingCount > 1 ? "s" : ""} pending grading
            </span>
          )}
        </div>

        {submissions.length === 0 ? (
          <div className="p-10 text-center rounded-xl bg-zinc-50 border border-dashed border-zinc-200 text-zinc-400 text-xs">
            <LandingIcon name="FileText" size={32} color="currentColor" className="mx-auto mb-2 opacity-50" />
            <p className="font-semibold text-zinc-600">No Student Submissions Yet</p>
            <p className="mt-1">
              Students will download the exam questions from the Final Exam tab and submit their completed answer sheets here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto -mx-1 px-1">
            <table className="w-full min-w-[620px] text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-100 text-[11px] font-bold text-zinc-400 uppercase tracking-wider">
                  <th className="pb-3 pl-2">Student</th>
                  <th className="pb-3">Submitted At</th>
                  <th className="pb-3">Answer Sheet</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Final Score</th>
                  <th className="pb-3 text-right pr-2">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {submissions.map((s) => {
                  return (
                    <tr key={s.id} className="hover:bg-zinc-50/70 transition">
                      <td className="py-3.5 pl-2">
                        <p className="font-bold text-zinc-900">{s.studentName}</p>
                        <p className="text-[11px] text-zinc-400">{s.studentEmail}</p>
                      </td>
                      <td className="py-3.5 text-zinc-500 whitespace-nowrap">
                        {new Date(s.submittedAt).toLocaleDateString("en-US", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3.5">
                        {s.answers?.answerFileUrl ? (
                          <a
                            href={s.answers.answerFileUrl}
                            target="_blank"
                            rel="noreferrer"
                            download
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 font-bold text-[11px] border border-blue-100 hover:bg-blue-100 transition"
                          >
                            <LandingIcon name="Download" size={12} color="currentColor" />
                            <span className="truncate max-w-[140px]">
                              {s.answers.answerFileName || "Answer_Sheet.pdf"}
                            </span>
                          </a>
                        ) : (
                          <span className="text-zinc-400 italic text-[11px]">No file attached</span>
                        )}
                      </td>
                      <td className="py-3.5">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            s.status === "passed"
                              ? "bg-emerald-100 text-emerald-800"
                              : s.status === "failed"
                              ? "bg-red-100 text-red-800"
                              : "bg-amber-100 text-amber-800"
                          }`}
                        >
                          {s.status === "passed" ? "Passed" : s.status === "failed" ? "Failed" : "Pending"}
                        </span>
                      </td>
                      <td className="py-3.5 font-bold">
                        {s.finalScore !== null ? (
                          <span className="text-blue-600 text-sm">{s.finalScore} / 100</span>
                        ) : (
                          <span className="text-zinc-400 font-medium italic text-[11px]">Not Graded</span>
                        )}
                      </td>
                      <td className="py-3.5 text-right pr-2">
                        <Link
                          href={`/instructor/exams/review?courseId=${courseId}&submissionId=${s.id}`}
                          className={`btn btn-sm text-xs font-bold inline-flex items-center gap-1 ${
                            s.status === "pending"
                              ? "btn-primary bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                              : "btn-secondary text-zinc-700 hover:bg-zinc-100"
                          }`}
                        >
                          {s.status === "pending" ? "Grade Submission →" : "Edit Grade →"}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
