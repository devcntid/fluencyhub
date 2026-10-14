import { redirect } from "next/navigation";

export default async function VideosPage({
  searchParams,
}: {
  searchParams: Promise<{ c?: string }>;
}) {
  const resolvedParams = await searchParams;
  const suffix = resolvedParams.c ? `&c=${resolvedParams.c}` : "";
  redirect(`/dashboard/classroom?tab=videos${suffix}`);
}
