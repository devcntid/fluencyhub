"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";

const TYPES = [
  { v: "youtube_video", l: "YouTube" },
  { v: "live_class", l: "Live Class" },
  { v: "document", l: "Document" },
  { v: "text", l: "Text" },
] as const;

export function AddLessonDialog({
  sections,
  courseId,
}: {
  sections: Array<{ id: number; title: string }>;
  courseId: number;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [sectionId, setSectionId] = useState(sections[0]?.id ?? 0);
  const [type, setType] = useState<(typeof TYPES)[number]["v"]>("youtube_video");
  const [url, setUrl] = useState("");
  const [liveDate, setLiveDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [text, setText] = useState("");
  const [dur, setDur] = useState(0);
  const [free, setFree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    setBusy(true);
    const form = new FormData();
    form.set("file", file);
    form.set("folder", "documents");
    const res = await fetch("/api/upload", { method: "POST", body: form });
    if (!res.ok) {
      setError("Document upload failed.");
      setBusy(false);
      return;
    }
    const json = (await res.json()) as { data?: { url?: string } };
    if (json.data?.url) setUrl(json.data.url);
    setBusy(false);
  }

  async function save() {
    if (!title) {
      setError("Title is required");
      return;
    }
    setBusy(true);
    setError("");

    let finalDuration = dur;
    let liveDatetimeIso: string | null = null;

    if (type === "live_class") {
      if (!liveDate || !startTime || !endTime) {
        setError("Tanggal pelaksanaan, waktu mulai, dan waktu selesai live class wajib diisi.");
        setBusy(false);
        return;
      }
      const [startH, startM] = startTime.split(":").map(Number);
      const [endH, endM] = endTime.split(":").map(Number);
      const startMin = startH * 60 + startM;
      const endMin = endH * 60 + endM;

      if (endMin <= startMin) {
        setError("Waktu selesai harus lebih besar dari waktu mulai.");
        setBusy(false);
        return;
      }
      finalDuration = endMin - startMin;

      const [year, month, day] = liveDate.split("-").map(Number);
      const dateObj = new Date(year, month - 1, day, startH, startM, 0);
      liveDatetimeIso = dateObj.toISOString();
    }

    const res = await fetch("/api/instructor/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        title,
        contentType: type,
        youtubeUrl: type === "youtube_video" ? url || null : null,
        liveClassUrl: type === "live_class" ? url || null : null,
        liveClassDatetime: liveDatetimeIso,
        liveClassPlatform: type === "live_class" ? "zoom" : null,
        documentUrl: type === "document" ? url || null : null,
        textContent: type === "text" ? text || null : null,
        durationMinutes: finalDuration,
        isFreePreview: free,
      }),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Save failed");
      return;
    }
    setOpen(false);
    setTitle("");
    setUrl("");
    setLiveDate("");
    setStartTime("");
    setEndTime("");
    setDur(0);
    router.refresh();
  }

  async function addSection() {
    const name = prompt("Section title");
    if (!name) return;
    await fetch("/api/instructor/sections", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId, title: name }),
    });
    router.refresh();
  }

  return (
    <div className="flex gap-2">
      <button type="button" className="btn btn-secondary btn-sm" onClick={addSection}>
        Add section
      </button>
      <button type="button" className="btn btn-primary btn-default" onClick={() => setOpen(true)} disabled={sections.length === 0}>
        Add Lesson
      </button>
      <AdminFormDialog title="Add New Lesson" open={open} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label>
            <span className="label">Section</span>
            <select className="input" value={sectionId} onChange={(e) => setSectionId(Number(e.target.value))}>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          </label>
          <label>
            <span className="label">Lesson Title</span>
            <input className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
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
                  }}
                >
                  {t.l}
                </button>
              ))}
            </div>
          </div>
          {type === "youtube_video" ? (
            <label>
              <span className="label">YouTube URL</span>
              <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} />
            </label>
          ) : null}
          {type === "live_class" ? (
            <>
              <label>
                <span className="label">Zoom / Google Meet URL</span>
                <input
                  className="input"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://zoom.us/j/... atau https://meet.google.com/..."
                />
              </label>

              <label>
                <span className="label">Tanggal Pelaksanaan</span>
                <input
                  className="input"
                  type="date"
                  value={liveDate}
                  onChange={(e) => setLiveDate(e.target.value)}
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <label>
                  <span className="label">Waktu Mulai</span>
                  <input
                    className="input"
                    type="time"
                    value={startTime}
                    onChange={(e) => handleStartTimeChange(e.target.value)}
                  />
                </label>
                <label>
                  <span className="label">Waktu Selesai (Sampai Jam)</span>
                  <input
                    className="input"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
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
                      ⚠️ Waktu selesai harus lebih lama dari waktu mulai.
                    </p>
                  );
                }
                const hours = Math.floor(diffMin / 60);
                const mins = diffMin % 60;
                const durLabel =
                  hours > 0
                    ? `${hours} jam ${mins > 0 ? `${mins} menit` : ""}`
                    : `${mins} menit`;
                return (
                  <div className="flex items-center justify-between rounded-[var(--r)] border border-blue-200 bg-blue-50/80 px-3.5 py-2 text-xs font-semibold text-blue-700">
                    <span>⏱️ Terhitung Durasi:</span>
                    <span className="font-extrabold text-blue-900 bg-white px-2.5 py-0.5 rounded shadow-2xs">
                      {diffMin} Menit ({durLabel.trim()})
                    </span>
                  </div>
                );
              })()}

              <p className="rounded-[var(--r)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-3 py-2 text-xs font-semibold text-[var(--brand)]">
                Notifikasi pengingat WhatsApp akan dikirim otomatis 24 jam dan 1 jam sebelum sesi live dimulai.
              </p>
            </>
          ) : null}
          {type === "document" ? (
            <div className="flex flex-col gap-2">
              <label>
                <span className="label">Upload PDF Document</span>
                <input
                  className="input"
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
                <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
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
              <span className="label">Text content</span>
              <textarea className="input min-h-24" value={text} onChange={(e) => setText(e.target.value)} />
            </label>
          ) : null}
          {type !== "live_class" ? (
            <label>
              <span className="label">Duration (min)</span>
              <input className="input" type="number" min="0" value={dur} onChange={(e) => setDur(Number(e.target.value))} />
            </label>
          ) : null}
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={free} onChange={(e) => setFree(e.target.checked)} />
            <span className="text-sm font-semibold">Free Preview</span>
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-default" onClick={() => setOpen(false)}>
            Batal
          </button>
          <button type="button" className="btn btn-primary btn-default" disabled={busy} onClick={save}>
            Simpan Lesson
          </button>
        </div>
      </AdminFormDialog>
    </div>
  );
}
