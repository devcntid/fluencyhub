"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";

export type CmsField = {
  name: string;
  label: string;
  type?: "text" | "textarea" | "number" | "checkbox" | "select" | "color";
  options?: string[];
  hideInTable?: boolean;
  min?: number;
  max?: number;
};

function cellValue(item: Record<string, unknown>, field: CmsField) {
  const v = item[field.name];
  if (field.type === "checkbox") {
    return (
      <span className={v ? "badge badge-success" : "badge badge-warning"}>{v ? "active" : "hidden"}</span>
    );
  }
  if (field.type === "textarea") {
    const text = String(v ?? "");
    return text.length > 80 ? `${text.slice(0, 80)}…` : text || "—";
  }
  if (v == null || v === "") return "—";
  return String(v);
}

function normalizePayload(fields: CmsField[], values: Record<string, unknown>) {
  const body: Record<string, unknown> = {};
  for (const f of fields) {
    const v = values[f.name];
    if (f.type === "number") body[f.name] = Number(v ?? 0);
    else if (f.type === "checkbox") body[f.name] = Boolean(v);
    else if (typeof v === "string" && v.trim() === "") body[f.name] = f.name.toLowerCase().includes("url") ? null : "";
    else body[f.name] = v;
  }
  return body;
}

export function CmsCollectionEditor({
  endpoint,
  fields,
  items,
  createDefaults,
  addLabel = "Add",
}: {
  endpoint: string;
  fields: CmsField[];
  items: Array<{ id: number }>;
  createDefaults: Record<string, unknown>;
  addLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [values, setValues] = useState<Record<string, unknown>>(createDefaults);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const tableFields = fields.filter((f) => !f.hideInTable);

  function startCreate() {
    setEditId(null);
    setValues(createDefaults);
    setError("");
    setOpen(true);
  }

  function startEdit(item: { id: number } & Record<string, unknown>) {
    const next: Record<string, unknown> = {};
    for (const f of fields) next[f.name] = item[f.name] ?? "";
    setEditId(item.id);
    setValues(next);
    setError("");
    setOpen(true);
  }

  async function save() {
    setBusy(true);
    setError("");
    const body = normalizePayload(fields, values);
    const res = await fetch(editId == null ? endpoint : `${endpoint}/${editId}`, {
      method: editId == null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      setError("Save failed. Check required fields.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(id: number) {
    if (!confirm("Delete this item?")) return;
    setBusy(true);
    await fetch(`${endpoint}/${id}`, { method: "DELETE" });
    setBusy(false);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-3 flex justify-end">
        <button type="button" className="btn btn-primary btn-sm" onClick={startCreate}>
          {addLabel}
        </button>
      </div>
      <AdminDataGrid columns={[...tableFields.map((f) => f.label), "Actions"]} rowCount={items.length}>
        {({ start, end }) =>
          items.slice(start, end).map((raw, i) => {
            const item = raw as { id: number } & Record<string, unknown>;
            return (
              <tr key={item.id}>
                <td className="text-[var(--text-3)]">{start + i + 1}</td>
                {tableFields.map((f) => (
                  <td key={f.name} className={f === tableFields[0] ? "font-semibold" : ""}>
                    {cellValue(item, f)}
                  </td>
                ))}
                <td>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => startEdit(item)}>
                      Edit
                    </button>
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => remove(item.id)}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })
        }
      </AdminDataGrid>
      <AdminFormDialog title={editId == null ? addLabel : "Edit"} open={open} onClose={() => setOpen(false)}>
        <FieldGrid fields={fields} values={values} onChange={setValues} />
        {error ? <p className="mt-3 text-sm text-[var(--red)]">{error}</p> : null}
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-secondary btn-sm" onClick={() => setOpen(false)}>
            Cancel
          </button>
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </AdminFormDialog>
    </div>
  );
}

function FieldGrid({
  fields,
  values,
  onChange,
}: {
  fields: CmsField[];
  values: Record<string, unknown>;
  onChange: (v: Record<string, unknown>) => void;
}) {
  return (
    <div className="grid gap-3">
      {fields.map((f) => (
        <label key={f.name}>
          <span className="label">{f.label}</span>
          {f.type === "textarea" ? (
            <textarea
              className="input min-h-24"
              value={String(values[f.name] ?? "")}
              onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
            />
          ) : f.type === "checkbox" ? (
            <input
              type="checkbox"
              checked={Boolean(values[f.name])}
              onChange={(e) => onChange({ ...values, [f.name]: e.target.checked })}
            />
          ) : f.type === "number" ? (
            <input
              className="input"
              type="number"
              min={f.min}
              max={f.max}
              value={Number(values[f.name] ?? 0)}
              onChange={(e) => onChange({ ...values, [f.name]: Number(e.target.value) })}
            />
          ) : f.type === "select" ? (
            <select
              className="input"
              value={String(values[f.name] ?? "")}
              onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
            >
              {f.options?.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          ) : f.type === "color" ? (
            <div className="flex gap-3 items-center">
              <input
                className="h-10 w-14 cursor-pointer rounded border border-zinc-200 bg-white p-1"
                type="color"
                value={String(values[f.name] ?? "#000000")}
                onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
              />
              <input
                className="input flex-1 font-mono text-sm uppercase"
                type="text"
                value={String(values[f.name] ?? "")}
                onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
              />
            </div>
          ) : (
            <input
              className="input"
              value={String(values[f.name] ?? "")}
              onChange={(e) => onChange({ ...values, [f.name]: e.target.value })}
            />
          )}
        </label>
      ))}
    </div>
  );
}
