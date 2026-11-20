import { auth } from "@/lib/session";
import { ReadyCheckFlow } from "@/components/ready-check/ReadyCheckFlow";

export const dynamic = "force-dynamic";

export default async function ReadyCheckPage({
  searchParams,
}: {
  searchParams: Promise<{ started?: string; save?: string }>;
}) {
  const [session, params] = await Promise.all([auth(), searchParams]);

  return (
    <ReadyCheckFlow
      userName={session?.user?.name ?? null}
      isLoggedIn={Boolean(session?.user?.id)}
      startDirectly={params.started === "1"}
      autoSaveOnMount={params.save === "1"}
    />
  );
}

