"use client";

import { useState } from "react";

const GROUPS: Array<{ title: string; keys: Array<{ key: string; label: string; area?: boolean }> }> = [
  {
    title: "Hero",
    keys: [
      { key: "hero_eyebrow", label: "Eyebrow" },
      { key: "hero_title", label: "Title" },
      { key: "hero_title_highlight", label: "Title highlight" },
      { key: "hero_subtitle", label: "Subtitle", area: true },
      { key: "hero_social_proof", label: "Social proof", area: true },
      { key: "hero_image_url", label: "Image URL" },
      { key: "hero_stat_label", label: "Stat label" },
      { key: "hero_stat_value", label: "Stat value" },
    ],
  },
  {
    title: "Method image",
    keys: [{ key: "method_image_url", label: "Image URL" }],
  },
  {
    title: "Final CTA",
    keys: [
      { key: "cta_title", label: "Title" },
      { key: "cta_subtitle", label: "Subtitle", area: true },
    ],
  },
];

export function CmsSettingsForm({ initial }: { initial: Record<string, string> }) {
  const [values, setValues] = useState<Record<string, string>>(() => {
    const next: Record<string, string> = {};
    for (const g of GROUPS) for (const f of g.keys) next[f.key] = initial[f.key] ?? "";
    return next;
  });
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  async function save() {
    setBusy(true);
    setMsg("");
    const res = await fetch("/api/admin/cms/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(values),
    });
    
    if (!res.ok) {
      const json = await res.json().catch(() => null);
      if (json?.error) {
        setMsg("Gagal menyimpan: Beberapa kolom tidak boleh kosong");
      } else {
        setMsg("Save failed");
      }
    } else {
      setMsg("Saved successfully");
    }
    setBusy(false);
  }

  return (
    <form className="card w-full" onSubmit={(e) => { e.preventDefault(); save(); }}>
      {GROUPS.map((g) => (
        <fieldset key={g.title} className="mb-6 border-0 p-0">
          <legend className="mb-3 font-[family-name:var(--font-heading)] text-base font-extrabold">{g.title}</legend>
          <div className="grid gap-3">
            {g.keys.map((f) => (
              <label key={f.key} className="relative flex flex-col">
                <span className="label mb-1">{f.label}</span>
                {f.area ? (
                  <div className="flex flex-col">
                    <textarea
                      className="input min-h-20 peer invalid:border-red-500 invalid:focus:ring-red-200"
                      value={values[f.key]}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      required
                    />
                    {!values[f.key] && (
                      <span className="text-xs text-red-500 mt-1 font-medium">Kotak ini tidak boleh kosong</span>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col">
                    <div className="flex gap-4 items-start">
                      <input
                        className="input flex-1 peer invalid:border-red-500 invalid:focus:ring-red-200"
                        value={values[f.key]}
                        onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                        required
                      />
                      {f.key.includes("image_url") && values[f.key] && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={values[f.key]}
                          alt="Preview"
                          className="h-10 w-16 object-cover rounded border border-[var(--border)]"
                        />
                      )}
                    </div>
                    {!values[f.key] && (
                      <span className="text-xs text-red-500 mt-1 font-medium">Kotak ini tidak boleh kosong</span>
                    )}
                  </div>
                )}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      {msg ? <p className="mb-3 text-sm text-[var(--text-3)]">{msg}</p> : null}
      <button type="submit" className="btn btn-primary btn-default" disabled={busy}>
        {busy ? "Saving..." : "Save settings"}
      </button>
    </form>
  );
}
