"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CancelButton({ orderId }: { orderId: number }) {
  const [busy, setBusy] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  async function handleCancel() {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, {
        method: "POST",
      });
      if (!res.ok) {
        const json = await res.json();
        throw new Error(json.error || "Gagal membatalkan transaksi");
      }
      setShowModal(false);
      router.refresh();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Terjadi kesalahan");
      setBusy(false);
    }
  }

  return (
    <>
      <button 
        onClick={() => setShowModal(true)} 
        disabled={busy} 
        className="btn btn-secondary w-full sm:w-auto text-sm py-2 px-6 border-red-200 text-red-600 hover:bg-red-50 hover:border-red-300 disabled:opacity-50"
      >
        Batalkan Transaksi
      </button>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-0">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => !busy && setShowModal(false)} />
          <div className="relative z-10 w-full max-w-sm overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="p-6 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 text-[var(--red)]">
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                  <line x1="12" y1="9" x2="12" y2="13"/>
                  <line x1="12" y1="17" x2="12.01" y2="17"/>
                </svg>
              </div>
              <h3 className="mb-2 text-lg font-bold text-zinc-900">Batalkan Transaksi?</h3>
              <p className="text-sm text-zinc-500">
                Apakah kamu yakin ingin membatalkan transaksi ini? Tindakan ini tidak dapat diurungkan.
              </p>
            </div>
            <div className="flex bg-zinc-50 p-4 gap-3 sm:flex-row flex-col-reverse">
              <button 
                type="button" 
                onClick={() => setShowModal(false)} 
                disabled={busy}
                className="flex-1 rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100 disabled:opacity-50"
              >
                Kembali
              </button>
              <button 
                type="button" 
                onClick={handleCancel} 
                disabled={busy}
                className="flex-1 flex items-center justify-center rounded-xl bg-[var(--red)] px-4 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 shadow-sm disabled:opacity-50"
              >
                {busy ? (
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : null}
                {busy ? "Memproses..." : "Ya, Batalkan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
