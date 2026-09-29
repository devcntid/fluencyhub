"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function ProofVerifyActions({ proofId }: { proofId: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");
  const [error, setError] = useState("");

  async function act(action: "approve" | "reject" | "cancel") {
    if ((action === "reject" || action === "cancel") && !note.trim()) {
      setError("Note is required for rejecting or cancelling");
      return;
    }
    setBusy(true);
    setError("");
    const res = await fetch(`/api/payment-proofs/${proofId}/verify`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, note }),
    });
    setBusy(false);
    if (!res.ok) {
      setError(`Action ${action} failed.`);
      return;
    }
    router.refresh();
  }

  return (
    <div className="mt-3 flex flex-col gap-2">
      {error ? <p className="text-sm text-[var(--red)]">{error}</p> : null}
      <input className="input" placeholder="Reject/Cancel note (required)" value={note} onChange={(e) => setNote(e.target.value)} />
      <div className="flex gap-2">
        <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => act("approve")}>
          Approve & enroll
        </button>
        <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => act("reject")}>
          Reject (Retry)
        </button>
        <button type="button" className="btn btn-sm bg-red-600 text-white hover:bg-red-700" disabled={busy} onClick={() => act("cancel")}>
          Cancel Order
        </button>
      </div>
    </div>
  );
}
