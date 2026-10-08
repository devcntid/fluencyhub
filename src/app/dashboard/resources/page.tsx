import { Suspense } from "react";
import { auth } from "@/lib/session";
import { listUserResources } from "@/lib/db/resources.queries";
import { redirect } from "next/navigation";
import { ResourceList } from "./ResourceList";

export default async function ResourcesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const userId = Number(session.user.id);
  const resources = await listUserResources(userId);

  return (
    <main className="w-full px-4 py-8">
      <div className="mb-8 border-b border-zinc-200 pb-4">
        <h1 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-extrabold text-zinc-900 md:text-2xl">
          Resource Library
        </h1>
        <p className="text-xs text-zinc-500 md:text-sm">
          Unduh PDF, silabus, dan template penting dari semua kelas Anda.
        </p>
      </div>

      <Suspense fallback={<div>Loading resources...</div>}>
        <ResourceList resources={resources} />
      </Suspense>
    </main>
  );
}
