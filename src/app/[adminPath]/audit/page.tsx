import { auth } from "@/lib/session";
import { getAuditLogs } from "@/lib/db/audit-logs.queries";
import { format } from "date-fns";
import { id } from "date-fns/locale";

export default async function AuditLogsPage() {
  const session = await auth();
  if (!session?.user || session.user.role !== "admin") return <div>Unauthorized</div>;

  const logs = await getAuditLogs(100);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold font-heading text-[var(--text)]">Audit Logs</h1>
      </div>

      <div className="card p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-[var(--surface-2)] text-[var(--text-3)]">
              <tr>
                <th className="px-4 py-3 font-semibold">Waktu</th>
                <th className="px-4 py-3 font-semibold">Aksi</th>
                <th className="px-4 py-3 font-semibold">Tipe Entitas</th>
                <th className="px-4 py-3 font-semibold">Detail / Nilai Baru</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border)]">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-[var(--text-3)]">
                    Belum ada log aktivitas admin.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-[var(--surface-2)] transition-colors">
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
    </div>
  );
}
