import { auth } from "@/lib/session";
import { getAuditLogs, getAuditLogsCount } from "@/lib/db/audit-logs.queries";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import Link from "next/link";

export default async function AuditLogsPage(props: { params: Promise<{ adminPath: string }>; searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return <div>Unauthorized</div>;

  const { adminPath } = await props.params;
  const searchParams = await props.searchParams;
  const page = typeof searchParams.page === "string" ? Math.max(1, parseInt(searchParams.page) || 1) : 1;
  const limit = 10;
  const offset = (page - 1) * limit;

  const [logs, totalCount] = await Promise.all([
    getAuditLogs(limit, offset),
    getAuditLogsCount()
  ]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-[var(--text)]">Audit Logs</h1>
      </div>

      <div className="card p-0 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-[var(--text-3)]">
              <tr>
                <th className="px-4 py-3 font-semibold w-12 text-center">No.</th>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
                <th className="px-4 py-3 font-semibold">Tipe Entitas</th>
                <th className="px-4 py-3 font-semibold">Detail / Nilai Baru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-[var(--text-3)]">
                    Belum ada log aktivitas admin.
                  </td>
                </tr>
              ) : (
                logs.map((log, idx) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-2)] transition-colors">
                    <td className="px-4 py-3 text-center font-medium text-[var(--text-3)]">
                      {offset + idx + 1}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {format(new Date(log.createdAt), "dd MMM yyyy, HH:mm", { locale: id })}
                    </td>
                    <td className="px-4 py-3">
                      <span className="badge badge-primary uppercase text-[10px]">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[var(--text-2)] capitalize">
                      {log.entityType?.replace("_", " ") ?? "-"}
                    </td>
                    <td className="px-4 py-3">
                      <pre className="text-xs bg-[var(--surface-2)] p-2 rounded max-w-xs overflow-x-auto whitespace-pre-wrap">
                        {log.newValueJson ? JSON.stringify(log.newValueJson, null, 2) : "-"}
                      </pre>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-[var(--text-3)]">
            Menampilkan {offset + 1}-{Math.min(offset + limit, totalCount)} dari {totalCount} log
          </div>
          <div className="flex gap-2">
            {page > 1 ? (
              <Link href={`/${adminPath}/audit?page=${page - 1}`} className="btn btn-secondary btn-sm">
                ← Sebelumnya
              </Link>
            ) : (
              <button disabled className="btn btn-secondary btn-sm opacity-50 cursor-not-allowed">
                ← Sebelumnya
              </button>
            )}
            
            <div className="flex items-center px-4 font-medium text-sm">
              Halaman {page} / {totalPages}
            </div>

            {page < totalPages ? (
              <Link href={`/${adminPath}/audit?page=${page + 1}`} className="btn btn-secondary btn-sm">
                Selanjutnya →
              </Link>
            ) : (
              <button disabled className="btn btn-secondary btn-sm opacity-50 cursor-not-allowed">
                Selanjutnya →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
