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

function formatDate(iso: string) {
  try {
    const d = new Date(iso);
    return d.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

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
  const [roleFilter, setRoleFilter] = useState<"all" | "user" | "instructor" | "admin">("all");
  const [submitted, setSubmitted] = useState(false);

  const [enrollUserId, setEnrollUserId] = useState<number | null>(null);
  const [enrollCourseId, setEnrollCourseId] = useState<number>(0);

  // Statistics
  const totalCount = users.length;
  const activeStudentCount = users.filter((u) => u.role === "user" && u.isActive && !u.deletedAt).length;
  const instructorCount = users.filter((u) => u.role === "instructor" && !u.deletedAt).length;
  const adminCount = users.filter((u) => u.role === "admin" && !u.deletedAt).length;

  const filteredUsers = users.filter((u) => {
    // Role filter
    if (roleFilter !== "all" && u.role !== roleFilter) return false;

    // Search query
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
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
      const json = (await res.json().catch(() => ({}))) as {
        error?: string | { fieldErrors?: Record<string, string[]> };
      };
      if (json.error && typeof json.error === "object" && json.error.fieldErrors) {
        const firstField = Object.keys(json.error.fieldErrors)[0];
        const firstMsg = json.error.fieldErrors[firstField]?.[0];
        setError(`Invalid data for ${firstField}: ${firstMsg}`);
      } else {
        setError(typeof json.error === "string" ? json.error : "Save failed");
      }
      return;
    }
    setOpen(false);
    toast.success(editId == null ? "Pengguna baru berhasil ditambahkan!" : "Data pengguna berhasil diperbarui!");
    router.refresh();
  }

  async function remove(u: UserRow) {
    if (currentUserId != null && u.id === currentUserId) {
      toast.warning("Anda tidak dapat menghapus akun Anda sendiri.");
      return;
    }
    const ok = await confirm({
      title: `Hapus Pengguna ${u.name}?`,
      message: `Pengguna "${u.name}" (${u.email}) akan dinonaktifkan dari platform.`,
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
      toast.success(`Pengguna ${u.name} berhasil dinonaktifkan.`);
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
    toast.success("Pengguna berhasil didaftarkan ke kursus!");
    setEnrollUserId(null);
    setEnrollCourseId(0);
    router.refresh();
  }

  return (
    <div className="space-y-5">
      {/* Top Header & Overview Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight font-heading">
            Kelola Pengguna & Siswa
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Manajemen akun pengguna, hak akses role, serta penugasan kelas siswa English Ready.
          </p>
        </div>
        <button
          type="button"
          onClick={startCreate}
          className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold text-white bg-[#0073F5] hover:bg-[#0062D1] shadow-xs hover:shadow transition-all shrink-0 cursor-pointer"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Pengguna
        </button>
      </div>

      {/* Mini KPI Metric Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Total Pengguna
            </span>
            <span className="text-lg font-black text-slate-900 font-heading">{totalCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#0073F5] flex items-center justify-center font-bold text-xs">
            👥
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Siswa Aktif
            </span>
            <span className="text-lg font-black text-slate-900 font-heading">{activeStudentCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-xs">
            🎓
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Instruktur
            </span>
            <span className="text-lg font-black text-slate-900 font-heading">{instructorCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold text-xs">
            👨‍🏫
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-200/80 p-3 shadow-2xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
              Administrator
            </span>
            <span className="text-lg font-black text-slate-900 font-heading">{adminCount}</span>
          </div>
          <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs">
            🛡️
          </div>
        </div>
      </div>

      {/* Main Table Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          {/* Role Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <button
              type="button"
              onClick={() => setRoleFilter("all")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                roleFilter === "all"
                  ? "bg-[#0B2559] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Semua ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("user")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                roleFilter === "user"
                  ? "bg-[#0073F5] text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Siswa ({activeStudentCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("instructor")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                roleFilter === "instructor"
                  ? "bg-purple-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Instruktur ({instructorCount})
            </button>
            <button
              type="button"
              onClick={() => setRoleFilter("admin")}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 ${
                roleFilter === "admin"
                  ? "bg-rose-600 text-white shadow-2xs"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              Admin ({adminCount})
            </button>
          </div>

          {/* Search Input */}
          <div className="relative min-w-[240px]">
            <svg
              className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder="Cari nama, email, whatsapp..."
              className="w-full rounded-xl border border-slate-200/90 pl-9 pr-3 py-1.5 text-xs text-slate-800 placeholder-slate-400 focus:border-[#0073F5] focus:ring-1 focus:ring-blue-100 outline-none transition"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Data Grid with 7 clean columns */}
        <div className="w-full overflow-hidden">
          <AdminDataGrid
            columns={["Pengguna", "WhatsApp", "Role", "Kelas Terdaftar", "Status", "Bergabung", "Aksi"]}
            rowCount={filteredUsers.length}
          >
            {({ start, end }) =>
              filteredUsers.slice(start, end).map((u, i) => {
                const initial = (u.name || "U").trim().charAt(0).toUpperCase();

                return (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* NO */}
                    <td className="text-center font-medium text-slate-400 text-xs w-12 py-3.5">
                      {start + i + 1}
                    </td>

                    {/* PENGGUNA (Name + Email + Avatar) */}
                    <td className="py-3.5 whitespace-nowrap">
                      <div className="flex items-center gap-3">
                        {u.avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={u.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-slate-200 shrink-0"
                          />
                        ) : (
                          <div
                            className={`w-8 h-8 rounded-full text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-2xs ${
                              u.role === "admin"
                                ? "bg-gradient-to-tr from-rose-600 to-rose-400"
                                : u.role === "instructor"
                                ? "bg-gradient-to-tr from-purple-700 to-indigo-500"
                                : "bg-gradient-to-tr from-[#0B2559] to-[#0073F5]"
                            }`}
                          >
                            {initial}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 text-xs sm:text-sm truncate max-w-[200px] sm:max-w-none">
                            {u.name}
                          </p>
                          <span className="font-mono text-[11px] text-slate-400 block truncate max-w-[220px] sm:max-w-none">
                            {u.email}
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* WHATSAPP */}
                    <td className="py-3.5 whitespace-nowrap">
                      {u.whatsappNumber ? (
                        <span className="inline-flex items-center gap-1.5 font-mono text-xs text-slate-700 bg-slate-100/80 px-2 py-0.5 rounded-md border border-slate-200/60">
                          <span className="text-emerald-500 font-bold">●</span>
                          {u.whatsappNumber}
                        </span>
                      ) : (
                        <span className="text-slate-300 font-mono text-xs">—</span>
                      )}
                    </td>

                    {/* ROLE */}
                    <td className="py-3.5 whitespace-nowrap">
                      <div className="inline-flex items-center gap-1.5">
                        <span
                          className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            u.role === "admin"
                              ? "bg-rose-50 text-rose-700 border-rose-200"
                              : u.role === "instructor"
                              ? "bg-purple-50 text-purple-700 border-purple-200"
                              : "bg-blue-50 text-[#0062D1] border-blue-200"
                          }`}
                        >
                          {u.role}
                        </span>
                        {u.role === "instructor" && (
                          <span className="text-[10px] font-bold text-purple-700 bg-purple-100/70 px-1.5 py-0.2 rounded">
                            {u.revenueSharePct}%
                          </span>
                        )}
                      </div>
                    </td>

                    {/* KELAS TERDAFTAR */}
                    <td className="py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold ${
                          u.enrolledCount > 0
                            ? "bg-emerald-50 text-emerald-800 border border-emerald-200/80 font-bold"
                            : "bg-slate-100 text-slate-400"
                        }`}
                      >
                        {u.enrolledCount > 0 ? `🎓 ${u.enrolledCount} Kelas` : "0 Kelas"}
                      </span>
                    </td>

                    {/* STATUS */}
                    <td className="py-3.5 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${
                          u.deletedAt
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : u.isActive
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                            : "bg-amber-50 text-amber-700 border-amber-200"
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            u.deletedAt ? "bg-rose-500" : u.isActive ? "bg-emerald-500" : "bg-amber-500"
                          }`}
                        />
                        {u.deletedAt ? "Deleted" : u.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    {/* JOINED DATE */}
                    <td className="py-3.5 whitespace-nowrap text-xs text-slate-500 font-medium">
                      {formatDate(u.createdAt)}
                    </td>

                    {/* AKSI (Never cut off!) */}
                    <td className="py-3.5 whitespace-nowrap min-w-[210px]">
                      <div className="flex items-center gap-1.5">
                        {!u.deletedAt && (
                          <>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-slate-700 bg-white border border-slate-200 hover:bg-slate-50 rounded-lg transition cursor-pointer shadow-2xs"
                              disabled={busy}
                              onClick={() => startEdit(u)}
                            >
                              <svg className="w-3 h-3 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                              Edit
                            </button>
                            <button
                              type="button"
                              className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-white bg-[#0073F5] hover:bg-[#0062D1] rounded-lg transition cursor-pointer shadow-2xs"
                              disabled={busy}
                              onClick={() => setEnrollUserId(u.id)}
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
                              </svg>
                              Enroll
                            </button>
                          </>
                        )}
                        {u.deletedAt ? (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 hover:bg-emerald-100 rounded-lg transition cursor-pointer shadow-2xs"
                            disabled={busy}
                            onClick={() => restore(u)}
                          >
                            <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
                        ) : (
                          <button
                            type="button"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold text-rose-700 bg-rose-50 border border-rose-200 hover:bg-rose-100 rounded-lg transition cursor-pointer shadow-2xs"
                            disabled={busy}
                            onClick={() => remove(u)}
                          >
                            <svg className="w-3 h-3 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            }
          </AdminDataGrid>
        </div>
      </div>

      {/* Add / Edit Dialog */}
      <AdminFormDialog
        title={editId == null ? "Tambah Pengguna Baru" : "Edit Data Pengguna"}
        open={open}
        onClose={() => setOpen(false)}
      >
        <div className="grid gap-3.5">
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-700">Nama Lengkap *</span>
            <input
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-semibold focus:border-[#0073F5] outline-none"
              value={values.name}
              placeholder="Contoh: Muhammad Zaky"
              onChange={(e) => setValues((v) => ({ ...v, name: e.target.value }))}
            />
            {submitted && !values.name.trim() && (
              <span className="text-[11px] font-medium text-rose-600">⚠️ Nama wajib diisi.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-700">Email *</span>
            <input
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-[#0073F5] outline-none"
              type="email"
              placeholder="user@example.com"
              value={values.email}
              onChange={(e) => setValues((v) => ({ ...v, email: e.target.value }))}
            />
            {submitted && !values.email.trim() && (
              <span className="text-[11px] font-medium text-rose-600">⚠️ Email wajib diisi.</span>
            )}
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-700">Nomor WhatsApp</span>
            <input
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-[#0073F5] outline-none"
              placeholder="Contoh: 081234567890"
              value={values.whatsappNumber}
              onChange={(e) => setValues((v) => ({ ...v, whatsappNumber: e.target.value }))}
            />
          </label>

          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-700">Avatar URL (Opsional)</span>
            <input
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm focus:border-[#0073F5] outline-none"
              placeholder="https://..."
              value={values.avatarUrl}
              onChange={(e) => setValues((v) => ({ ...v, avatarUrl: e.target.value }))}
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-xs font-bold text-slate-700">Role Pengguna</span>
              <select
                className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-semibold bg-white focus:border-[#0073F5] outline-none"
                value={values.role}
                onChange={(e) =>
                  setValues((v) => ({ ...v, role: e.target.value as UserRow["role"] }))
                }
              >
                <option value="user">User (Siswa)</option>
                <option value="instructor">Instructor</option>
                <option value="admin">Administrator</option>
              </select>
            </label>

            {values.role === "instructor" ? (
              <label className="flex flex-col gap-1">
                <span className="text-xs font-bold text-slate-700">Revenue Share %</span>
                <input
                  className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-semibold focus:border-[#0073F5] outline-none"
                  value={values.revenueSharePct}
                  placeholder="70.00"
                  onChange={(e) => setValues((v) => ({ ...v, revenueSharePct: e.target.value }))}
                />
              </label>
            ) : (
              <label className="flex items-center gap-2 pt-6">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded text-[#0073F5] focus:ring-blue-500"
                  checked={values.isActive}
                  onChange={(e) => setValues((v) => ({ ...v, isActive: e.target.checked }))}
                />
                <span className="text-xs font-bold text-slate-700">Akun Aktif</span>
              </label>
            )}
          </div>
        </div>

        {error ? <p className="mt-3 text-xs font-bold text-rose-600">{error}</p> : null}

        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            onClick={() => setOpen(false)}
          >
            Batal
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-xl bg-[#0073F5] hover:bg-[#0062D1] text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            disabled={busy}
            onClick={save}
          >
            {busy ? "Menyimpan..." : "Simpan Pengguna"}
          </button>
        </div>
      </AdminFormDialog>

      {/* Enroll Dialog */}
      <AdminFormDialog
        title="Daftarkan Siswa ke Kelas"
        open={enrollUserId !== null}
        onClose={() => {
          setEnrollUserId(null);
          setEnrollCourseId(0);
        }}
      >
        <div className="grid gap-3.5">
          <p className="text-xs text-slate-500">
            Pilih kelas resmi yang ingin diberikan akses langsung kepada siswa ini secara manual:
          </p>
          <label className="flex flex-col gap-1">
            <span className="text-xs font-bold text-slate-700">Pilih Kelas Program</span>
            <select
              className="w-full rounded-xl border border-slate-300 p-2.5 text-xs sm:text-sm font-semibold bg-white focus:border-[#0073F5] outline-none"
              value={enrollCourseId}
              onChange={(e) => setEnrollCourseId(Number(e.target.value))}
            >
              <option value={0}>-- Pilih Kelas --</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.title}
                </option>
              ))}
            </select>
          </label>
        </div>
        <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
          <button
            type="button"
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
            onClick={() => {
              setEnrollUserId(null);
              setEnrollCourseId(0);
            }}
          >
            Batal
          </button>
          <button
            type="button"
            className="px-5 py-2 rounded-xl bg-[#0073F5] hover:bg-[#0062D1] text-xs font-bold text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
            disabled={busy || enrollCourseId === 0}
            onClick={submitEnroll}
          >
            {busy ? "Mendaftarkan..." : "Daftarkan ke Kelas"}
          </button>
        </div>
      </AdminFormDialog>
    </div>
  );
}
