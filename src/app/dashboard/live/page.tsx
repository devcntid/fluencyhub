import { Suspense } from "react";

import { auth } from "@/lib/session";
import { listUpcomingLiveClasses } from "@/lib/db/lessons.queries";
import { LiveClassList } from "./LiveClassList";

export default async function LivePage() {
  const session = await auth();
  if (!session?.user?.id) {
    return (
      <main className="mx-auto w-full max-w-4xl p-6 md:p-10 text-center">
        <h1 className="text-2xl font-bold">Harap login terlebih dahulu</h1>
      </main>
    );
  }

  const liveClasses = await listUpcomingLiveClasses(Number(session.user.id));
  
  return (
    <main className="mx-auto w-full max-w-4xl p-6 md:p-10">
      <div className="mb-10 mt-4 text-center md:text-left">
        <h1 className="text-3xl font-extrabold text-zinc-900 font-[family-name:var(--font-heading)]">
          Live Mentoring
        </h1>
        <p className="mt-1 text-zinc-500">Jadwal praktik mingguan via Zoom.</p>
      </div>

      <Suspense fallback={<div>Loading jadwal...</div>}>
        <LiveClassList liveClasses={liveClasses} />
      </Suspense>
    </main>
  );
}
