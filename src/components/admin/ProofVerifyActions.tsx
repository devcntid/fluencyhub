"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProofVerifyActions({ proofId }: { proofId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const [showModal, setShowModal] = useState<"reject" | "cancel" | null>(null);
  const [reason, setReason] = useState("");

  async function executeAction(action: "approve" | "reject" | "cancel", finalNote: string = "") {
    setBusy(true);
    const res = await fetch(`/api/payment-proofs/${proofId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note: finalNote }),
    });
    setBusy(false);

    if (!res.ok) {
      alert(`Gagal melakukan aksi ${action}. Silakan coba lagi.`);
      return;
    }
    setShowModal(null);
    setReason("");
    router.refresh();
  }

  function handleActionClick(action: "approve" | "reject" | "cancel") {
    if (action === "approve") {
      executeAction("approve");
    } else {
      setShowModal(action);
    }
  }

  function handleModalSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!reason.trim() || !showModal) return;
    executeAction(showModal, reason.trim());
  }

  return (
    <>
      <div className="flex w-full flex-col sm:flex-row gap-2 mt-2">
        <button
          type="button"
          className="flex-1 rounded-md bg-[#16a34a] px-2 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#15803d] disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
          disabled={busy}
          onClick={() => handleActionClick("approve")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
          Konfirmasi
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-orange-500 px-2 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-orange-600 disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
          disabled={busy}
          onClick={() => handleActionClick("reject")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
          Upload Ulang
        </button>
        <button
          type="button"
          className="flex-1 rounded-md bg-[#dc2626] px-2 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-[#b91c1c] disabled:opacity-50 flex items-center justify-center gap-1 whitespace-nowrap"
          disabled={busy}
          onClick={() => handleActionClick("cancel")}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
          Batal
        </button>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-5 border-b border-gray-100">
              <h3 className="text-lg font-bold text-gray-900">
                {showModal === "cancel" ? "Batalkan Order" : "Tolak Bukti Transfer"}
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                {showModal === "cancel"
                  ? "Order ini akan digagalkan dan user tidak bisa mengulang pembayaran."
                  : "User akan diminta untuk mengunggah ulang bukti transfer yang benar."}
              </p>
            </div>
            <form onSubmit={handleModalSubmit} className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Alasan {showModal === "cancel" ? "Pembatalan" : "Penolakan"}
                </label>
                <textarea
                  className="w-full rounded-xl border border-gray-300 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 min-h-[100px] resize-none"
                  placeholder="Cth: Foto bukti transfer buram, nominal tidak sesuai..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  autoFocus
                />
                {!reason.trim() && (
                  <p className="mt-2 text-xs text-red-500 font-medium">Alasan wajib diisi untuk dikirim ke user.</p>
                )}
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  className="px-4 py-2 text-sm font-semibold text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                  onClick={() => { setShowModal(null); setReason(""); }}
                  disabled={busy}
                >
                  Kembali
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 text-sm font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  disabled={!reason.trim() || busy}
                >
                  {busy ? "Memproses..." : "Konfirmasi"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
