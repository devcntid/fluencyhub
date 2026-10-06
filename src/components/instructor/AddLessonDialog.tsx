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
  const [dt, setDt] = useState("");
  const [text, setText] = useState("");
  const [dur, setDur] = useState(0);
  const [free, setFree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
    const res = await fetch("/api/instructor/lessons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        sectionId,
        title,
        contentType: type,
        youtubeUrl: type === "youtube_video" ? url || null : null,
        liveClassUrl: type === "live_class" ? url || null : null,
        liveClassDatetime: type === "live_class" && dt ? new Date(dt).toISOString() : null,
        liveClassPlatform: type === "live_class" ? "zoom" : null,
        documentUrl: type === "document" ? url || null : null,
        textContent: type === "text" ? text || null : null,
        durationMinutes: dur,
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
                <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} />
              </label>
              <label>
                <span className="label">Scheduled Date & Time</span>
                <input className="input" type="datetime-local" value={dt} onChange={(e) => setDt(e.target.value)} />
              </label>
              <p className="rounded-[var(--r)] border border-[var(--brand-200)] bg-[var(--brand-50)] px-3 py-2 text-xs font-semibold text-[var(--brand)]">
                WA reminder is sent 24h and 1h before the session (when cron is enabled).
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
          <label>
            <span className="label">Duration (min)</span>
            <input className="input" type="number" value={dur} onChange={(e) => setDur(Number(e.target.value))} />
          </label>
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
