import { getAdminOverviewStats, listOrdersForAdmin } from "@/lib/db/orders.queries";
import { listWebhookLogsRecent } from "@/lib/db/webhook-logs.queries";
import { formatIdr } from "@/lib/utils/cn";
import { AdminIcon } from "@/components/admin/AdminIcon";
import { formatDistanceToNow } from "date-fns";

function badgeClass(status: string) {
  if (status === "paid" || status === "processed") return "badge-success";
  if (status === "pending_verification" || status === "awaiting_payment" || status === "received" || status === "pending") return "badge-warning";
  if (status === "failed" || status === "expired" || status === "cancelled") return "badge-danger";
  return "badge-primary";
}

export default async function AdminOverviewPage() {
  const [stats, orders, webhooks] = await Promise.all([
    getAdminOverviewStats(),
    listOrdersForAdmin(50),
    listWebhookLogsRecent(50),
  ]);

  const cards = [
    { label: "Revenue Today", value: formatIdr(stats.todayRevenue), bg: "#f0fdf4", c: "var(--green)", icon: "DollarSign", sub: "Hari ini" },
    { label: "Revenue / Bulan", value: formatIdr(stats.monthRevenue), bg: "var(--brand-50)", c: "var(--brand)", icon: "TrendingUp", sub: "Bulan ini" },
    { label: "Active Learners", value: String(stats.learnerCount), bg: "#f5f3ff", c: "#7c3aed", icon: "Users", sub: "Total siswa aktif" },
    { label: "Pending Verify", value: String(stats.pendingProofs), bg: "var(--yellow-bg)", c: "var(--yellow)", icon: "Clock", sub: "Transfer manual" },
    { label: "Published Courses", value: String(stats.publishedCourses), bg: "#f0fdf4", c: "var(--green)", icon: "BookOpen", sub: "Total aktif" },
    { label: "Live Class Today", value: String(stats.liveClassesToday), bg: "var(--red-bg)", c: "var(--red)", icon: "Video", sub: "Sesi live" },
  ];

  return (
    <div className="anim mx-auto flex max-w-[1040px] flex-col gap-4">
      <div className="grid-4 mb-5">
        {cards.map((c) => (
          <div key={c.label} className="stat-card">
            <div className="stat-icon" style={{ background: c.bg }}>
              <AdminIcon name={c.icon} color={c.c} />
            </div>
            <div>
              <p className="stat-val">{c.value}</p>
              <p className="stat-lbl">{c.label}</p>
              <div className="mt-[1px] text-[10px] text-[var(--text-4)]">{c.sub}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="overview-grid">
        <div className="card min-w-0 overflow-hidden">
          <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            Recent Transactions
          </h3>
          <div className="tbl-wrap border-none md:border-solid">
            <table className="tbl !min-w-full md:!min-w-[520px]">
              <thead>
                <tr>
                  <th className="hidden md:table-cell">Order</th>
                  <th>Buyer</th>
                  <th className="hidden sm:table-cell">Method</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {orders.map((o) => (
                  <tr key={o.id}>
                    <td className="hidden md:table-cell" style={{ fontWeight: 700, fontSize: 12, color: "var(--brand)" }}>{o.orderNumber}</td>
                    <td style={{ fontSize: 13 }}>{o.buyerName}</td>
                    <td className="hidden sm:table-cell" style={{ fontSize: 12, color: "var(--text-3)" }}>{o.methodName ?? "Unknown"}</td>
                    <td style={{ fontWeight: 700, fontSize: 13 }}>{formatIdr(o.totalAmount)}</td>
                    <td>
                      <span className={`badge ${badgeClass(o.status)}`}>{o.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        <div className="card">
          <h3 style={{ fontFamily: "var(--font-heading)", fontWeight: 700, fontSize: 15, marginBottom: 14 }}>
            Webhook Status
          </h3>
          {webhooks.slice(0, 10).map((w, i) => {
            const isOk = w.processingStatus === "processed" || w.processingStatus === "received";
            return (
              <div
                key={w.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 0",
                  borderBottom: i < webhooks.length - 1 ? "1px solid var(--border)" : "none",
                }}
              >
                <div
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: "50%",
                    background: isOk ? "#22c55e" : "var(--red)",
                    flexShrink: 0,
                  }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {w.provider} &middot; {w.eventType ?? "Unknown"}
                  </p>
                  <p style={{ fontSize: 10, color: "var(--text-4)" }}>
                    {formatDistanceToNow(new Date(w.receivedAt), { addSuffix: true })}
                  </p>
                </div>
                <span
                  className={`badge ${
                    w.processingStatus === "processed" ? "badge-success" : "badge-primary"
                  }`}
                  style={{ fontSize: 10 }}
                >
                  {w.processingStatus}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
