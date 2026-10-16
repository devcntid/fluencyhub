"use client";

import { useState, useEffect } from "react";
import { useToast, useConfirm } from "@/components/ui/NotificationProvider";
import { validateZoomLink } from "@/lib/utils/zoom";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function InstructorZoomForm() {
  const toast = useToast();
  const confirm = useConfirm();

  const [zoomLink, setZoomLink] = useState("");
  const [savedZoomLink, setSavedZoomLink] = useState<string | null>(null);
  const [loadingZoom, setLoadingZoom] = useState(true);
  const [savingZoom, setSavingZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);

  useEffect(() => {
    fetchZoomLink();
  }, []);

  async function fetchZoomLink() {
    try {
      const res = await fetch("/api/instructor/profile/zoom");
      const json = await res.json();
      if (json.data) {
        setZoomLink(json.data);
        setSavedZoomLink(json.data);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat link Zoom instruktur.");
    } finally {
      setLoadingZoom(false);
    }
  }

  const validation = validateZoomLink(zoomLink);
  const hasChanges = zoomLink.trim() !== (savedZoomLink || "").trim();
  const isInputEmpty = !zoomLink.trim();

  async function handleSave() {
    setTouched(true);

    if (isInputEmpty) {
      toast.error("Link Zoom tidak boleh kosong. Masukkan URL meeting Zoom Anda.");
      return;
    }

    if (!validation.isValid) {
      toast.error(validation.error || "Format link Zoom tidak valid.");
      return;
    }

    setSavingZoom(true);
    try {
      const res = await fetch("/api/instructor/profile/zoom", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: validation.normalizedUrl }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Gagal menyimpan link Zoom.");
      }

      setSavedZoomLink(validation.normalizedUrl);
      setZoomLink(validation.normalizedUrl);
      setTouched(false);
      toast.success("Tautan Zoom berhasil disimpan & divalidasi!");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setSavingZoom(false);
    }
  }

  async function handleClear() {
    if (!savedZoomLink) {
      setZoomLink("");
      setTouched(false);
      return;
    }

    const ok = await confirm({
      title: "Hapus Tautan Zoom?",
      message:
        "Siswa tidak akan dapat bergabung ke sesi private mentoring jika tautan Zoom dihapus.",
      confirmText: "Ya, Hapus",
      cancelText: "Batal",
      variant: "danger",
    });

    if (!ok) return;

    setSavingZoom(true);
    try {
      const res = await fetch("/api/instructor/profile/zoom", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: null }),
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus link Zoom.");
      }

      setSavedZoomLink(null);
      setZoomLink("");
      setTouched(false);
      toast.success("Tautan Zoom berhasil dihapus.");
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Terjadi kesalahan.";
      toast.error(msg);
    } finally {
      setSavingZoom(false);
    }
  }

  async function handleCopy() {
    const textToCopy = validation.isValid ? validation.normalizedUrl : savedZoomLink;
    if (!textToCopy) return;

    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopied(true);
      toast.success("Tautan Zoom disalin ke clipboard!");
      setTimeout(() => setCopied(false), 2500);
    } catch {
      toast.error("Gagal menyalin tautan.");
    }
  }

  return (
    <div className="flex flex-col gap-5">
      {/* Header & Status Badge */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-blue-50 text-[var(--brand)]">
              <LandingIcon name="Video" size={16} color="currentColor" />
            </span>
            Tautan Zoom Pribadi Instruktur
          </h2>
          <p className="text-xs sm:text-sm text-zinc-500 mt-1">
            Gunakan <strong>Personal Meeting Link (PMI)</strong> atau Room ID Zoom Anda. Tautan ini akan otomatis digunakan untuk seluruh sesi private 1-on-1 dengan murid.
          </p>
        </div>

        <div>
          {savedZoomLink ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              Terhubung ke Zoom
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              Belum Diatur
            </span>
          )}
        </div>
      </div>

      {/* Input Field with Live Validation */}
      <div className="flex flex-col gap-2">
        <label className="text-xs font-bold text-zinc-700 uppercase tracking-wider flex items-center justify-between">
          <span>URL Meeting Zoom</span>
          {touched && !isInputEmpty && (
            <span className={`text-[11px] font-bold ${validation.isValid ? "text-emerald-600" : "text-red-500"}`}>
              {validation.isValid ? "✓ Format URL Zoom Valid" : "✕ Format Tidak Valid"}
            </span>
          )}
        </label>

        <div className="relative">
          <input
            type="text"
            placeholder="e.g. https://zoom.us/j/9392912653?pwd=... atau zoom.us/my/namaprofil"
            className={`w-full py-3 pl-4 pr-10 text-sm rounded-xl border transition-all shadow-inner focus:outline-none ${
              touched && !isInputEmpty && !validation.isValid
                ? "border-red-400 bg-red-50/20 focus:border-red-500 focus:ring-4 focus:ring-red-500/10 text-red-900"
                : touched && validation.isValid
                ? "border-emerald-400 bg-emerald-50/10 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 text-zinc-900"
                : "border-zinc-200 bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 text-zinc-900"
            }`}
            value={zoomLink}
            onChange={(e) => {
              setZoomLink(e.target.value);
              setTouched(true);
            }}
            disabled={loadingZoom || savingZoom}
          />

          {/* Validation Status Icon inside input */}
          <div className="absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none">
            {touched && !isInputEmpty && validation.isValid && (
              <span className="text-emerald-500 font-bold">
                <LandingIcon name="CheckCircle" size={18} color="currentColor" />
              </span>
            )}
            {touched && !isInputEmpty && !validation.isValid && (
              <span className="text-red-500 font-bold">
                <LandingIcon name="X" size={18} color="currentColor" />
              </span>
            )}
          </div>
        </div>

        {/* Validation Feedback Message */}
        {touched && !isInputEmpty && !validation.isValid && (
          <p className="text-xs text-red-600 font-medium flex items-center gap-1.5 mt-0.5 animate-in fade-in duration-200">
            <LandingIcon name="X" size={13} color="currentColor" />
            <span>{validation.error}</span>
          </p>
        )}

        {touched && !isInputEmpty && validation.isValid && (
          <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5 mt-0.5 animate-in fade-in duration-200">
            <LandingIcon name="Check" size={13} color="currentColor" />
            <span>Link terverifikasi: <strong className="text-emerald-700">{validation.normalizedUrl}</strong></span>
          </p>
        )}

        {isInputEmpty && !loadingZoom && (
          <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl border border-amber-200 flex items-start gap-2 mt-1">
            <LandingIcon name="Lock" size={15} color="currentColor" />
            <span>
              Harap isi tautan Zoom meeting agar siswa yang memesan sesi mentoring 1-on-1 dapat langsung bergabung ke room Anda.
            </span>
          </div>
        )}
      </div>

      {/* Buttons Action Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2 border-t border-zinc-100">
        <button
          type="button"
          onClick={handleSave}
          disabled={savingZoom || loadingZoom || (!hasChanges && validation.isValid)}
          className="btn btn-primary w-full sm:flex-1 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 cursor-pointer"
        >
          {savingZoom ? (
            <>
              <span className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>Menyimpan...</span>
            </>
          ) : (
            <>
              <LandingIcon name="Check" size={16} color="#fff" />
              <span>{hasChanges ? "Simpan Link Zoom" : "Tersimpan"}</span>
            </>
          )}
        </button>

        {/* Test Open Link Button */}
        {(validation.isValid || savedZoomLink) && (
          <a
            href={validation.isValid ? validation.normalizedUrl : savedZoomLink || "#"}
            target="_blank"
            rel="noreferrer"
            className="btn btn-secondary w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-bold text-blue-600 bg-blue-50 hover:bg-blue-100 border border-blue-200 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Uji coba membuka meeting room Zoom di tab baru"
          >
            <LandingIcon name="ExternalLink" size={14} color="currentColor" />
            <span>Uji Buka Zoom</span>
          </a>
        )}

        {/* Copy Link Button */}
        {(validation.isValid || savedZoomLink) && (
          <button
            type="button"
            onClick={handleCopy}
            className="btn btn-ghost w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-semibold text-zinc-600 hover:bg-zinc-100 border border-zinc-200 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
          >
            <LandingIcon name="FileText" size={14} color="currentColor" />
            <span>{copied ? "Tersalin!" : "Salin"}</span>
          </button>
        )}

        {/* Clear Button */}
        {savedZoomLink && (
          <button
            type="button"
            onClick={handleClear}
            disabled={savingZoom || loadingZoom}
            className="btn btn-ghost w-full sm:w-auto px-3.5 py-2.5 rounded-xl text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 flex items-center justify-center gap-1.5 transition active:scale-95 cursor-pointer"
            title="Hapus tautan Zoom dari profil"
          >
            <LandingIcon name="Trash" size={14} color="currentColor" />
            <span>Hapus</span>
          </button>
        )}
      </div>

      {/* Guide & Examples Section */}
      <div className="rounded-2xl bg-zinc-50 border border-zinc-200/70 p-4 text-xs text-zinc-600 space-y-2">
        <div className="flex items-center gap-1.5 font-bold text-zinc-800">
          <LandingIcon name="BookOpen" size={14} color="var(--brand)" />
          <span>Format Tautan Zoom yang Didukung:</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-zinc-500 pl-1">
          <li>
            <code className="text-zinc-800 bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[11px]">
              https://zoom.us/j/9392912653
            </code> (Meeting ID 9-11 digit)
          </li>
          <li>
            <code className="text-zinc-800 bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[11px]">
              https://us02web.zoom.us/j/9392912653?pwd=...
            </code> (Subdomain & Password)
          </li>
          <li>
            <code className="text-zinc-800 bg-white px-1.5 py-0.5 rounded border border-zinc-200 font-mono text-[11px]">
              https://zoom.us/my/namaprofil
            </code> (Personal Meeting Room / PMI Link)
          </li>
        </ul>
        <p className="text-[11px] text-zinc-400 pt-1 border-t border-zinc-200/50">
          💡 <strong>Tips:</strong> Buka aplikasi Zoom Desktop &rarr; Klik menu <em>Meetings</em> &rarr; Salin tautan <em>Personal Meeting ID (PMI)</em> Anda.
        </p>
      </div>
    </div>
  );
}
