"use client";

import { useState } from "react";
import type { PaymentMethod } from "@/types/db";
import { PaymentMethodToggle } from "./PaymentMethodToggle";
import { useRouter } from "next/navigation";
import { AdminDataGrid } from "./AdminDataGrid";

export function AdminMethodsClient({ initialMethods }: { initialMethods: PaymentMethod[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<PaymentMethod>>({});
  const [saving, setSaving] = useState(false);

  const filtered = initialMethods.filter(
    (m) =>
      m.name.toLowerCase().includes(search.toLowerCase()) ||
      m.code.toLowerCase().includes(search.toLowerCase()) ||
      m.provider.toLowerCase().includes(search.toLowerCase())
  );

  const startEdit = (m: PaymentMethod) => {
    setEditingId(m.id);
    setFormData({
      name: m.name,
      code: m.code,
      type: m.type,
      provider: m.provider,
      adminFeeFlat: m.adminFeeFlat,
      adminFeePct: m.adminFeePct,
      accountNumber: m.accountNumber,
      accountName: m.accountName,
      logoUrl: m.logoUrl,
      isRedirect: m.isRedirect,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setFormData({});
  };

  const saveEdit = async () => {
    if (!editingId) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/admin/payment-methods/${editingId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setEditingId(null);
        router.refresh();
      } else {
        alert("Gagal menyimpan data.");
      }
    } catch (e) {
      console.error(e);
      alert("Terjadi kesalahan jaringan.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">Payment methods</h1>
        <input
          type="text"
          placeholder="Cari metode pembayaran..."
          className="rounded-md border border-zinc-300 px-3 py-2 text-sm focus:border-[var(--brand)] focus:outline-none"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <AdminDataGrid
        columns={["Provider", "Method", "Type", "Account", "Details", "Actions"]}
        rowCount={filtered.length}
      >
        {({ start, end }) =>
          filtered.slice(start, end).map((m, i) => (
            <tr key={m.id}>
              <td className="text-[var(--text-3)]">{start + i + 1}</td>
              <td>
                {m.logoUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img src={m.logoUrl} alt="" className="h-8 w-8 object-contain" />
                ) : (
                  <div className="h-8 w-8 rounded bg-[var(--surface-2)]" />
                )}
              </td>
              <td className="font-semibold">{m.name}</td>
              <td>
                <span className="badge badge-secondary">{m.type}</span>
              </td>
              <td className="text-[13px]">
                {m.type === "manual_transfer" && m.accountNumber ? (
                  <span className="font-medium text-[var(--text)]">
                    {m.accountNumber} <span className="text-[var(--text-3)]">({m.accountName || "-"})</span>
                  </span>
                ) : (
                  <span className="text-[var(--text-4)]">—</span>
                )}
              </td>
              <td className="text-[13px] text-[var(--text-3)]">
                {m.code} · {m.provider}
              </td>
              <td>
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => startEdit(m)}
                    className="btn btn-secondary btn-sm"
                  >
                    Edit
                  </button>
                  <PaymentMethodToggle id={m.id} isActive={m.isActive} />
                </div>
              </td>
            </tr>
          ))
        }
      </AdminDataGrid>

      {editingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl">
            <h2 className="mb-4 text-lg font-bold">Edit Payment Method</h2>
            
            <div className="flex flex-col gap-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-zinc-700">Name</label>
                <input
                  type="text"
                  className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                  value={formData.name || ""}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Code</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Type</label>
                  <select
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    value={formData.type || ""}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value as PaymentMethod["type"] })}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="e_wallet">E-Wallet</option>
                    <option value="va">Virtual Account</option>
                    <option value="qr_code">QR Code</option>
                    <option value="credit_card">Credit Card</option>
                    <option value="retail_outlet">Retail Outlet</option>
                    <option value="manual_transfer">Manual Transfer</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Provider</label>
                  <select
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    value={formData.provider || ""}
                    onChange={(e) => setFormData({ ...formData, provider: e.target.value as PaymentMethod["provider"] })}
                  >
                    <option value="">-- Pilih --</option>
                    <option value="midtrans">Midtrans</option>
                    <option value="xendit">Xendit</option>
                    <option value="manual">Manual</option>
                  </select>
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Logo URL</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    value={formData.logoUrl || ""}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Admin Fee (Flat)</label>
                  <input
                    type="number"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    value={formData.adminFeeFlat ?? ""}
                    onChange={(e) => setFormData({ ...formData, adminFeeFlat: e.target.value ? Number(e.target.value) : 0 })}
                  />
                </div>
                <div className="flex-1">
                  <label className="mb-1 block text-sm font-medium text-zinc-700">Admin Fee (%)</label>
                  <input
                    type="text"
                    className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                    value={formData.adminFeePct || ""}
                    onChange={(e) => setFormData({ ...formData, adminFeePct: e.target.value })}
                  />
                </div>
              </div>

              {formData.type === "manual_transfer" && (
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Nomor Rekening</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      value={formData.accountNumber || ""}
                      onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-medium text-zinc-700">Atas Nama</label>
                    <input
                      type="text"
                      className="w-full rounded-md border border-zinc-300 px-3 py-2 text-sm"
                      value={formData.accountName || ""}
                      onChange={(e) => setFormData({ ...formData, accountName: e.target.value })}
                    />
                  </div>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <input
                  type="checkbox"
                  id="isRedirect"
                  checked={formData.isRedirect || false}
                  onChange={(e) => setFormData({ ...formData, isRedirect: e.target.checked })}
                />
                <label htmlFor="isRedirect" className="text-sm font-medium text-zinc-700">
                  Is Redirect (Web Checkout)
                </label>
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={cancelEdit}
                className="rounded-md px-4 py-2 text-sm font-semibold text-zinc-600 hover:bg-zinc-100"
                disabled={saving}
              >
                Batal
              </button>
              <button
                onClick={saveEdit}
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
                disabled={saving}
              >
                {saving ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
