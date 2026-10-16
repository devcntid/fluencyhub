"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { useToast } from "@/components/ui/NotificationProvider";

const TYPES = [
  { v: "youtube_video", l: "YouTube" },
  { v: "live_class", l: "Live Class" },
  { v: "document", l: "Document" },
  { v: "text", l: "Text" },
] as const;

type ContentType = (typeof TYPES)[number]["v"] | "exam";

export type LessonFormValue = {
  id?: number;
  sectionId: number;
  title: string;
  contentType: ContentType;
  youtubeUrl: string | null;
  liveClassUrl: string | null;
  liveClassDatetime: string | null;
  documentUrl: string | null;
  textContent: string | null;
  durationMinutes: number;
  isFreePreview: boolean;
  sortOrder?: number;
};

function toLocalInput(iso: string | null) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function LessonFormDialog({
  sections,
  initial,
  triggerLabel,
  triggerClassName = "btn btn-primary btn-default",
}: {
  sections: Array<{ id: number; title: string }>;
  initial?: LessonFormValue;
  triggerLabel: string;
  triggerClassName?: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? 0);
  const [type, setType] = useState<ContentType>("youtube_video");
  const [url, setUrl] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [text, setText] = useState("");
  const [dur, setDur] = useState(0);
  const [free, setFree] = useState(false);
  const [sortOrder, setSortOrder] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
    setError("");
  };

  const handleStartTimeChange = (val: string) => {
    setStartTime(val);
    if (val && !endTime) {
      const [h, m] = val.split(":").map(Number);
      if (!Number.isNaN(h) && !Number.isNaN(m)) {
        const endH = (h + 1) % 24;
        const endStr = `${String(endH).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
        setEndTime(endStr);
      }
    }
  };

  async function uploadDocument(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      setError(`Ukuran file PDF melebihi batas maksimal 5MB (ukuran file Anda: ${(file.size / (1024 * 1024)).toFixed(1)}MB). Silakan kompres atau pilih file yang lebih kecil.`);
      return;
    }
    setBusy(true);
    clearFieldError("url");
    const form = new FormData();
    form.set("file", file);
    form.set("folder", "documents");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      setError(errJson.error || "Document upload failed.");
      setBusy(false);
      return;
    }
    const json = (await res.json()) as { data?: { url?: string } };
    if (json.data?.url) {
      setUrl(json.data.url);
      clearFieldError("url");
    }
    setBusy(false);
  }

  function fill(v?: LessonFormValue) {
    setTitle(v?.title ?? "");
    setSectionId(v?.sectionId ?? sections[0]?.id ?? 0);
    setType(v?.contentType && v.contentType !== "exam" ? v.contentType : "youtube_video");
    setUrl(v?.youtubeUrl || v?.liveClassUrl || v?.documentUrl || "");

    if (v?.liveClassDatetime) {
      const d = new Date(v.liveClassDatetime);
      if (!Number.isNaN(d.getTime())) {
        const pad = (n: number) => String(n).padStart(2, "0");
        setLiveDate(`${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`);
        setStartTime(`${pad(d.getHours())}:${pad(d.getMinutes())}`);
        const durMin = v?.durationMinutes ?? 60;
        const endD = new Date(d.getTime() + durMin * 60000);
        setEndTime(`${pad(endD.getHours())}:${pad(endD.getMinutes())}`);
      } else {
        setLiveDate("");
        setStartTime("");
        setEndTime("");
      }
    } else {
      setLiveDate("");
      setStartTime("");
      setEndTime("");
    }

    setText(v?.textContent ?? "");
    setDur(v?.durationMinutes ?? 0);
    setFree(Boolean(v?.isFreePreview));
    setSortOrder(v?.sortOrder ?? 1);
    setError("");
    setFieldErrors({});
  }

  function openForm() {
    fill(initial);
    setOpen(true);
  }

  async function save() {
    const errors: Record<string, string> = {};

    const trimmedTitle = title.trim();
    if (!trimmedTitle) {
      errors.title = "Lesson title cannot be empty.";
    }

    if (!sectionId || Number(sectionId) <= 0) {
      errors.sectionId = "Please select a module / section.";
    }

    let finalDuration = dur;
    let liveDatetimeIso: string | null = null;

    if (type === "youtube_video") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        errors.url = "YouTube video URL cannot be empty.";
      } else if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        errors.url = "YouTube URL must start with https:// or http://";
      } else {
        const ytRegex = /(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=|shorts\/))([A-Za-z0-9_-]{6,})/;
        if (!ytRegex.test(trimmedUrl)) {
          errors.url = "Please enter a valid YouTube video URL (e.g. https://www.youtube.com/watch?v=...).";
        }
      }
    } else if (type === "live_class") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        errors.url = "Meeting room URL (Zoom / Google Meet) cannot be empty.";
      } else if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://")) {
        errors.url = "Meeting URL must start with https:// or http://";
      }

      if (!liveDate) {
        errors.liveDate = "Session date cannot be empty.";
      }

      if (!startTime) {
        errors.startTime = "Start time cannot be empty.";
      }

      if (!endTime) {
        errors.endTime = "End time cannot be empty.";
      }

      if (startTime && endTime) {
        const [startH, startM] = startTime.split(":").map(Number);
        const [endH, endM] = endTime.split(":").map(Number);
        const startMin = startH * 60 + startM;
        const endMin = endH * 60 + endM;

        if (endMin <= startMin) {
          errors.endTime = "End time must be after start time.";
        } else {
          finalDuration = endMin - startMin;
        }

        if (liveDate) {
          const [year, month, day] = liveDate.split("-").map(Number);
          const dateObj = new Date(year, month - 1, day, startH, startM, 0);
          liveDatetimeIso = dateObj.toISOString();
        }
      }
    } else if (type === "document") {
      const trimmedUrl = url.trim();
      if (!trimmedUrl) {
        errors.url = "Document file or URL cannot be empty. Please upload a PDF or enter a link.";
      } else if (!trimmedUrl.startsWith("http://") && !trimmedUrl.startsWith("https://") && !trimmedUrl.startsWith("/uploads/")) {
        errors.url = "Document link must start with https:// or http://";
      }
    } else if (type === "text") {
      if (!text.trim()) {
        errors.text = "Study text content cannot be empty.";
      }
    }

    if (type !== "live_class") {
      if (!dur || dur <= 0) {
        errors.dur = "Duration cannot be 0. Please enter estimated minutes (minimum 1 minute).";
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const count = Object.keys(errors).length;
      if (count === 1) {
        setError(Object.values(errors)[0]);
      } else {
        setError(`Please fill in all ${count} required fields marked above.`);
      }
      return;
    }

    setBusy(true);
    setError("");

    const body = {
      sectionId,
      title: trimmedTitle,
      contentType: type,
      youtubeUrl: type === "youtube_video" ? url.trim() || null : null,
      liveClassUrl: type === "live_class" ? url.trim() || null : null,
      liveClassDatetime: liveDatetimeIso,
      liveClassPlatform: type === "live_class" ? "zoom" : null,
      documentUrl: type === "document" ? url.trim() || null : null,
      textContent: type === "text" ? text.trim() || null : null,
      durationMinutes: finalDuration,
      isFreePreview: free,
      sortOrder: initial?.id ? sortOrder : undefined,
    };
    try {
      const res = await fetch(initial?.id ? `/api/instructor/lessons/${initial.id}` : "/api/instructor/lessons", {
        method: initial?.id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      setBusy(false);
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as Record<string, any>;
        let msg = "Save failed";
        if (typeof err?.error === "string") {
          msg = err.error;
        } else if (Array.isArray(err?.error?.formErrors) && err.error.formErrors.length > 0) {
          msg = String(err.error.formErrors[0]);
        } else if (err?.error?.fieldErrors && typeof err.error.fieldErrors === "object") {
          const firstVal = Object.values(err.error.fieldErrors)[0];
          if (Array.isArray(firstVal) && firstVal.length > 0) {
            msg = String(firstVal[0]);
          }
        }
        setError(msg);
        if (msg.toLowerCase().includes("bentrok") || msg.toLowerCase().includes("jadwal")) {
          setFieldErrors((prev) => ({
            ...prev,
            liveDate: "Jadwal bentrok",
            startTime: "Jadwal bentrok",
            endTime: "Jadwal bentrok",
          }));
        } else if (msg.toLowerCase().includes("duplikat nama")) {
          setFieldErrors((prev) => ({
            ...prev,
            title: "Duplikat nama materi",
          }));
        }
        return;
      }
      setOpen(false);
      toast.success(initial?.id ? "Materi pelajaran berhasil diperbarui!" : "Materi pelajaran baru berhasil ditambahkan!");
      router.refresh();
    } catch {
      setBusy(false);
      setError("An unexpected network error occurred. Please try again.");
    }
  }

  return (
    <>
      <button type="button" className={triggerClassName} disabled={sections.length === 0} onClick={openForm}>
        {triggerLabel}
      </button>
      <AdminFormDialog title={initial?.id ? "Edit lesson" : "Add New Lesson"} open={open} onClose={() => setOpen(false)}>
        <div className="grid gap-3.5">
          <label>
            <span className="label flex items-center justify-between">
              <span>Section / Module <span className="text-red-500">*</span></span>
              {fieldErrors.sectionId && (
                <span className="text-xs font-semibold text-red-500">{fieldErrors.sectionId}</span>
              )}
            </span>
            <select
              className={`input ${fieldErrors.sectionId ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
              value={sectionId}
              onChange={(e) => {
                setSectionId(Number(e.target.value));
                clearFieldError("sectionId");
              }}
            >
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span className="label flex items-center justify-between">
              <span>Lesson Title <span className="text-red-500">*</span></span>
              {fieldErrors.title && (
                <span className="text-xs font-semibold text-red-500">{fieldErrors.title}</span>
              )}
            </span>
            <input
              className={`input ${fieldErrors.title ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
              value={title}
              placeholder="e.g. Introduction to Academic Writing"
              onChange={(e) => {
                setTitle(e.target.value);
                clearFieldError("title");
              }}
            />
          </label>

          <div>
            <span className="label">Content Type</span>
            <div className="mt-1 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t.v}
                  type="button"
                  className="btn btn-sm"
                  style={{
                    border: `1.5px solid ${type === t.v ? "var(--brand)" : "var(--border)"}`,
                    background: type === t.v ? "var(--brand-50)" : "#fff",
                    color: type === t.v ? "var(--brand)" : "var(--text-3)",
                  }}
                  onClick={() => {
                    setType(t.v);
                    setUrl("");
                    setFieldErrors({});
                    setError("");
                  }}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>

          {type === "youtube_video" ? (
            <label>
              <span className="label flex items-center justify-between">
                <span>YouTube URL <span className="text-red-500">*</span></span>
                {fieldErrors.url && (
                  <span className="text-xs font-semibold text-red-500">{fieldErrors.url}</span>
                )}
              </span>
              <input
                className={`input ${fieldErrors.url ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                value={url}
                placeholder="https://www.youtube.com/watch?v=..."
                onChange={(e) => {
                  setUrl(e.target.value);
                  clearFieldError("url");
                }}
              />
            </label>
          ) : null}

          {type === "live_class" ? (
            <>
              <label>
                <span className="label flex items-center justify-between">
                  <span>Zoom / Google Meet URL <span className="text-red-500">*</span></span>
                  {fieldErrors.url && (
                    <span className="text-xs font-semibold text-red-500">{fieldErrors.url}</span>
                  )}
                </span>
                <input
                  className={`input ${fieldErrors.url ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    clearFieldError("url");
                  }}
                  placeholder="https://zoom.us/j/... or https://meet.google.com/..."
                />
              </label>

              <label>
                <span className="label flex items-center justify-between">
                  <span>Session Date <span className="text-red-500">*</span></span>
                  {fieldErrors.liveDate && (
                    <span className="text-xs font-semibold text-red-500">{fieldErrors.liveDate}</span>
                  )}
                </span>
                <input
                  className={`input ${fieldErrors.liveDate ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                  type="date"
                  value={liveDate}
                  onChange={(e) => {
                    setLiveDate(e.target.value);
                    clearFieldError("liveDate");
                  }}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="label flex items-center justify-between">
                    <span>Start Time <span className="text-red-500">*</span></span>
                    {fieldErrors.startTime && (
                      <span className="text-xs font-semibold text-red-500">{fieldErrors.startTime}</span>
                    )}
                  </span>
                  <input
                    className={`input ${fieldErrors.startTime ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                    type="time"
                    value={startTime}
                    onChange={(e) => {
                      handleStartTimeChange(e.target.value);
                      clearFieldError("startTime");
                      clearFieldError("endTime");
                    }}
                  />
                </label>
                <label>
                  <span className="label flex items-center justify-between">
                    <span>End Time <span className="text-red-500">*</span></span>
                    {fieldErrors.endTime && (
                      <span className="text-xs font-semibold text-red-500">{fieldErrors.endTime}</span>
                    )}
                  </span>
                  <input
                    className={`input ${fieldErrors.endTime ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                    type="time"
                    value={endTime}
                    onChange={(e) => {
                      setEndTime(e.target.value);
                      clearFieldError("endTime");
                    }}
                  />
                </label>
              </div>

              {startTime && endTime && (() => {
                const [startH, startM] = startTime.split(":").map(Number);
                const [endH, endM] = endTime.split(":").map(Number);
                const diffMin = (endH * 60 + endM) - (startH * 60 + startM);
                if (diffMin <= 0) {
                  return (
                    <p className="rounded-[var(--r)] border border-red-200 bg-red-50 px-3 py-2 text-xs font-semibold text-red-600">
                      ⚠️ End time must be after start time.
                    </p>
                  );
                }
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                const durLabel =
                  hours > 0
                    ? `${hours} hrs ${mins > 0 ? `${mins} mins` : ""}`
                    : `${mins} mins`;
                return (
                  <div className="flex items-center justify-between rounded-[var(--r)] border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-semibold text-blue-700">
                    <span>⏱️ Calculated Duration:</span>
                    <span className="font-extrabold text-blue-900 bg-white px-2.5 py-0.5 rounded shadow-2xs">
                      {diffMin} Minutes ({durLabel.trim()})
                    </span>
                  </div>
                );
              })()}
            </>
          ) : null}

          {type === "document" ? (
            <div className="flex flex-col gap-2">
              <label>
                <span className="label flex items-center justify-between">
                  <span>Upload PDF Document <span className="text-red-500">*</span> <span className="text-[11px] text-zinc-400 font-normal">(Maksimal 5MB)</span></span>
                  {fieldErrors.url && (
                    <span className="text-xs font-semibold text-red-500">{fieldErrors.url}</span>
                  )}
                </span>
                <input
                  className={`input ${fieldErrors.url ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) void uploadDocument(file);
                  }}
                />
              </label>
              <div className="flex items-center gap-2">
                <div className="h-[1px] flex-1 bg-[var(--border)]" />
                <span className="text-xs text-[var(--text-4)]">OR</span>
                <div className="h-[1px] flex-1 bg-[var(--border)]" />
              </div>
              <label>
                <span className="label">Document URL (External Link)</span>
                <input
                  className={`input ${fieldErrors.url ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                  value={url}
                  onChange={(e) => {
                    setUrl(e.target.value);
                    clearFieldError("url");
                  }}
                  placeholder="https://..."
                />
              </label>
              {url && (
                <p className="text-xs text-[var(--brand)] font-medium truncate">
                  Current PDF: {url}
                </p>
              )}
            </div>
          ) : null}

          {type === "text" ? (
            <label>
              <span className="label flex items-center justify-between">
                <span>Text content <span className="text-red-500">*</span></span>
                {fieldErrors.text && (
                  <span className="text-xs font-semibold text-red-500">{fieldErrors.text}</span>
                )}
              </span>
              <textarea
                className={`input min-h-24 ${fieldErrors.text ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                value={text}
                placeholder="Write lesson notes, guidelines, or study materials here..."
                onChange={(e) => {
                  setText(e.target.value);
                  clearFieldError("text");
                }}
              />
            </label>
          ) : null}

          {type !== "live_class" ? (
            <label>
              <span className="label flex items-center justify-between">
                <span>Duration (minutes) <span className="text-red-500">*</span></span>
                {fieldErrors.dur && (
                  <span className="text-xs font-semibold text-red-500">{fieldErrors.dur}</span>
                )}
              </span>
              <input
                className={`input ${fieldErrors.dur ? "!border-red-500 !bg-red-50/20 ring-1 ring-red-500/30" : ""}`}
                type="number"
                min="1"
                placeholder="e.g. 15 (cannot be 0)"
                value={dur === 0 ? "" : dur}
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  setDur(Number.isNaN(val) ? 0 : Math.max(0, val));
                  clearFieldError("dur");
                }}
              />
            </label>
          ) : null}

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
            <span className="text-sm font-semibold">Free Preview</span>
          </label>

          {initial?.id ? (
            <label>
              <span className="label">Sort order</span>
              <input
                className="input"
                type="number"
                min="1"
                value={sortOrder}
                onChange={(e) => setSortOrder(Math.max(1, Number(e.target.value) || 1))}
              />
            </label>
          ) : null}
        </div>

        {error ? (
          <div className="mt-3 flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-xs font-semibold text-red-700 animate-in fade-in duration-150">
            <span className="text-sm shrink-0">⚠️</span>
            <div className="flex-1">
              <p className="font-bold text-red-800">
                {error.toLowerCase().includes("bentrok")
                  ? "Jadwal Bentrok:"
                  : error.toLowerCase().includes("duplikat")
                  ? "Data Duplikat:"
                  : Object.keys(fieldErrors).length > 0
                  ? "Harap lengkapi semua kolom yang wajib diisi:"
                  : "Gagal Menyimpan Materi:"}
              </p>
              <p className="mt-0.5 text-red-600 font-normal leading-relaxed">{error}</p>
            </div>
          </div>
        ) : null}

        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-default" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-default" disabled={busy} onClick={save}>
            {busy ? "Saving..." : "Save Lesson"}
          </button>
        </div>
      </AdminFormDialog>
    </>
  );
}
