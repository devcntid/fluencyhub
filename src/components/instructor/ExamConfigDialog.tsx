"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { LandingIcon } from "@/components/landing/LandingIcon";
import type { Exam } from "@/types/db";

export function ExamConfigDialog({
  courseId,
  courseTitle,
  initialExam,
  triggerLabel = "Upload Exam Paper (PDF)",
  triggerClassName = "btn btn-secondary btn-sm",
  initialTab = "main",
  iconName = "FileText",
}: {
  courseId: number;
  courseTitle: string;
  initialExam?: Exam | null;
  triggerLabel?: string;
  triggerClassName?: string;
  initialTab?: "main" | "remedial";
  iconName?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"main" | "remedial">(initialTab);

  const [title, setTitle] = useState(initialExam?.title || `Final Examination — ${courseTitle}`);
  const [passingScore, setPassingScore] = useState<number | string>(initialExam?.passingScore || 70);
  const [instructions, setInstructions] = useState(
    initialExam?.content?.examInstructions ||
      "1. Download the question paper PDF below.\n2. Complete all instructions and questions independently.\n3. Upload your completed answer sheet in PDF or DOC format using the submission form below."
  );

  const [fileUrl, setFileUrl] = useState(initialExam?.content?.questionFileUrl || "");
  const [fileName, setFileName] = useState(initialExam?.content?.questionFileName || "");

  const [remedialFileUrl, setRemedialFileUrl] = useState(initialExam?.content?.remedialFileUrl || "");
  const [remedialFileName, setRemedialFileName] = useState(initialExam?.content?.remedialFileName || "");
  const [remedialInstructions, setRemedialInstructions] = useState(
    initialExam?.content?.remedialInstructions || ""
  );

  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [uploadingRemedial, setUploadingRemedial] = useState(false);
  const [uploadProgressRemedial, setUploadProgressRemedial] = useState("");

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Load existing exam config when dialog opens
  useEffect(() => {
    if (open && courseId) {
      fetch(`/api/instructor/exams/config?courseId=${courseId}`)
        .then((res) => res.json())
        .then((data) => {
          if (data?.data) {
            const ex = data.data;
            if (ex.title) setTitle(ex.title);
            if (ex.passingScore) setPassingScore(ex.passingScore);
            if (ex.content?.examInstructions) setInstructions(ex.content.examInstructions);
            if (ex.content?.questionFileUrl) setFileUrl(ex.content.questionFileUrl);
            if (ex.content?.questionFileName) setFileName(ex.content.questionFileName);
            if (ex.content?.remedialFileUrl) setRemedialFileUrl(ex.content.remedialFileUrl);
            if (ex.content?.remedialFileName) setRemedialFileName(ex.content.remedialFileName);
            if (ex.content?.remedialInstructions) setRemedialInstructions(ex.content.remedialInstructions);
          }
        })
        .catch(() => {});
    }
  }, [open, courseId]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`Ukuran file soal ujian melebihi batas maksimal 5MB (ukuran file Anda: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Silakan kompres atau pilih file yang lebih kecil.`);
      e.target.value = "";
      return;
    }

    setUploading(true);
    setUploadProgress("Uploading exam question paper to cloud storage...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "exams");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload exam paper.");
      }

      setFileUrl(json.data.url);
      setFileName(file.name);
      setUploadProgress("File uploaded successfully!");
      setTimeout(() => setUploadProgress(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload exam paper.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemedialFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
    if (file.size > MAX_FILE_SIZE) {
      setError(`Ukuran file soal remedial melebihi batas maksimal 5MB (ukuran file Anda: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Silakan kompres atau pilih file yang lebih kecil.`);
      e.target.value = "";
      return;
    }

    setUploadingRemedial(true);
    setUploadProgressRemedial("Uploading remedial question paper to cloud storage...");
    setError("");

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("folder", "exams");

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to upload remedial paper.");
      }

      setRemedialFileUrl(json.data.url);
      setRemedialFileName(file.name);
      setUploadProgressRemedial("Remedial paper uploaded successfully!");
      setTimeout(() => setUploadProgressRemedial(""), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to upload remedial paper.");
    } finally {
      setUploadingRemedial(false);
    }
  }

  async function handleSave() {
    if (!fileUrl) {
      setError("Please upload the main exam paper (PDF) first.");
      return;
    }

    const numScore = Number(passingScore);
    if (!passingScore || isNaN(numScore) || numScore < 1 || numScore > 100) {
      setError("Passing Score Threshold (KKM) must be between 1 and 100.");
      return;
    }

    setSaving(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/instructor/exams/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId,
          title: title.trim() || `Final Examination — ${courseTitle}`,
          passingScore: Number(passingScore) || 70,
          description: instructions.trim(),
          content: {
            questionFileUrl: fileUrl || undefined,
            questionFileName: fileUrl ? (fileName || "Final_Exam_Paper.pdf") : undefined,
            examInstructions: instructions.trim(),
            remedialFileUrl: remedialFileUrl || undefined,
            remedialFileName: remedialFileUrl ? (remedialFileName || undefined) : undefined,
            remedialInstructions: remedialInstructions.trim() || undefined,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to save exam configuration.");
      }

      setSuccess("Exam paper saved and published to students successfully!");
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to save exam configuration.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={`inline-flex items-center justify-center gap-1.5 text-center cursor-pointer ${triggerClassName || "btn btn-secondary btn-sm"}`}
        onClick={() => {
          setActiveTab(initialTab);
          setOpen(true);
          setError("");
          setSuccess("");
        }}
      >
        {iconName && <LandingIcon name={iconName} size={14} color="currentColor" className="shrink-0" />}
        <span className="leading-none">{triggerLabel}</span>
      </button>

      <AdminFormDialog
        title={`Manage Exam Papers — ${courseTitle}`}
        open={open}
        onClose={() => setOpen(false)}
        maxWidth="min(720px, 95vw)"
      >
        <div className="space-y-4">
          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700">
              {error}
            </div>
          )}

          {success && (
            <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-700">
              {success}
            </div>
          )}

          {/* Differentiated Tabs Navigation */}
          <div className="grid grid-cols-2 gap-2 p-1.5 bg-zinc-100 rounded-2xl border border-zinc-200">
            <button
              type="button"
              onClick={() => setActiveTab("main")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "main"
                  ? "bg-white text-blue-700 shadow-sm border border-zinc-200"
                  : "text-zinc-600 hover:text-zinc-900 hover:bg-zinc-200/50"
              }`}
            >
              <LandingIcon name="FileText" size={15} color={activeTab === "main" ? "#2563eb" : "currentColor"} />
              <span>1. Main Exam Paper</span>
              {fileUrl ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  ✓ Ready
                </span>
              ) : (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  Required
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("remedial")}
              className={`flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                activeTab === "remedial"
                  ? "bg-white text-amber-800 shadow-sm border border-amber-300"
                  : "text-zinc-600 hover:text-amber-900 hover:bg-amber-100/50"
              }`}
            >
              <LandingIcon name="RotateCcw" size={15} color={activeTab === "remedial" ? "#d97706" : "currentColor"} />
              <span>2. Remedial Paper</span>
              {remedialFileUrl ? (
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Set B Active
                </span>
              ) : (
                <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
                  Default (Optional)
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: MAIN EXAM PAPER */}
          {activeTab === "main" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
                <LandingIcon name="FileText" size={15} color="#2563eb" />
                <p>
                  <strong>Main Exam Paper:</strong> Official question paper that all students in this course must download and complete first.
                </p>
              </div>

              {/* Main Question File Upload Card */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                    Main Exam Question Paper (PDF / DOC)
                  </span>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/70 border border-blue-200 px-2 py-0.5 rounded-md">
                    Maks. 5MB
                  </span>
                </div>

                {fileUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-100">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {fileName || "Final_Exam_Paper.pdf"}
                        </p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          View / Download question paper &rarr;
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <label className="btn btn-secondary btn-sm cursor-pointer text-xs shrink-0 font-bold">
                        <span>Replace File</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleFileUpload}
                          disabled={uploading}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setFileUrl("");
                          setFileName("");
                        }}
                        className="btn btn-secondary btn-sm text-xs text-red-600 hover:bg-red-50 hover:border-red-200 shrink-0 font-bold flex items-center gap-1"
                      >
                        <LandingIcon name="Trash" size={13} color="currentColor" />
                        <span>Remove File</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-zinc-300 bg-white hover:bg-zinc-50 hover:border-blue-400 cursor-pointer transition text-center">
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <LandingIcon name="Download" size={20} color="currentColor" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">
                      {uploading ? "Uploading..." : "Click to Upload Main Question Paper (PDF / DOC)"}
                    </span>
                    <span className="text-[11px] text-zinc-500 font-medium mt-0.5">
                      Maksimal 5MB. Format yang didukung: PDF, DOCX
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleFileUpload}
                      disabled={uploading}
                    />
                  </label>
                )}

                {uploadProgress && (
                  <p className="text-xs font-semibold text-blue-600 animate-pulse">{uploadProgress}</p>
                )}
              </div>

              {/* Exam Details */}
              <div className="space-y-3">
                <label className="block">
                  <span className="label font-bold text-xs text-zinc-700">Exam Title</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="e.g. Final Exam — Applied English Proficiency"
                    className="input input-default w-full text-xs sm:text-sm font-semibold"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label font-bold text-xs text-zinc-700 flex items-center justify-between">
                      <span>Passing Score Threshold (KKM)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">Scale: 1 – 100</span>
                    </span>
                    <div className="relative mt-1">
                      <input
                        type="number"
                        min={1}
                        max={100}
                        value={passingScore}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === "") {
                            setPassingScore("");
                            return;
                          }
                          const val = parseInt(raw, 10);
                          if (isNaN(val)) return;
                          if (val > 100) {
                            setPassingScore(100);
                          } else if (val < 0) {
                            setPassingScore(0);
                          } else {
                            setPassingScore(val);
                          }
                        }}
                        onBlur={() => {
                          if (passingScore === "" || Number(passingScore) < 1) {
                            setPassingScore(70);
                          }
                        }}
                        placeholder="e.g. 70"
                        className={`input input-default w-full text-xs sm:text-sm font-semibold pr-12 ${
                          passingScore !== "" && (Number(passingScore) < 1 || Number(passingScore) > 100)
                            ? "border-red-400 focus:border-red-500 bg-red-50/40 text-red-900"
                            : ""
                        }`}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 pointer-events-none">
                        / 100
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-[10px] mt-1 text-zinc-400">
                      <span>Scores below this threshold require <strong>Remedial</strong>.</span>
                      {passingScore !== "" && (Number(passingScore) < 1 || Number(passingScore) > 100) && (
                        <span className="font-bold text-red-600">Must be 1 - 100</span>
                      )}
                    </div>
                  </label>
                </div>

                <label className="block">
                  <span className="label font-bold text-xs text-zinc-700">Instructions & Guidelines for Students</span>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Write exam guidelines and instructions for students..."
                    className="input input-default w-full text-xs font-medium leading-relaxed"
                  />
                </label>
              </div>

              {/* Quick teaser to Remedial tab */}
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <LandingIcon name="RotateCcw" size={14} color="#d97706" />
                  <span>
                    Need a separate question paper specifically for remedial exams?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("remedial")}
                  className="font-bold text-amber-700 hover:text-amber-800 hover:underline shrink-0"
                >
                  Open Remedial Tab &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: REMEDIAL EXAM PAPER (SET B) */}
          {activeTab === "remedial" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Informative Callout Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <LandingIcon name="RotateCcw" size={15} color="#d97706" />
                  <span>REMEDIAL EXAM PAPER (SET B) — OPTIONAL</span>
                </div>
                <p className="leading-relaxed text-amber-900/90 text-[11px]">
                  Upload this question paper if you want students who <strong>did not pass (score &lt; {passingScore})</strong> to work on a fresh set of questions instead of revising the main paper.
                </p>
                <div className="pt-1.5 flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-amber-900">System Policy:</span>
                  {remedialFileUrl ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      ✓ Dedicated Set B paper will be downloaded by remedial students
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 font-semibold">
                      Remedial students automatically use the Main Exam Paper for revisions
                    </span>
                  )}
                </div>
              </div>

              {/* Remedial Question File Upload Card */}
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                    Remedial Question Paper (PDF / DOC)
                  </span>
                  <span className="text-[11px] font-bold text-amber-800 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded-md">
                    Maks. 5MB
                  </span>
                </div>

                {remedialFileUrl ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-amber-300 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {remedialFileName || "Remedial_Question_Paper.pdf"}
                          </p>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                            Set B
                          </span>
                        </div>
                        <a
                          href={remedialFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-amber-700 hover:underline inline-flex items-center gap-1"
                        >
                          View remedial paper &rarr;
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="btn btn-secondary btn-sm cursor-pointer text-xs shrink-0 font-bold">
                        <span>Replace File</span>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx"
                          className="hidden"
                          onChange={handleRemedialFileUpload}
                          disabled={uploadingRemedial}
                        />
                      </label>
                      <button
                        type="button"
                        onClick={() => {
                          setRemedialFileUrl("");
                          setRemedialFileName("");
                        }}
                        className="btn btn-secondary btn-sm text-xs text-red-600 hover:bg-red-50 hover:border-red-200 shrink-0 font-bold flex items-center gap-1"
                      >
                        <LandingIcon name="Trash" size={13} color="currentColor" />
                        <span>Remove File</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-amber-300 bg-white hover:bg-amber-50/50 hover:border-amber-400 cursor-pointer transition text-center">
                    <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                      <LandingIcon name="Download" size={20} color="currentColor" />
                    </div>
                    <span className="text-xs font-bold text-amber-950">
                      {uploadingRemedial ? "Uploading..." : "+ Upload Remedial Question Paper (Set B)"}
                    </span>
                    <span className="text-[11px] text-amber-800 font-semibold mt-0.5">
                      Maksimal 5MB. Format yang didukung: PDF, DOCX
                    </span>
                    <span className="text-[10px] text-zinc-500">
                      (Kosongkan jika siswa remedial menggunakan lembar soal utama)
                    </span>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={handleRemedialFileUpload}
                      disabled={uploadingRemedial}
                    />
                  </label>
                )}

                {uploadProgressRemedial && (
                  <p className="text-xs font-semibold text-amber-700 animate-pulse">{uploadProgressRemedial}</p>
                )}
              </div>

              {/* Remedial Instructions */}
              <div className="space-y-1">
                <label className="block">
                  <span className="label font-bold text-xs text-zinc-700">
                    Additional Instructions for Remedial (Optional)
                  </span>
                  <textarea
                    rows={3}
                    value={remedialInstructions}
                    onChange={(e) => setRemedialInstructions(e.target.value)}
                    placeholder="e.g. Complete questions 4 and 5 on this remedial sheet to improve your score..."
                    className="input input-default w-full text-xs font-medium leading-relaxed bg-white"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    This instruction note will only appear on the exam portal for remedial students.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
            <span className="text-[11px] text-zinc-400">
              {activeTab === "main" ? "Currently editing: Main Exam Paper" : "Currently editing: Remedial Paper (Set B)"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Close
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={saving || uploading || uploadingRemedial}
              >
                {saving
                  ? "Saving..."
                  : activeTab === "remedial"
                  ? "Save Remedial Paper"
                  : "Save & Publish Exam"}
              </button>
            </div>
          </div>
        </div>
      </AdminFormDialog>
    </>
  );
}
