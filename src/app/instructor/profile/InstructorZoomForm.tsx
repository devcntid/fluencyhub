"use client";

import { useState, useEffect } from "react";

export function InstructorZoomForm() {
  const [zoomLink, setZoomLink] = useState("");
  const [loadingZoom, setLoadingZoom] = useState(true);
  const [savingZoom, setSavingZoom] = useState(false);
  const [toast, setToast] = useState<{show: boolean, type: 'success' | 'error', message: string}>({ show: false, type: 'success', message: '' });

  function showToast(message: string, type: 'success' | 'error' = 'success') {
    setToast({ show: true, type, message });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 3000);
  }

  useEffect(() => {
    fetchZoomLink();
  }, []);

  async function fetchZoomLink() {
    try {
      const res = await fetch("/api/instructor/profile/zoom");
      const json = await res.json();
      if (json.data) setZoomLink(json.data);
    } catch (e) {
      console.error(e);
    }
    setLoadingZoom(false);
  }

  async function saveZoomLink() {
    setSavingZoom(true);
    try {
      const res = await fetch("/api/instructor/profile/zoom", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ link: zoomLink })
      });
      if (res.ok) {
        showToast("Link Zoom berhasil disimpan!");
      } else {
        showToast("Gagal menyimpan link", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Terjadi kesalahan jaringan", "error");
    }
    setSavingZoom(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <h2 className="text-xl font-bold text-zinc-900 flex items-center gap-2">
        <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"/></svg>
        Link Zoom Saya
      </h2>
      <p className="text-sm text-zinc-500">
        Gunakan <strong>Personal Meeting Link (PMI)</strong> Zoom Anda di sini. Link ini akan menjadi ruangan default untuk semua sesi privat Anda.
      </p>
      
      <div className="flex flex-col gap-3 mt-2">
        <input 
          type="url" 
          placeholder="Contoh: https://zoom.us/j/9392912653?pwd=..." 
          className="input w-full py-3 px-4 shadow-inner border-zinc-200 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 rounded-xl"
          value={zoomLink}
          onChange={(e) => setZoomLink(e.target.value)}
          disabled={loadingZoom}
        />
        <button 
          className="btn btn-primary w-full py-3 rounded-xl shadow-blue-500/30 shadow-lg hover:-translate-y-0.5 transition-transform" 
          onClick={saveZoomLink} 
          disabled={savingZoom || loadingZoom}
        >
          {savingZoom ? "Menyimpan..." : "Simpan Link"}
        </button>
      </div>

      {!zoomLink && !loadingZoom && (
        <div className="mt-2 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100 flex items-start gap-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/></svg>
          Mohon isi link Zoom Anda agar learner bisa bergabung ke sesi.
        </div>
      )}

      {toast.show && (
        <div className={`mt-2 p-3 rounded-xl text-sm font-medium ${toast.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' : 'bg-red-50 text-red-600 border border-red-100'}`}>
          {toast.message}
        </div>
      )}
    </div>
  );
}
