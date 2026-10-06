import { ProofVerifyActions } from "@/components/admin/ProofVerifyActions";
import { listPendingProofs } from "@/lib/db/payment-proofs.queries";
import { formatIdr } from "@/lib/utils/cn";

function timeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffHrs = Math.floor(diffMs / 1000 / 60 / 60);
  if (diffHrs < 1) {
    const diffMins = Math.floor(diffMs / 1000 / 60);
    return `${diffMins} menit lalu`;
  }
  return `${diffHrs} jam lalu`;
}

function fileName(url: string) {
  try {
    const parsed = new URL(url);
    const parts = parsed.pathname.split("/");
    return parts[parts.length - 1];
  } catch {
    return "document_proof";
  }
}

export default async function VerifyPaymentsPage() {
  const proofs = await listPendingProofs();
  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="mb-1 text-2xl font-extrabold">Manual Transfer Verification</h1>
      <p className="mb-6 text-sm text-[var(--text-3)]">Review dan verifikasi bukti transfer bank dari user.</p>

      {proofs.length === 0 ? (
        <p className="text-sm text-[var(--text-3)]">No pending proofs.</p>
      ) : (
        <div className="space-y-6">
          {proofs.map((p) => (
            <div key={p.id} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <div className="mb-6 flex items-center gap-3">
                <span className="flex items-center gap-1.5 rounded-full border border-yellow-300 bg-yellow-50 px-3 py-1 text-xs font-semibold text-yellow-700">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                  Pending Verification
                </span>
                <span className="text-xs font-medium text-gray-500">Upload: {timeAgo(p.uploadedAt.toString())}</span>
              </div>

              <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_350px]">
                {/* Left Column */}
                <div className="flex flex-col gap-4 text-[13px]">
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-gray-500">Order #:</span>
                    <span className="font-bold text-gray-900">{p.orderNumber}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-gray-500">Buyer:</span>
                    <span className="font-semibold text-gray-900">{p.userName}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-gray-500">WhatsApp:</span>
                    <span className="font-semibold text-gray-900">{p.whatsappNumber ?? "—"}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-gray-500">Course:</span>
                    <span className="font-semibold text-gray-900">{p.courseTitle}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-gray-500">Amount:</span>
                    <span className="font-semibold text-gray-900">{formatIdr(p.amount)}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr]">
                    <span className="font-medium text-gray-500">Bank:</span>
                    <span className="font-semibold text-gray-900">{p.bankName ?? "—"}</span>
                  </div>
                  <div className="grid grid-cols-[100px_1fr] sm:grid-cols-[140px_1fr] items-start">
                    <span className="font-medium text-gray-500">File:</span>
                    <span className="font-semibold text-gray-900 break-all">{p.fileName || fileName(p.fileUrl)}</span>
                  </div>
                </div>

                {/* Right Column */}
                <div className="flex flex-col gap-4">
                  <div className="flex min-h-[140px] flex-1 flex-col items-center justify-center rounded-xl border border-gray-200 bg-gray-50 p-2 text-center overflow-hidden">
                    {p.fileUrl.match(/\.(png|jpe?g|webp)$/i) ? (
                      <a href={p.fileUrl} target="_blank" rel="noreferrer" className="block w-full h-full cursor-zoom-in">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={p.fileUrl} alt="Bukti Transfer" className="max-h-[220px] w-full object-contain rounded-lg transition-transform hover:scale-105" />
                      </a>
                    ) : (
                      <div className="py-6">
                        <svg className="mb-2 mx-auto text-gray-400" xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2-2h12a2 2 0 0 0 2-2V7.5L14.5 2z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><line x1="10" y1="9" x2="8" y2="9"></line></svg>
                        <p className="text-xs font-semibold text-gray-700 max-w-[200px] truncate mx-auto">{p.fileName || fileName(p.fileUrl)}</p>
                        <a href={p.fileUrl} target="_blank" rel="noreferrer" className="mt-2 flex items-center justify-center gap-1 text-[11px] font-bold text-blue-600 hover:text-blue-700 hover:underline">
                          <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>
                          Klik untuk buka dokumen
                        </a>
                      </div>
                    )}
                  </div>
                  <ProofVerifyActions proofId={p.id} />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
