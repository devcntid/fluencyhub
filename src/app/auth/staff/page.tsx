import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { auth } from "@/lib/session";

export default async function StaffSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;

  if (session?.user) {
    redirect("/auth/staff/complete");
  }

  return (
    <main className="min-h-screen bg-[#09090b] text-zinc-100">
      <div className="grid min-h-screen lg:grid-cols-2">
        <section className="relative hidden overflow-hidden border-r border-white/5 lg:flex lg:flex-col lg:justify-between lg:p-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(26,86,219,0.28),transparent_45%),radial-gradient(circle_at_80%_80%,rgba(5,150,105,0.18),transparent_40%)]" />
          <div className="relative">
            <div className="flex items-center gap-2">
              <EnglishReadyLogo height={30} mode="dark" />
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-zinc-400">
                Staff
              </span>
            </div>
          </div>
          <div className="relative max-w-md">
            <p className="mb-3 text-xs font-bold uppercase tracking-[0.14em] text-emerald-400">Restricted console</p>
            <h1 className="mb-4 font-[family-name:var(--font-heading)] text-4xl font-extrabold leading-tight">
              Instructor &amp; admin workspace.
            </h1>
            <p className="text-sm leading-relaxed text-zinc-400">
              Sign in only if your Google email is registered as instructor or admin. Member accounts will be denied.
            </p>
            <div className="mt-8 grid gap-3 text-sm text-zinc-300">
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">Curriculum &amp; course ops</div>
              <div className="rounded-xl border border-white/8 bg-white/5 px-4 py-3">Landing CMS &amp; payment verify</div>
            </div>
          </div>
          <p className="relative text-xs text-zinc-600">Not listed on the public website.</p>
        </section>

        <section className="flex flex-col justify-center px-5 py-16 sm:px-10">
          <div className="mx-auto w-full max-w-sm">
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.12em] text-zinc-500">Staff sign in</p>
            <h2 className="mb-2 font-[family-name:var(--font-heading)] text-2xl font-extrabold text-white">Continue securely</h2>
            <p className="mb-8 text-sm text-zinc-400">
              Use the Google account that was seeded or listed in staff emails.
            </p>
            <GoogleSignInButton
              callbackUrl={params.callbackUrl ?? "/auth/staff/complete"}
              label="Continue with Google"
              variant="staff"
            />
            <p className="mt-6 text-xs leading-relaxed text-zinc-500">
              Access is checked after Google returns. If this mailbox is not staff, you will see an access error.
            </p>
            <Link href="/" className="mt-8 inline-block text-sm text-zinc-500 underline-offset-4 hover:text-zinc-300 hover:underline">
              Back to public site
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
