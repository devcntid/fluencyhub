"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { AdminDataGrid } from "@/components/admin/AdminDataGrid";
import { AdminFormDialog } from "@/components/admin/AdminFormDialog";
import { useConfirm, useToast } from "@/components/ui/NotificationProvider";

type UserRow = {
  id: number;
  name: string;
  email: string;
  whatsappNumber: string | null;
  avatarUrl: string | null;
  role: "user" | "instructor" | "admin";
  enrolledCount: number;
  isActive: boolean;
  revenueSharePct: string;
  createdAt: string;
  deletedAt: string | null;
};

type Draft = {
  name: string;
  email: string;
  whatsappNumber: string;
  avatarUrl: string;
  role: UserRow["role"];
  isActive: boolean;
  revenueSharePct: string;
};

const empty: Draft = {
  name: "",
  email: "",
  whatsappNumber: "",
  avatarUrl: "",
  role: "user",
  isActive: true,
  revenueSharePct: "70.00",
};

export function UserAdminTable({
  users,
  currentUserId,
  courses = [],
}: {
  users: UserRow[];
  currentUserId: number | null;
  courses?: { id: number; title: string }[];
}) {
  const router = useRouter();
  const confirm = useConfirm();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [values, setValues] = useState<Draft>(empty);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [submitted, setSubmitted] = useState(false);
  
  const [enrollUserId, setEnrollUserId] = useState<number | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState<number>(0);

  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase();
    return (
      u.name.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      (u.whatsappNumber && u.whatsappNumber.includes(q))
    );
  });

  function startCreate() {
    setEditId(null);
    setValues(empty);
    setError("");
    setSubmitted(false);
    setOpen(true);
  }

  function startEdit(u: UserRow) {
    setEditId(u.id);
    setValues({
      name: u.name,
      email: u.email,
      whatsappNumber: u.whatsappNumber ?? "",
      avatarUrl: u.avatarUrl ?? "",
      role: u.role,
      isActive: u.isActive,
      revenueSharePct: u.revenueSharePct,
    });
    setError("");
    setSubmitted(false);
    setOpen(true);
  }

  async function save() {
    setSubmitted(true);
    setError("");
    if (!values.name.trim() || !values.email.trim()) {
      return;
    }
    setBusy(true);
    const body = {
      name: values.name,
      email: values.email,
      whatsappNumber: values.whatsappNumber || null,
      avatarUrl: values.avatarUrl || null,
      role: values.role,
      isActive: values.isActive,
      revenueSharePct: values.revenueSharePct || "70.00",
    };
    const res = await fetch(editId == null ? "/api/admin/users" : `/api/admin/users/${editId}`, {
      method: editId == null ? "POST" : "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string | { fieldErrors?: Record<string, string[]> } };
      if (json.error && typeof json.error === "object" && json.error.fieldErrors) {
        // Zod error
        const firstField = Object.keys(json.error.fieldErrors)[0];
        const firstMsg = json.error.fieldErrors[firstField]?.[0];
        setError(`Invalid data for ${firstField}: ${firstMsg}`);
      } else {
        setError(typeof json.error === "string" ? json.error : "Save failed");
      }
      return;
    }
    setOpen(false);
    router.refresh();
  }

  async function remove(u: UserRow) {
    if (currentUserId != null && u.id === currentUserId) {
      toast.warning("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    const ok = await confirm({
      title: `Hapus Pengguna ${u.name}?`,
      message: `Pengguna "${u.name}" (${u.email}) akan disembunyikan dan dinonaktifkan dari platform.`,
      confirmText: "Ya, Hapus Pengguna",
      cancelText: "Batal",
      variant: "danger",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(typeof json.error === "string" ? json.error : "Gagal menghapus pengguna.");
        return;
      }
      toast.success(`Pengguna ${u.name} berhasil dihapus.`);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  }

  async function restore(u: UserRow) {
    const ok = await confirm({
      title: `Pulihkan Pengguna ${u.name}?`,
      message: `Akun "${u.name}" (${u.email}) akan diaktifkan kembali dan dapat login ke platform.`,
      confirmText: "Ya, Pulihkan",
      cancelText: "Batal",
      variant: "info",
    });
    if (!ok) return;

    setBusy(true);
    try {
      const res = await fetch(`/api/admin/users/${u.id}/restore`, { method: "POST" });
      if (!res.ok) {
        const json = (await res.json().catch(() => ({}))) as { error?: string };
        toast.error(typeof json.error === "string" ? json.error : "Gagal memulihkan pengguna.");
        return;
      }
      toast.success(`Pengguna ${u.name} berhasil dipulihkan!`);
      router.refresh();
    } catch {
      toast.error("Terjadi kesalahan jaringan.");
    } finally {
      setBusy(false);
    }
  }

  async function submitEnroll() {
    if (!enrollUserId || !enrollCourseId) return;
    setBusy(true);
    const res = await fetch(`/api/admin/users/${enrollUserId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ courseId: enrollCourseId }),
    });
    setBusy(false);
    if (!res.ok) {
      const json = (await res.json().catch(() => ({}))) as { error?: string };
      alert(typeof json.error === "string" ? json.error : "Enrollment failed");
      return;
    }
    setEnrollUserId(null);
    setEnrollCourseId(0);
    router.refresh();
  }

  return (
    <div>
      <div className="mb-4 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-extrabold">Users</h1>
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
              placeholder="Cari user..."
              className="input !pl-9 text-sm py-1.5"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <button type="button" className="btn btn-primary btn-sm shrink-0" onClick={startCreate}>
            Add user
          </button>
        </div>
      </div>
      <AdminDataGrid
        columns={["Name", "Email", "WhatsApp", "Role", "Enrolled", "Share %", "Status", "Joined", "Actions"]}
        rowCount={filteredUsers.length}
      >
        {({ start, end }) =>
          filteredUsers.slice(start, end).map((u, i) => (
            <tr key={u.id}>
              <td className="text-[var(--text-3)]">{start + i + 1}</td>
              <td className="font-semibold">{u.name}</td>
              <td>{u.email}</td>
              <td>{u.whatsappNumber ?? "—"}</td>
              <td>
                <span className={u.role === "admin" ? "badge badge-danger" : "badge badge-primary"}>{u.role}</span>
              </td>
              <td>{u.enrolledCount}</td>
              <td>{u.revenueSharePct}</td>
              <td>
                <span className={u.deletedAt ? "badge badge-danger" : u.isActive ? "badge badge-success" : "badge badge-warning"}>
                  {u.deletedAt ? "deleted" : u.isActive ? "active" : "inactive"}
                </span>
              </td>
              <td>{new Date(u.createdAt).toLocaleDateString("id-ID")}</td>
              <td>
                <div className="flex gap-2">
                  {!u.deletedAt && (
                    <>
                      <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => startEdit(u)}>
                        Edit
                      </button>
                      <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={() => setEnrollUserId(u.id)}>
                        Enroll
                      </button>
                    </>
                  )}
                  {u.deletedAt ? (
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => restore(u)}>
                      Restore
                    </button>
                  ) : (
                    <button type="button" className="btn btn-secondary btn-sm" disabled={busy} onClick={() => remove(u)}>
                      Delete
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))
        }
      </AdminDataGrid>
      <AdminFormDialog title={editId == null ? "Add user" : "Edit user"} open={open} onClose={() => setOpen(false)}>
        <div className="grid gap-3">
          <label className="flex flex-col">
            <span className="label">Name</span>
            <input className="input" value={values.name} onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))} />
            {submitted && !values.name.trim() && <span className="mt-1 text-[11px] font-medium text-[var(--red)]">⚠️ Data nama masih kosong, tolong di isi.</span>}
          </label>
          <label className="flex flex-col">
            <span className="label">Email</span>
            <input
              className="input"
              type="email"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
            {submitted && !values.email.trim() && <span className="mt-1 text-[11px] font-medium text-[var(--red)]">⚠️ Data email masih kosong, tolong di isi.</span>}
          </label>
          <label>
            <span className="label">WhatsApp</span>
            <input
              className="input"
              value={values.whatsappNumber}
              onChange={(e) => setValues((v) => ({ ...v, whatsappNumber: e.target.value }))}
            />
          </label>
          <label>
            <span className="label">Avatar URL</span>
            <input
              className="input"
              value={values.avatarUrl}
              onChange={(e) => setValues((v) => ({ ...v, avatarUrl: e.target.value }))}
            />
          </label>
          <label>
            <span className="label">Role</span>
            <select
              className="input"
              value={values.role}
              onChange={(e) => setValues((v) => ({ ...v, role: e.target.value as UserRow["role"] }))}
            >
              <option value="user">user</option>
              <option value="instructor">instructor</option>
              <option value="admin">admin</option>
            </select>
          </label>
          {values.role === "instructor" && (
            <label>
              <span className="label">Revenue share %</span>
              <input
                className="input"
                value={values.revenueSharePct}
                onChange={(e) => setValues((v) => ({ ...v, revenueSharePct: e.target.value }))}
              />
            </label>
          )}
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={values.isActive}
              onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
            />
            <span className="text-sm font-semibold">Active</span>
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
            disabled={busy}
            onClick={save}
          >
            {busy ? "Saving..." : "Save"}
          </button>
        </div>
      </AdminFormDialog>

      <AdminFormDialog 
        title="Enroll User to Course" 
        open={enrollUserId !== null} 
        onClose={() => { setEnrollUserId(null); setEnrollCourseId(0); }}
      >
        <div className="grid gap-3">
          <label className="flex flex-col">
            <span className="label">Select Course</span>
            <select
              className="input"
              value={enrollCourseId}
              onChange={(e) => setEnrollCourseId(Number(e.target.value))}
            >
              <option value={0}>-- Select a course --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-zinc-100">
          <button
            type="button"
            className="px-5 py-2.5 rounded-xl border border-zinc-200 bg-white text-sm font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-zinc-300 transition active:scale-95 cursor-pointer shadow-xs"
            onClick={() => { setEnrollUserId(null); setEnrollCourseId(0); }}
          >
            Cancel
          </button>
          <button
            type="button"
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-sm font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50 cursor-pointer"
            disabled={busy || enrollCourseId === 0}
            onClick={submitEnroll}
          >
            {busy ? "Enrolling..." : "Enroll"}
          </button>
        </div>
      </AdminFormDialog>
    </div>
  );
}
