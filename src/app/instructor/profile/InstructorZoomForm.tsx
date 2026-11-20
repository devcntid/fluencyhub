"use client";

import { useState, useEffect } from "react";
import { useToast, useConfirm } from "@/components/ui/NotificationProvider";
import { validateZoomLink } from "@/lib/utils/zoom";
import { LandingIcon } from "@/components/landing/LandingIcon";

export function InstructorZoomForm({
  initialZoomLink,
}: {
  initialZoomLink?: string | null;
}) {
  const toast = useToast();
  const confirm = useConfirm();

  const hasInitialProp = initialZoomLink !== undefined;
  const [zoomLink, setZoomLink] = useState(initialZoomLink || "");
  const [savedZoomLink, setSavedZoomLink] = useState<string | null>(initialZoomLink ?? null);
  const [loadingZoom, setLoadingZoom] = useState(!hasInitialProp);
  const [savingZoom, setSavingZoom] = useState(false);
  const [copied, setCopied] = useState(false);
  const [touched, setTouched] = useState(false);
  const [showGuide, setShowGuide] = useState(false);

  useEffect(() => {
    if (hasInitialProp) return;
    let active = true;
    async function loadZoom() {
      try {
        const res = await fetch("/api/instructor/profile/zoom");
        const json = await res.json();
        if (!active) return;
        if (json.data) {
          setZoomLink(json.data);
          setSavedZoomLink(json.data);
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (active) setLoadingZoom(false);
      }
    }
    loadZoom();
    return () => {
      active = false;
    };
  }, [hasInitialProp]);

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
      toast.success("Tautan Zoom berhasil disimpan & terverifikasi!");
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
    <div
      id="zoom-settings"
      className="flex h-full flex-col justify-between rounded-[24px] border border-[#E6DED4] bg-white p-5 shadow-[0_2px_10px_rgba(11,37,89,0.03)] sm:p-7"
    >
      <div className="space-y-5">
        {/* Card Header */}
        <div className="flex items-start justify-between gap-3 border-b border-[#F3ECE3] pb-4">
          <div className="min-w-0">
            <h2 className="m-0 font-[family-name:var(--font-heading)] text-lg font-extrabold text-[#0B2559] flex items-center gap-2">
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-blue-50 text-[#0073F5]">
                <LandingIcon name="Video" size={15} color="currentColor" />
              </span>
              <span>Tautan Zoom Pribadi</span>
            </h2>
            <p className="m-0 mt-1 text-xs text-[#64748B] leading-relaxed">
              Dipakai otomatis untuk seluruh sesi <strong>Private Coaching 1-on-1 Online</strong>{" "}
              bersama siswa.
            </p>
          </div>

          <span
            className={`shrink-0 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-extrabold border ${
              savedZoomLink
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : "bg-amber-50 text-amber-800 border-amber-200"
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                savedZoomLink ? "bg-emerald-500" : "bg-amber-500"
              }`}
            />
            <span>{savedZoomLink ? "Terhubung" : "Belum Diatur"}</span>
          </span>
        </div>

        {/* Input Field */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <label
              htmlFor="instructor-zoom-url"
              className="block text-xs font-extrabold uppercase tracking-wider text-[#0B2559]"
            >
              URL Personal Meeting Room (PMI)
            </label>
            {touched && !isInputEmpty && (
              <span
                className={`text-[11px] font-extrabold ${
                  validation.isValid ? "text-emerald-600" : "text-rose-600"
                }`}
              >
                {validation.isValid ? "✓ Valid" : "✕ Format tidak sesuai"}
              </span>
            )}
          </div>

          <div className="relative">
            <input
              id="instructor-zoom-url"
              type="url"
              placeholder="https://zoom.us/j/9392912653?pwd=..."
              value={zoomLink}
              onChange={(e) => {
                setZoomLink(e.target.value);
                setTouched(true);
              }}
              disabled={loadingZoom || savingZoom}
              className={`w-full rounded-xl border px-4 py-3 pr-10 text-sm font-medium outline-none transition ${
                touched && !isInputEmpty && !validation.isValid
                  ? "border-rose-400 bg-rose-50/40 text-rose-900 focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
                  : touched && validation.isValid
                  ? "border-emerald-400 bg-emerald-50/20 text-[#0B2559] focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  : "border-[#D8CBB8] bg-[#FBF6F1]/60 text-[#0B2559] focus:border-[#0073F5] focus:bg-white focus:ring-2 focus:ring-blue-100"
              }`}
            />

            <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2">
              {touched && !isInputEmpty && validation.isValid && (
                <span className="text-emerald-600">
                  <LandingIcon name="CheckCircle" size={17} color="currentColor" />
                </span>
              )}
              {touched && !isInputEmpty && !validation.isValid && (
                <span className="text-rose-500">
                  <LandingIcon name="X" size={17} color="currentColor" />
                </span>
              )}
            </div>
          </div>

          {touched && !isInputEmpty && !validation.isValid && (
            <p className="text-xs font-semibold text-rose-600">{validation.error}</p>
          )}

          {isInputEmpty && !loadingZoom && (
            <div className="rounded-xl border border-amber-200 bg-amber-50/80 px-3.5 py-2.5 text-xs text-amber-900 leading-relaxed">
              Masukkan tautan <strong>Personal Meeting ID (PMI)</strong> Zoom agar siswa bisa
              langsung klik <em>Gabung Zoom</em> saat sesi dimulai.
            </div>
          )}
        </div>

        {/* Utility Buttons Row (when a valid or saved link exists) */}
        {(validation.isValid || savedZoomLink) && (
          <div className="grid grid-cols-3 gap-2">
            <a
              href={validation.isValid ? validation.normalizedUrl : savedZoomLink || "#"}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#0B2559] hover:bg-[#133882] px-3 py-2.5 text-xs font-bold text-white shadow-2xs transition whitespace-nowrap"
              title="Uji coba membuka room Zoom di tab baru"
            >
              <LandingIcon name="ExternalLink" size={13} color="#fff" />
              <span>Uji Zoom</span>
            </a>

            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E6DED4] bg-[#FBF6F1] hover:bg-[#F3ECE4] px-3 py-2.5 text-xs font-bold text-[#0B2559] transition cursor-pointer whitespace-nowrap"
            >
              <LandingIcon name="FileText" size={13} color="currentColor" />
              <span>{copied ? "Tersalin!" : "Salin"}</span>
            </button>

            {savedZoomLink ? (
              <button
                type="button"
                onClick={handleClear}
                disabled={savingZoom || loadingZoom}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 px-3 py-2.5 text-xs font-bold text-rose-600 transition cursor-pointer whitespace-nowrap disabled:opacity-45"
              >
                <LandingIcon name="Trash" size={13} color="currentColor" />
                <span>Hapus</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => {
                  setZoomLink("");
                  setTouched(false);
                }}
                className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-[#E6DED4] bg-white hover:bg-zinc-50 px-3 py-2.5 text-xs font-bold text-zinc-600 transition cursor-pointer whitespace-nowrap"
              >
                <span>Bersihkan</span>
              </button>
            )}
          </div>
        )}

        {/* Collapsible Format Guide (Keeps card super clean & uncluttered!) */}
        <div className="rounded-xl border border-[#EFE7DC] bg-[#FBF6F1]/70">
          <button
            type="button"
            onClick={() => setShowGuide((v) => !v)}
            className="flex w-full items-center justify-between gap-2 px-3.5 py-2.5 text-left text-xs font-bold text-[#0B2559] hover:text-[#0062D1] transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <LandingIcon name="BookOpen" size={14} color="#0073F5" />
              <span>Contoh format tautan Zoom yang didukung</span>
            </span>
            <span
              className={`transition-transform duration-200 ${showGuide ? "rotate-180" : ""}`}
            >
              <LandingIcon name="ChevronDown" size={14} color="currentColor" />
            </span>
          </button>

          {showGuide && (
            <div className="border-t border-[#EFE7DC] px-3.5 py-3 text-[11.5px] text-zinc-600 space-y-1.5">
              <div className="space-y-1">
                <p className="m-0">
                  •{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 border border-[#E6DED4] text-[10.5px] text-[#0B2559]">
                    https://zoom.us/j/9392912653
                  </code>{" "}
                  (Meeting ID)
                </p>
                <p className="m-0">
                  •{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 border border-[#E6DED4] text-[10.5px] text-[#0B2559]">
                    https://us02web.zoom.us/j/...?pwd=...
                  </code>{" "}
                  (Dengan password)
                </p>
                <p className="m-0">
                  •{" "}
                  <code className="rounded bg-white px-1.5 py-0.5 border border-[#E6DED4] text-[10.5px] text-[#0B2559]">
                    https://zoom.us/my/namaprofil
                  </code>{" "}
                  (PMI Link)
                </p>
              </div>
              <p className="m-0 pt-1 text-[11px] text-zinc-500">
                Tips: Buka aplikasi Zoom &rarr; tab <em>Meetings</em> &rarr; salin{" "}
                <em>Personal Meeting Link</em>.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Footer Save Row — matches ProfileForm rhythm */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-[#F3ECE3] pt-5">
        {!hasChanges && savedZoomLink ? (
          <span className="inline-flex items-center gap-1.5 text-xs font-extrabold text-emerald-700">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            Tautan Zoom sudah tersimpan
          </span>
        ) : (
          <span className="text-xs text-[#64748B]">
            {hasChanges ? "Ada perubahan belum disimpan" : "Masukkan URL Zoom lalu simpan"}
          </span>
        )}

        <div className="flex items-center gap-2">
          {hasChanges && savedZoomLink && (
            <button
              type="button"
              disabled={savingZoom}
              onClick={() => {
                setZoomLink(savedZoomLink);
                setTouched(false);
              }}
              className="rounded-xl border border-[#E6DED4] bg-white px-3.5 py-2.5 text-xs font-bold text-zinc-600 hover:bg-[#FBF6F1] transition cursor-pointer"
            >
              Batal
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={savingZoom || loadingZoom || (!hasChanges && Boolean(savedZoomLink))}
            className={`inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-xs sm:text-sm font-extrabold transition cursor-pointer ${
              !hasChanges && savedZoomLink
                ? "border border-emerald-200 bg-emerald-50 text-emerald-700 cursor-default"
                : "bg-[#0073F5] hover:bg-[#0062D1] text-white shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
            }`}
          >
            {savingZoom ? (
              <>
                <span className="h-3.5 w-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>Menyimpan...</span>
              </>
            ) : !hasChanges && savedZoomLink ? (
              <>
                <LandingIcon name="Check" size={14} color="currentColor" />
                <span>Tersimpan</span>
              </>
            ) : (
              <span>Simpan Link Zoom</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
