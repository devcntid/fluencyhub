import { getSettingsMap } from "@/lib/db/landing.queries";
import { NotificationSettingsForm } from "@/components/admin/NotificationSettingsForm";

export default async function NotificationsPage() {
  const settings = await getSettingsMap();

  return (
    <div className="w-full max-w-5xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-[var(--text)]">Notification Configuration</h1>
          <p className="text-sm text-[var(--text-3)] mt-1">
            Manage your automated Email and WhatsApp templates, and test them out.
          </p>
        </div>
      </div>
      <NotificationSettingsForm settings={settings} />
    </div>
  );
}
