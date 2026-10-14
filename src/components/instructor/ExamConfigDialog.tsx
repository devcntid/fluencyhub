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
  triggerLabel = "Upload Soal Ujian (PDF)",
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
  const [passingScore, setPassingScore] = useState(initialExam?.passingScore || 70);
  const [instructions, setInstructions] = useState(
    initialExam?.content?.examInstructions ||
      "1. Unduh lembar soal PDF di bawah ini.\n2. Kerjakan seluruh instruksi dan pertanyaan secara mandiri.\n3. Unggah lembar jawaban Anda dalam format PDF atau Word pada formulir jawaban di bawah."
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

    setUploading(true);
    setUploadProgress("Mengunggah file soal ke cloud storage...");
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
        throw new Error(json.error || "Gagal mengunggah file soal.");
      }

      setFileUrl(json.data.url);
      setFileName(file.name);
      setUploadProgress("File berhasil diunggah!");
      setTimeout(() => setUploadProgress(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah file soal.");
    } finally {
      setUploading(false);
    }
  }

  async function handleRemedialFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingRemedial(true);
    setUploadProgressRemedial("Mengunggah file soal remedial ke cloud storage...");
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
        throw new Error(json.error || "Gagal mengunggah file soal remedial.");
      }

      setRemedialFileUrl(json.data.url);
      setRemedialFileName(file.name);
      setUploadProgressRemedial("File soal remedial berhasil diunggah!");
      setTimeout(() => setUploadProgressRemedial(""), 3000);
    } catch (err: any) {
      setError(err.message || "Gagal mengunggah file soal remedial.");
    } finally {
      setUploadingRemedial(false);
    }
  }

  async function handleSave() {
    if (!fileUrl) {
      setError("Silakan unggah file soal ujian utama (PDF) terlebih dahulu.");
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
            questionFileUrl: fileUrl,
            questionFileName: fileName || "Soal_Ujian_Akhir.pdf",
            examInstructions: instructions.trim(),
            remedialFileUrl: remedialFileUrl || undefined,
            remedialFileName: remedialFileName || undefined,
            remedialInstructions: remedialInstructions.trim() || undefined,
          },
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan konfigurasi soal ujian.");
      }

      setSuccess("File soal ujian berhasil disimpan dan dipublikasikan ke siswa!");
      router.refresh();
      setTimeout(() => {
        setOpen(false);
        setSuccess("");
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan konfigurasi ujian.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <button
        type="button"
        className={triggerClassName}
        onClick={() => {
          setActiveTab(initialTab);
          setOpen(true);
          setError("");
          setSuccess("");
        }}
      >
        <LandingIcon name={iconName} size={14} color="currentColor" />
        {triggerLabel}
      </button>

      <AdminFormDialog
        title={`Kelola File Soal Ujian — ${courseTitle}`}
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
              <span>1. Soal Ujian Utama</span>
              {fileUrl ? (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  ✓ Siap
                </span>
              ) : (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-full font-bold">
                  Wajib
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
              <span>2. Soal Khusus Remedial</span>
              {remedialFileUrl ? (
                <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-bold">
                  Paket B Aktif
                </span>
              ) : (
                <span className="text-[10px] bg-zinc-200 text-zinc-600 px-2 py-0.5 rounded-full font-semibold">
                  Default (Opsional)
                </span>
              )}
            </button>
          </div>

          {/* TAB 1: SOAL UJIAN UTAMA */}
          {activeTab === "main" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-3 rounded-xl bg-blue-50/60 border border-blue-200/80 text-xs text-blue-900 flex items-start gap-2">
                <LandingIcon name="FileText" size={15} color="#2563eb" />
                <p>
                  <strong>Soal Ujian Utama:</strong> Lembar soal resmi yang wajib diunduh dan dikerjakan pertama kali oleh seluruh siswa kelas ini.
                </p>
              </div>

              {/* Main Question File Upload Card */}
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4 space-y-3">
                <span className="text-xs font-bold text-zinc-800 uppercase tracking-wider block">
                  File Lembar Soal Ujian Utama (PDF / DOC)
                </span>

                {fileUrl ? (
                  <div className="flex items-center justify-between p-3 rounded-xl bg-white border border-blue-200 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-red-50 text-red-600 font-bold text-xs border border-red-100">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-zinc-900 truncate">
                          {fileName || "File_Soal_Ujian.pdf"}
                        </p>
                        <a
                          href={fileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-blue-600 hover:underline inline-flex items-center gap-1"
                        >
                          Buka / Unduh file soal &rarr;
                        </a>
                      </div>
                    </div>
                    <label className="btn btn-secondary btn-sm cursor-pointer text-xs shrink-0">
                      <span>Ganti File</span>
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploading}
                      />
                    </label>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-zinc-300 bg-white hover:bg-zinc-50 hover:border-blue-400 cursor-pointer transition text-center">
                    <div className="h-10 w-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-2">
                      <LandingIcon name="Download" size={20} color="currentColor" />
                    </div>
                    <span className="text-xs font-bold text-zinc-800">
                      {uploading ? "Sedang Mengunggah..." : "Klik untuk Unggah Lembar Soal Utama (PDF / DOC)"}
                    </span>
                    <span className="text-[11px] text-zinc-400 mt-0.5">
                      Maksimal 20MB. Format didukung: PDF, DOCX
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
                  <span className="label font-bold text-xs text-zinc-700">Judul Ujian</span>
                  <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Final Exam — Applied English Proficiency"
                    className="input input-default w-full text-xs sm:text-sm font-semibold"
                  />
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="block">
                    <span className="label font-bold text-xs text-zinc-700">Batas Nilai Kelulusan (Passing Score)</span>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={passingScore}
                      onChange={(e) => setPassingScore(Number(e.target.value))}
                      className="input input-default w-full text-xs sm:text-sm font-semibold"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      Nilai di bawah ini otomatis berstatus <strong>Remedial</strong>.
                    </span>
                  </label>
                </div>

                <label className="block">
                  <span className="label font-bold text-xs text-zinc-700">Petunjuk & Instruksi Pengerjaan untuk Siswa</span>
                  <textarea
                    rows={4}
                    value={instructions}
                    onChange={(e) => setInstructions(e.target.value)}
                    placeholder="Tuliskan petunjuk pengerjaan ujian untuk murid..."
                    className="input input-default w-full text-xs font-medium leading-relaxed"
                  />
                </label>
              </div>

              {/* Quick teaser to Remedial tab */}
              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200/80 flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2 text-amber-900">
                  <LandingIcon name="RotateCcw" size={14} color="#d97706" />
                  <span>
                    Ingin menggunakan lembar soal berbeda khusus ujian remedial?
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab("remedial")}
                  className="font-bold text-amber-700 hover:text-amber-800 hover:underline shrink-0"
                >
                  Buka Tab Soal Remedial &rarr;
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: SOAL KHUSUS REMEDIAL (PAKET B) */}
          {activeTab === "remedial" && (
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Informative Callout Card */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-950 space-y-1.5">
                <div className="flex items-center gap-2 font-black text-amber-900">
                  <LandingIcon name="RotateCcw" size={15} color="#d97706" />
                  <span>SOAL KHUSUS REMEDIAL (PAKET B) — OPSIONAL</span>
                </div>
                <p className="leading-relaxed text-amber-900/90 text-[11px]">
                  Unggah file lembar soal ini jika Anda ingin siswa yang <strong>tidak lulus (nilai &lt; {passingScore})</strong> mengerjakan paket soal baru yang berbeda dari ujian utama.
                </p>
                <div className="pt-1.5 flex items-center gap-2 text-[11px]">
                  <span className="font-bold text-amber-900">Kebijakan Sistem:</span>
                  {remedialFileUrl ? (
                    <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold">
                      ✓ Soal Khusus Paket B Aktif diunduh siswa remedial
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-md bg-zinc-200 text-zinc-700 font-semibold">
                      Siswa remedial otomatis menggunakan Lembar Soal Utama untuk perbaikan
                    </span>
                  )}
                </div>
              </div>

              {/* Remedial Question File Upload Card */}
              <div className="rounded-2xl border border-amber-200/90 bg-amber-50/30 p-4 space-y-3">
                <span className="text-xs font-bold text-amber-950 uppercase tracking-wider block">
                  File Lembar Soal Khusus Remedial (PDF / DOC)
                </span>

                {remedialFileUrl ? (
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-white border border-amber-300 shadow-xs">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-900 font-bold text-xs border border-amber-200">
                        PDF
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <p className="text-xs font-bold text-zinc-900 truncate">
                            {remedialFileName || "File_Soal_Remedial.pdf"}
                          </p>
                          <span className="bg-amber-100 text-amber-800 text-[9px] font-extrabold px-1.5 py-0.2 rounded-full border border-amber-200 shrink-0">
                            Paket B
                          </span>
                        </div>
                        <a
                          href={remedialFileUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[11px] font-semibold text-amber-700 hover:underline inline-flex items-center gap-1"
                        >
                          Buka file remedial &rarr;
                        </a>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <label className="btn btn-secondary btn-sm cursor-pointer text-xs shrink-0 font-bold">
                        <span>Ganti File</span>
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
                        className="btn btn-secondary btn-sm text-xs text-red-600 hover:bg-red-50 hover:border-red-200 shrink-0"
                      >
                        Hapus File
                      </button>
                    </div>
                  </div>
                ) : (
                  <label className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-amber-300 bg-white hover:bg-amber-50/50 hover:border-amber-400 cursor-pointer transition text-center">
                    <div className="h-10 w-10 rounded-full bg-amber-100 text-amber-800 flex items-center justify-center mb-2">
                      <LandingIcon name="Download" size={20} color="currentColor" />
                    </div>
                    <span className="text-xs font-bold text-amber-950">
                      {uploadingRemedial ? "Sedang Mengunggah..." : "+ Unggah Lembar Soal Khusus Remedial (Paket B)"}
                    </span>
                    <span className="text-[11px] text-zinc-500 mt-0.5">
                      Biarkan kosong jika ingin murid merevisi dari lembar soal utama
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
                    Instruksi Tambahan Khusus Remedial (Opsional)
                  </span>
                  <textarea
                    rows={3}
                    value={remedialInstructions}
                    onChange={(e) => setRemedialInstructions(e.target.value)}
                    placeholder="Contoh: Kerjakan hanya pertanyaan nomor 4 dan 5 pada lembar remedial ini untuk melengkapi nilai Anda..."
                    className="input input-default w-full text-xs font-medium leading-relaxed bg-white"
                  />
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Instruksi ini akan tampil khusus di halaman portal siswa yang berstatus remedial.
                  </span>
                </label>
              </div>
            </div>
          )}

          {/* Dialog Action Buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-zinc-200">
            <span className="text-[11px] text-zinc-400">
              {activeTab === "main" ? "Sedang mengedit: Soal Utama" : "Sedang mengedit: Soal Remedial (Paket B)"}
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="btn btn-secondary btn-sm"
                onClick={() => setOpen(false)}
                disabled={saving}
              >
                Tutup
              </button>
              <button
                type="button"
                className="btn btn-primary btn-sm bg-blue-600 hover:bg-blue-700"
                onClick={handleSave}
                disabled={saving || uploading || uploadingRemedial}
              >
                {saving
                  ? "Menyimpan..."
                  : activeTab === "remedial"
                  ? "Simpan Soal Remedial"
                  : "Simpan & Publikasikan Ujian"}
              </button>
            </div>
          </div>
        </div>
      </AdminFormDialog>
    </>
  );
}
