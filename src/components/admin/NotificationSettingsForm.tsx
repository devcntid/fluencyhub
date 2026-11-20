"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  [key: string]: string;
}

function cleanNewlines(str: string | undefined, fallback: string): string {
  if (!str) return fallback;
  return str.replace(/\\n/g, "\n");
}

export function NotificationSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();

  const defaultWaSuccess = `*English Ready - Pembayaran Berhasil!* 🎉

Halo *{USER_NAME}*, pembayaran kamu untuk kelas *{COURSE_TITLE}* sebesar *{AMOUNT}* telah berhasil diverifikasi.

Silakan login ke *Dashboard* kamu dan mulai belajar sekarang:
👉 http://localhost:3000/dashboard

Semoga lancar belajarnya brok! 🔥`;

  const defaultWaRejected = `*English Ready - Pembayaran Ditolak* ❌

Halo *{USER_NAME}*, mohon maaf bukti transfer kamu untuk kelas *{COURSE_TITLE}* telah ditolak oleh Admin.

*Alasan penolakan:*
"{NOTE}"

Silakan upload ulang bukti pembayaran yang benar melalui halaman:
👉 http://localhost:3000/dashboard

Jika ada pertanyaan, silakan balas pesan ini.`;

  const defaultEmailSuccessSubject = `✅ Payment Confirmed — Access to {COURSE_TITLE} is Now Active!`;
  const defaultEmailRejectedSubject = `❌ Payment Rejected — Please re-upload your payment proof`;

  const defaultEmailSuccessBody = `Great news! Your payment has been successfully confirmed. You can now log in to the dashboard and start learning right away.\n\nKeep up the enthusiasm and happy learning!`;
  const defaultEmailRejectedBody = `We are sorry to inform you that your manual payment proof has been rejected by the admin. Please check the rejection reason and upload a clearer proof of payment via your dashboard to activate your access.`;

  const [form, setForm] = useState({
    notif_email_enabled: settings.notif_email_enabled ?? "true",
    notif_wa_enabled: settings.notif_wa_enabled ?? "true",

    notif_wa_success: cleanNewlines(settings.notif_wa_success, defaultWaSuccess),
    notif_wa_rejected: cleanNewlines(settings.notif_wa_rejected, defaultWaRejected),

    notif_email_subject_success: settings.notif_email_subject_success ?? defaultEmailSuccessSubject,
    notif_email_body_success: cleanNewlines(settings.notif_email_body_success, defaultEmailSuccessBody),

    notif_email_subject_rejected: settings.notif_email_subject_rejected ?? defaultEmailRejectedSubject,
    notif_email_body_rejected: cleanNewlines(settings.notif_email_body_rejected, defaultEmailRejectedBody),
  });

  const [activeTab, setActiveTab] = useState<"wa" | "email" | "test">("wa");
  const [waSubTab, setWaSubTab] = useState<"success" | "rejected">("success");
  const [emailSubTab, setEmailSubTab] = useState<"success" | "rejected">("success");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState("");
  const [testTarget, setTestTarget] = useState({ email: "", phone: "" });
  const [isTesting, setIsTesting] = useState(false);
  const [testType, setTestType] = useState("success");
  const [testResultMsg, setTestResultMsg] = useState<{ ok: boolean; msg: string } | null>(null);

  // Textarea references for variable insertion
  const waSuccessRef = useRef<HTMLTextAreaElement>(null);
  const waRejectedRef = useRef<HTMLTextAreaElement>(null);
  const emailSuccessRef = useRef<HTMLTextAreaElement>(null);
  const emailRejectedRef = useRef<HTMLTextAreaElement>(null);

  function insertVariable(
    varName: string,
    field: "notif_wa_success" | "notif_wa_rejected" | "notif_email_body_success" | "notif_email_body_rejected",
    ref: React.RefObject<HTMLTextAreaElement | null>
  ) {
    const el = ref.current;
    if (!el) {
      setForm((prev) => ({ ...prev, [field]: prev[field] + " " + varName }));
      return;
    }
    const start = el.selectionStart;
    const end = el.selectionEnd;
    const text = form[field];
    const before = text.substring(0, start);
    const after = text.substring(end);
    const updated = before + varName + after;
    setForm((prev) => ({ ...prev, [field]: updated }));
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + varName.length, start + varName.length);
    }, 10);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccessMsg("");
    try {
      const res = await fetch("/api/admin/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Gagal menyimpan konfigurasi");
      setSaveSuccessMsg("Konfigurasi notifikasi berhasil disimpan!");
      setTimeout(() => setSaveSuccessMsg(""), 4000);
      router.refresh();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    if (!testTarget.email && !testTarget.phone) {
      alert("Masukkan email atau nomor WhatsApp untuk mengirimkan tes.");
      return;
    }
    setIsTesting(true);
    setTestResultMsg(null);
    try {
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...testTarget, testType, settings: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim tes notifikasi");
      setTestResultMsg({ ok: true, msg: "Notifikasi tes berhasil dikirim ke target!" });
    } catch (err: unknown) {
      setTestResultMsg({
        ok: false,
        msg: "Gagal mengirim: " + (err instanceof Error ? err.message : String(err)),
      });
    } finally {
      setIsTesting(false);
    }
  }

  // Format sample text for WhatsApp preview
  function renderWhatsAppPreview(template: string) {
    const sample = template
      .replaceAll("{USER_NAME}", "Muhammad Zaky")
      .replaceAll("{COURSE_TITLE}", "Cohort Ready for Work")
      .replaceAll("{AMOUNT}", "Rp 1.490.000")
      .replaceAll("{NOTE}", "Foto bukti transfer buram / nominal tidak sesuai.");

    // Simple markdown formatting: *bold* -> <strong>
    const lines = sample.split("\n");
    return lines.map((line, idx) => {
      // replace *bold*
      const parts = line.split(/(\*[^*]+\*)/g);
      return (
        <span key={idx} className="block min-h-[1.2em]">
          {parts.map((p, pIdx) => {
            if (p.startsWith("*") && p.endsWith("*") && p.length > 2) {
              return <strong key={pIdx} className="font-extrabold">{p.slice(1, -1)}</strong>;
            }
            if (p.startsWith("👉") || p.startsWith("http")) {
              return <span key={pIdx} className="text-[#0073F5] underline">{p}</span>;
            }
            return p;
          })}
        </span>
      );
    });
  }

  return (
    <div className="space-y-6">
      {/* Top Channel Toggle Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* WhatsApp Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            form.notif_wa_enabled === "true"
              ? "bg-white border-emerald-300 shadow-xs"
              : "bg-slate-50 border-slate-200 opacity-75"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.634.072-1.896-.453-1.611-.669-2.646-2.316-2.727-2.423-.079-.107-.648-.864-.648-1.648 0-.784.409-1.17.553-1.328.144-.158.315-.198.42-.198.106 0 .211.001.304.006.097.006.228-.037.357.272.132.318.452 1.106.492 1.187.04.081.066.176.013.282-.053.107-.079.174-.158.267-.079.093-.166.208-.238.279-.08.08-.163.167-.07.327.093.16.413.682.886 1.103.609.542 1.123.71 1.282.79.16.08.254.067.348-.041.094-.108.4-466.507-.625.106-.159.213-.133.359-.08.146.053.928.437 1.088.517.16.079.266.119.306.186.04.066.04.385-.104.79z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">WhatsApp Gateway (Fonnte API)</h3>
                <p className="text-xs text-slate-500">Kirim pesan WhatsApp otomatis saat status pembayaran berubah</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  notif_wa_enabled: prev.notif_wa_enabled === "true" ? "false" : "true",
                }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                form.notif_wa_enabled === "true"
                  ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                  : "bg-slate-200 text-slate-600 border border-slate-300"
              }`}
            >
              {form.notif_wa_enabled === "true" ? "Aktif" : "Nonaktif"}
            </button>
          </div>
        </div>

        {/* Email Card */}
        <div
          className={`p-4 rounded-2xl border transition-all ${
            form.notif_email_enabled === "true"
              ? "bg-white border-blue-300 shadow-xs"
              : "bg-slate-50 border-slate-200 opacity-75"
          }`}
        >
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#0073F5] text-white flex items-center justify-center font-bold text-lg shadow-xs shrink-0">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">Email Notification (HTML)</h3>
                <p className="text-xs text-slate-500">Kirim email tanda terima & instruksi belajar resmi</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() =>
                setForm((prev) => ({
                  ...prev,
                  notif_email_enabled: prev.notif_email_enabled === "true" ? "false" : "true",
                }))
              }
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                form.notif_email_enabled === "true"
                  ? "bg-blue-100 text-blue-800 border border-blue-300"
                  : "bg-slate-200 text-slate-600 border border-slate-300"
              }`}
            >
              {form.notif_email_enabled === "true" ? "Aktif" : "Nonaktif"}
            </button>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab("wa")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "wa"
              ? "bg-[#0B2559] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-emerald-400" />
          Template WhatsApp
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("email")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "email"
              ? "bg-[#0B2559] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-blue-400" />
          Template Email HTML
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("test")}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
            activeTab === "test"
              ? "bg-[#0B2559] text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200/80"
          }`}
        >
          <span>🧪</span>
          Kirim Test & Simulator
        </button>
      </div>

      {/* Form Form Container */}
      <form onSubmit={handleSave} className="space-y-6">
        {/* TAB 1: WHATSAPP TEMPLATES */}
        {activeTab === "wa" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
            {/* Sub-tabs for Success vs Rejected */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setWaSubTab("success")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    waSubTab === "success"
                      ? "bg-emerald-50 text-emerald-800 border border-emerald-300"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ✓ Pembayaran Berhasil (Success)
                </button>
                <button
                  type="button"
                  onClick={() => setWaSubTab("rejected")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    waSubTab === "rejected"
                      ? "bg-rose-50 text-rose-800 border border-rose-300"
                      : "text-slate-600 hover:bg-slate-100"
                  }`}
                >
                  ✕ Pembayaran Ditolak (Rejected)
                </button>
              </div>
              <span className="text-xs text-slate-400">
                Pesan akan dikirim otomatis oleh bot Fonnte
              </span>
            </div>

            {/* Split Screen: Editor on Left, Live Chat Bubble on Right */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Left Column: Editor & Variable Chips */}
              <div className="lg:col-span-7 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    {waSubTab === "success" ? "Isi Pesan WhatsApp Sukses" : "Isi Pesan WhatsApp Ditolak"}
                  </label>
                  <span className="text-[11px] text-slate-400">Gunakan *teks* untuk tebal</span>
                </div>

                {/* Clickable Variable Chips */}
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-500 block">
                    Klik untuk menyisipkan variabel:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {waSubTab === "success" ? (
                      <>
                        <button
                          type="button"
                          onClick={() => insertVariable("{USER_NAME}", "notif_wa_success", waSuccessRef)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                        >
                          + {"{USER_NAME}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable("{COURSE_TITLE}", "notif_wa_success", waSuccessRef)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                        >
                          + {"{COURSE_TITLE}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable("{AMOUNT}", "notif_wa_success", waSuccessRef)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                        >
                          + {"{AMOUNT}"}
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => insertVariable("{USER_NAME}", "notif_wa_rejected", waRejectedRef)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                        >
                          + {"{USER_NAME}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable("{COURSE_TITLE}", "notif_wa_rejected", waRejectedRef)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                        >
                          + {"{COURSE_TITLE}"}
                        </button>
                        <button
                          type="button"
                          onClick={() => insertVariable("{NOTE}", "notif_wa_rejected", waRejectedRef)}
                          className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-rose-600 hover:bg-rose-50 cursor-pointer shadow-2xs"
                        >
                          + {"{NOTE}"}
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* Textarea without raw \n */}
                {waSubTab === "success" ? (
                  <textarea
                    ref={waSuccessRef}
                    rows={12}
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-xs sm:text-sm font-sans focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 outline-none transition leading-relaxed shadow-2xs"
                    value={form.notif_wa_success}
                    onChange={(e) => setForm({ ...form, notif_wa_success: e.target.value })}
                    placeholder="Ketik template pesan WhatsApp..."
                  />
                ) : (
                  <textarea
                    ref={waRejectedRef}
                    rows={12}
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-xs sm:text-sm font-sans focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 outline-none transition leading-relaxed shadow-2xs"
                    value={form.notif_wa_rejected}
                    onChange={(e) => setForm({ ...form, notif_wa_rejected: e.target.value })}
                    placeholder="Ketik template pesan WhatsApp penolakan..."
                  />
                )}
              </div>

              {/* Right Column: Realistic Live WhatsApp Chat Mockup */}
              <div className="lg:col-span-5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Live Chat Preview
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Tampilan di HP Siswa</span>
                </div>

                {/* Smartphone Mockup Frame */}
                <div className="rounded-2xl border-2 border-slate-300 bg-[#EFEAE2] overflow-hidden shadow-sm flex flex-col">
                  {/* WhatsApp Chat Header */}
                  <div className="bg-[#075E54] text-white p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-white text-[#0B2559] flex items-center justify-center font-black text-xs">
                        ER
                      </div>
                      <div>
                        <div className="flex items-center gap-1 font-bold text-xs">
                          <span>English Ready Official</span>
                          <span className="text-emerald-300 text-[10px]">✓</span>
                        </div>
                        <span className="text-[10px] text-emerald-100 block">Akun Bisnis Resmi</span>
                      </div>
                    </div>
                    <span className="text-xs text-white/70 font-mono">10:42</span>
                  </div>

                  {/* Chat Message Bubble Body */}
                  <div className="p-3.5 space-y-3 min-h-[300px] flex flex-col justify-end">
                    <div className="self-start max-w-[95%] bg-[#D9FDD3] text-slate-900 rounded-xl rounded-tl-none p-3 shadow-2xs text-xs leading-relaxed space-y-1">
                      {renderWhatsAppPreview(
                        waSubTab === "success" ? form.notif_wa_success : form.notif_wa_rejected
                      )}
                      <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-slate-500">
                        <span>10:42</span>
                        <span className="text-blue-500 font-bold">✓✓</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: EMAIL TEMPLATES */}
        {activeTab === "email" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100">
              <button
                type="button"
                onClick={() => setEmailSubTab("success")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  emailSubTab === "success"
                    ? "bg-blue-50 text-blue-800 border border-blue-300"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ✓ Email Sukses (Invoice & Akses)
              </button>
              <button
                type="button"
                onClick={() => setEmailSubTab("rejected")}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                  emailSubTab === "rejected"
                    ? "bg-rose-50 text-rose-800 border border-rose-300"
                    : "text-slate-600 hover:bg-slate-100"
                }`}
              >
                ✕ Email Ditolak (Re-upload)
              </button>
            </div>

            {/* Email Form Fields */}
            <div className="space-y-4">
              {emailSubTab === "success" ? (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Subject Email Sukses
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm font-semibold text-slate-900 focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 outline-none transition"
                      value={form.notif_email_subject_success}
                      onChange={(e) =>
                        setForm({ ...form, notif_email_subject_success: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Isi Pesan Email Sukses
                      </label>
                      <span className="text-[11px] text-slate-400">Rincian invoice akan ditambahkan otomatis di bawah</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Klik untuk menyisipkan variabel:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {["{USER_NAME}", "{COURSE_TITLE}", "{AMOUNT}", "{METHOD}", "{DATE}", "{ORDER_ID}"].map(
                          (v) => (
                            <button
                              key={v}
                              type="button"
                              onClick={() => insertVariable(v, "notif_email_body_success", emailSuccessRef)}
                              className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                            >
                              + {v}
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <textarea
                      ref={emailSuccessRef}
                      rows={6}
                      className="w-full rounded-xl border border-slate-300 p-3.5 text-xs sm:text-sm font-sans focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 outline-none transition leading-relaxed shadow-2xs"
                      value={form.notif_email_body_success}
                      onChange={(e) =>
                        setForm({ ...form, notif_email_body_success: e.target.value })
                      }
                    />
                  </div>
                </>
              ) : (
                <>
                  <div className="space-y-1">
                    <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                      Subject Email Ditolak
                    </label>
                    <input
                      type="text"
                      className="w-full rounded-xl border border-slate-300 p-3 text-xs sm:text-sm font-semibold text-slate-900 focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 outline-none transition"
                      value={form.notif_email_subject_rejected}
                      onChange={(e) =>
                        setForm({ ...form, notif_email_subject_rejected: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                        Isi Pesan Email Ditolak
                      </label>
                      <span className="text-[11px] text-slate-400">Kotak alasan penolakan akan otomatis disisipkan</span>
                    </div>

                    <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/70 space-y-1.5">
                      <span className="text-[11px] font-semibold text-slate-500 block">
                        Klik untuk menyisipkan variabel:
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {["{USER_NAME}", "{COURSE_TITLE}", "{ORDER_ID}", "{NOTE}"].map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => insertVariable(v, "notif_email_body_rejected", emailRejectedRef)}
                            className="px-2 py-1 rounded bg-white border border-slate-200 text-xs font-mono font-bold text-[#0062D1] hover:bg-blue-50 cursor-pointer shadow-2xs"
                          >
                            + {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <textarea
                      ref={emailRejectedRef}
                      rows={6}
                      className="w-full rounded-xl border border-slate-300 p-3.5 text-xs sm:text-sm font-sans focus:border-[#0073F5] focus:ring-2 focus:ring-blue-100 outline-none transition leading-relaxed shadow-2xs"
                      value={form.notif_email_body_rejected}
                      onChange={(e) =>
                        setForm({ ...form, notif_email_body_rejected: e.target.value })
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {/* TAB 3: TEST SANDBOX */}
        {activeTab === "test" && (
          <div className="bg-white rounded-2xl border border-slate-200 p-5 sm:p-6 shadow-2xs space-y-5">
            <div>
              <h3 className="text-base font-bold text-slate-900">Simulator Pengiriman Notifikasi</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Uji coba template notifikasi yang baru kamu ketik langsung ke email atau WhatsApp milikmu dengan data contoh.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Tipe Notifikasi</label>
                <select
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs font-semibold text-slate-800 bg-white"
                  value={testType}
                  onChange={(e) => setTestType(e.target.value)}
                >
                  <option value="success">Pembayaran Berhasil (Success)</option>
                  <option value="rejected">Pembayaran Ditolak (Rejected)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target Email</label>
                <input
                  type="email"
                  placeholder="contoh: admin@englishready.id"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  value={testTarget.email}
                  onChange={(e) => setTestTarget({ ...testTarget, email: e.target.value })}
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-slate-700">Target WhatsApp (08xxx)</label>
                <input
                  type="text"
                  placeholder="contoh: 081234567890"
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-800"
                  value={testTarget.phone}
                  onChange={(e) => setTestTarget({ ...testTarget, phone: e.target.value })}
                />
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <span className="text-xs text-slate-400">
                Pesan akan dikirim menggunakan konfigurasi form aktif saat ini.
              </span>
              <button
                type="button"
                onClick={handleTest}
                disabled={isTesting || (!testTarget.email && !testTarget.phone)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs transition cursor-pointer disabled:opacity-50 shadow-xs"
              >
                {isTesting ? "Mengirim Tes..." : "Kirim Pesan Tes Sekarang &rarr;"}
              </button>
            </div>

            {testResultMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-semibold ${
                  testResultMsg.ok
                    ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                    : "bg-rose-50 text-rose-800 border border-rose-200"
                }`}
              >
                {testResultMsg.msg}
              </div>
            )}
          </div>
        )}

        {/* Global Save Button Bar */}
        <div className="flex items-center justify-between pt-2">
          {saveSuccessMsg ? (
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              {saveSuccessMsg}
            </span>
          ) : (
            <span className="text-xs text-slate-400">
              Perubahan template akan langsung diterapkan saat pembayaran diproses.
            </span>
          )}

          <button
            type="submit"
            disabled={isSaving}
            className="px-6 py-3 rounded-xl bg-[#0073F5] hover:bg-[#0062D1] text-white font-bold text-xs sm:text-sm shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50"
          >
            {isSaving ? "Menyimpan Konfigurasi..." : "Simpan Konfigurasi Notifikasi"}
          </button>
        </div>
      </form>
    </div>
  );
}
