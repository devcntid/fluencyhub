"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Settings {
  [key: string]: string;
}

export function NotificationSettingsForm({ settings }: { settings: Settings }) {
  const router = useRouter();
  
  const defaultWaSuccess = `*FluencyHub - Pembayaran Berhasil!* 🎉\\n\\nHalo *{USER_NAME}*, pembayaran kamu untuk kelas *{COURSE_TITLE}* sebesar *{AMOUNT}* telah berhasil diverifikasi.\\n\\nSilakan login ke *Dashboard* kamu dan mulai belajar sekarang:\\n👉 https://fluencyhub.id/dashboard\\n\\nSemoga lancar belajarnya brok! 🔥`;
  const defaultWaRejected = `*FluencyHub - Pembayaran Ditolak* ❌\\n\\nHalo *{USER_NAME}*, mohon maaf bukti transfer kamu untuk kelas *{COURSE_TITLE}* telah ditolak oleh Admin.\\n\\n*Alasan penolakan:*\\n"{NOTE}"\\n\\nSilakan upload ulang bukti pembayaran yang benar melalui halaman:\\n👉 https://fluencyhub.id/dashboard\\n\\nJika ada pertanyaan, silakan balas pesan ini.`;

  const defaultEmailSuccessSubject = `✅ Payment Confirmed — Access to {COURSE_TITLE} is Now Active!`;
  const defaultEmailRejectedSubject = `❌ Payment Rejected — Please re-upload your payment proof`;

  const defaultEmailSuccessBody = `Great news! Your payment has been successfully confirmed. You can now log in to the dashboard and start learning right away.\n\nKeep up the enthusiasm and happy learning!`;

  const defaultEmailRejectedBody = `We are sorry to inform you that your manual payment proof has been rejected by the admin. Please check the rejection reason and upload a clearer proof of payment via your dashboard to activate your access.`;

  const [form, setForm] = useState({
    notif_email_enabled: settings.notif_email_enabled ?? "true",
    notif_wa_enabled: settings.notif_wa_enabled ?? "true",
    
    notif_wa_success: settings.notif_wa_success ?? defaultWaSuccess,
    notif_wa_rejected: settings.notif_wa_rejected ?? defaultWaRejected,
    
    notif_email_subject_success: settings.notif_email_subject_success ?? defaultEmailSuccessSubject,
    notif_email_body_success: settings.notif_email_body_success ?? defaultEmailSuccessBody,
    
    notif_email_subject_rejected: settings.notif_email_subject_rejected ?? defaultEmailRejectedSubject,
    notif_email_body_rejected: settings.notif_email_body_rejected ?? defaultEmailRejectedBody,
  });

  const [isSaving, setIsSaving] = useState(false);
  const [testTarget, setTestTarget] = useState({ email: "", phone: "" });
  const [isTesting, setIsTesting] = useState(false);
  const [testType, setTestType] = useState("success");

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await fetch("/api/admin/cms/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed to save settings");
      alert("Settings saved!");
      router.refresh();
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsSaving(false);
    }
  }

  async function handleTest() {
    if (!testTarget.email && !testTarget.phone) {
      return alert("Silakan masukkan email atau nomor WA untuk test.");
    }
    setIsTesting(true);
    try {
      // Send current form configuration to test API so admin can test BEFORE saving
      const res = await fetch("/api/admin/notifications/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...testTarget, testType, settings: form }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Gagal mengirim test");
      alert("Test sent successfully!");
    } catch (err: unknown) {
      alert("Error: " + (err instanceof Error ? err.message : String(err)));
    } finally {
      setIsTesting(false);
    }
  }

  return (
    <div className="space-y-8">
      <form onSubmit={handleSave} className="card p-6 flex flex-col gap-8">
        
        {/* Toggles */}
        <div className="grid grid-cols-2 gap-4 border-b border-zinc-200 pb-6">
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-zinc-800">Email Notifications</label>
            <select 
              className="input w-full max-w-xs"
              value={form.notif_email_enabled}
              onChange={e => setForm({ ...form, notif_email_enabled: e.target.value })}
            >
              <option value="true">Enabled (Active)</option>
              <option value="false">Disabled (Inactive)</option>
            </select>
          </div>
          <div className="flex flex-col gap-2">
            <label className="font-semibold text-zinc-800">WhatsApp Notifications</label>
            <select 
              className="input w-full max-w-xs"
              value={form.notif_wa_enabled}
              onChange={e => setForm({ ...form, notif_wa_enabled: e.target.value })}
            >
              <option value="true">Enabled (Active)</option>
              <option value="false">Disabled (Inactive)</option>
            </select>
          </div>
        </div>

        {/* WhatsApp Templates */}
        <div>
          <h2 className="text-xl font-bold mb-4 text-green-700 flex items-center gap-2">
            WhatsApp Templates
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-sm text-zinc-700">Payment Success (WA)</label>
              <p className="text-xs text-zinc-500 mb-1">
                Variables: {'{USER_NAME}, {COURSE_TITLE}, {AMOUNT}'}
              </p>
              <textarea
                className="input h-64 font-mono text-sm"
                value={form.notif_wa_success}
                onChange={e => setForm({ ...form, notif_wa_success: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-2">
              <label className="font-semibold text-sm text-zinc-700">Payment Rejected (WA)</label>
              <p className="text-xs text-zinc-500 mb-1">
                Variables: {'{USER_NAME}, {COURSE_TITLE}, {NOTE}'}
              </p>
              <textarea
                className="input h-64 font-mono text-sm"
                value={form.notif_wa_rejected}
                onChange={e => setForm({ ...form, notif_wa_rejected: e.target.value })}
              />
            </div>
          </div>
        </div>

        {/* Email Templates */}
        <div className="border-t border-zinc-200 pt-6">
          <h2 className="text-xl font-bold mb-4 text-blue-700 flex items-center gap-2">
            Email Templates (HTML)
          </h2>
          <div className="grid md:grid-cols-2 gap-8">
            {/* Email Success */}
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-zinc-800">Payment Success (Email)</h3>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Subject</label>
                <input
                  type="text"
                  className="input"
                  value={form.notif_email_subject_success}
                  onChange={e => setForm({ ...form, notif_email_subject_success: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Message Body</label>
                <p className="text-xs text-zinc-500 mb-1">
                  Variables: {'{USER_NAME}, {COURSE_TITLE}, {AMOUNT}, {METHOD}, {DATE}, {ORDER_ID}'}
                </p>
                <textarea
                  className="input h-40 font-mono text-sm"
                  value={form.notif_email_body_success}
                  onChange={e => setForm({ ...form, notif_email_body_success: e.target.value })}
                />
              </div>
            </div>

            {/* Email Rejected */}
            <div className="flex flex-col gap-4">
              <h3 className="font-semibold text-zinc-800">Payment Rejected (Email)</h3>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Subject</label>
                <input
                  type="text"
                  className="input"
                  value={form.notif_email_subject_rejected}
                  onChange={e => setForm({ ...form, notif_email_subject_rejected: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-sm font-semibold text-zinc-700">Message Body</label>
                <p className="text-xs text-zinc-500 mb-1">
                  Variables: {'{USER_NAME}, {COURSE_TITLE}, {ORDER_ID}, {NOTE}'}
                </p>
                <textarea
                  className="input h-40 font-mono text-sm"
                  value={form.notif_email_body_rejected}
                  onChange={e => setForm({ ...form, notif_email_body_rejected: e.target.value })}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-4 border-t border-zinc-200">
          <button type="submit" disabled={isSaving} className="btn btn-primary">
            {isSaving ? "Saving..." : "Save Configuration"}
          </button>
        </div>
      </form>

      {/* Test Notification Tool */}
      <div className="card p-6 bg-zinc-50 border border-zinc-200">
        <h3 className="text-lg font-bold mb-4 text-zinc-800">Send Test Notification</h3>
        <p className="text-sm text-zinc-600 mb-4">
          Test your current configuration below before saving. Variables will be filled with dummy data.
        </p>
        <div className="flex flex-wrap gap-4 items-end">
          <div className="flex flex-col gap-2 w-full max-w-[200px]">
            <label className="text-xs font-semibold">Test Type</label>
            <select
              className="input"
              value={testType}
              onChange={e => setTestType(e.target.value)}
            >
              <option value="success">Payment Success</option>
              <option value="rejected">Payment Rejected</option>
            </select>
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[250px]">
            <label className="text-xs font-semibold">Target Email</label>
            <input
              type="email"
              className="input"
              placeholder="e.g. test@example.com"
              value={testTarget.email}
              onChange={e => setTestTarget({ ...testTarget, email: e.target.value })}
            />
          </div>
          <div className="flex flex-col gap-2 w-full max-w-[250px]">
            <label className="text-xs font-semibold">Target WhatsApp (08xxx)</label>
            <input
              type="text"
              className="input"
              placeholder="e.g. 081234567890"
              value={testTarget.phone}
              onChange={e => setTestTarget({ ...testTarget, phone: e.target.value })}
            />
          </div>
          <div className="flex-1">
            <button
              type="button"
              onClick={handleTest}
              disabled={isTesting || (!testTarget.email && !testTarget.phone)}
              className="btn btn-secondary w-full"
            >
              {isTesting ? "Sending..." : "Send Test"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
