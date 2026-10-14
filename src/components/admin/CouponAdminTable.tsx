"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { formatIdr } from "@/lib/utils/cn";
import type { Coupon } from "@/types/db";

function CouponToggle({ id, isActive }: { id: number; isActive: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    setBusy(true);
    await fetch(`/api/admin/coupons/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !isActive }),
    });
    setBusy(false);
    router.refresh();
  }

  return (
    <label className="flex cursor-pointer items-center gap-2">
      <input type="checkbox" className="checkbox" checked={isActive} onChange={toggle} disabled={busy} />
      <span className="text-sm">Active</span>
    </label>
  );
}

export function CouponAdminTable({ coupons }: { coupons: Coupon[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const empty = {
    code: "",
    description: "",
    discountType: "percentage" as "percentage" | "fixed",
    discountValue: "",
    maxUses: "",
  };
  const [values, setValues] = useState(empty);

  const filteredCoupons = coupons.filter((c) => {
    const q = searchQuery.toLowerCase();
    return (
      c.code.toLowerCase().includes(q) ||
      (c.description && c.description.toLowerCase().includes(q))
    );
  });

  function startCreate() {
    setEditId(null);
    setValues(empty);
    setError("");
    setOpen(true);
  }

  function startEdit(c: Coupon) {
    setEditId(c.id);
    setValues({
      code: c.code,
      description: c.description || "",
      discountType: c.discountType,
      discountValue: c.discountValue,
      maxUses: c.maxUses ? String(c.maxUses) : "",
    });
    setError("");
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setError("");
    const body = {
      ...values,
      maxUses: values.maxUses ? Number(values.maxUses) : null,
    };
    
    const res = await fetch(editId == null ? "/api/admin/coupons" : `/api/admin/coupons/${editId}`, {
      method: editId == null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    
    if (!res.ok) {
      setError("Failed to save coupon. Please check the code (it might already exist) or fields.");
      return;
    }
    
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">Coupons</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-4)]"
            >
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.3-4.3" />
            </svg>
            <input
              type="text"
              placeholder="Cari kupon..."
              className="input !pl-9 text-sm py-1.5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={startCreate}>
            Add coupon
          </button>
        </div>
      </div>
      
      <AdminDataGrid columns={["Code", "Description", "Discount", "Uses", "Actions"]} rowCount={filteredCoupons.length}>
        {({ start, end }) =>
          filteredCoupons.slice(start, end).map((c, i) => (
            <tr key={c.id}>
              <td className="text-[var(--text-3)]">{start + i + 1}</td>
              <td className="font-semibold text-[var(--primary)]">{c.code}</td>
              <td className="text-sm">{c.description || "—"}</td>
              <td>
                <span className="badge badge-secondary">
                  {c.discountType === "percentage" ? `${c.discountValue}%` : formatIdr(c.discountValue)}
                </span>
              </td>
              <td className="text-sm">
                {c.usedCount} / {c.maxUses ? c.maxUses : "∞"}
              </td>
              <td>
                <div className="flex items-center gap-3">
                  <button type="button" className="btn btn-secondary btn-sm" onClick={() => startEdit(c)}>
                    Edit
                  </button>
                  <CouponToggle id={c.id} isActive={c.isActive} />
                </div>
              </td>
            </tr>
          ))
        }
      </AdminDataGrid>

      <AdminFormDialog title={editId == null ? "Add coupon" : "Edit coupon"} open={open} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label>
            <span className="label">Code</span>
            <input
              className="input"
              value={values.code}
              onChange={(e) => setValues((v) => ({ ...v, code: e.target.value.toUpperCase() }))}
              placeholder="e.g. MERDEKA2024"
            />
          </label>
          <label>
            <span className="label">Description</span>
            <input
              className="input"
              value={values.description}
              onChange={(e) => setValues((v) => ({ ...v, description: e.target.value }))}
              placeholder="e.g. Diskon 17 Agustus"
            />
          </label>
          <div className="grid grid-cols-2 gap-3">
            <label>
              <span className="label">Discount Type</span>
              <select
                className="input"
                value={values.discountType}
                onChange={(e) => setValues((v) => ({ ...v, discountType: e.target.value as "percentage" | "fixed" }))}
              >
                <option value="percentage">Percentage (%)</option>
                <option value="fixed">Fixed Amount (Rp)</option>
              </select>
            </label>
            <label>
              <span className="label">Discount Value</span>
              <input
                className="input"
                type="number"
                value={values.discountValue}
                onChange={(e) => setValues((v) => ({ ...v, discountValue: e.target.value }))}
                placeholder={values.discountType === "percentage" ? "e.g. 20" : "e.g. 50000"}
              />
            </label>
          </div>
          <label>
            <span className="label">Max Uses (optional)</span>
            <input
              className="input"
              type="number"
              value={values.maxUses}
              onChange={(e) => setValues((v) => ({ ...v, maxUses: e.target.value }))}
              placeholder="Leave blank for unlimited"
            />
          </label>
        </div>
        {error ? <p className="mt-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition active:scale-95 cursor-pointer shadow-xs"
            onClick={() => setOpen(false)}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            onClick={save}
            disabled={busy}
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </AdminFormDialog>
    </div>
  );
}
