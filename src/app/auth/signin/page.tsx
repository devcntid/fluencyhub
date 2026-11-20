import { EnglishReadyLogo } from "@/components/brand/EnglishReadyLogo";
import Link from "next/link";
import { redirect } from "next/navigation";
import { GoogleSignInButton } from "@/components/auth/GoogleSignInButton";
import { auth } from "@/lib/session";

export default async function MemberSignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await auth();
  const params = await searchParams;
  const callbackUrl = params.callbackUrl ?? "/";

  if (session?.user) {
    redirect(callbackUrl);
  }

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4f7ff]">
      <div className="pointer-events-none absolute -top-24 -right-16 h-80 w-80 rounded-full bg-[var(--brand-100)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 rounded-full bg-[#dbeafe] blur-3xl" />

      <div className="relative mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-4 py-12 md:flex-row md:items-center md:gap-16">
        <div className="mb-10 max-w-md md:mb-0">
          <Link href="/" className="mb-8 inline-flex items-center">
            <EnglishReadyLogo height={36} />
          </Link>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.08em] text-[var(--brand)]">Member access</p>
          <h1 className="heading-lg mb-3">Masuk ke kelas dan kelanjutkan belajar.</h1>
          <p className="text-[var(--text-3)]">
            Satu akun Google untuk checkout, akses video, dan dashboard progres Anda.
          </p>
          <ul className="mt-6 space-y-2 text-sm text-[var(--text-2)]">
            <li>· Akses seumur hidup setelah pembayaran</li>
            <li>· Live class Zoom / Google Meet</li>
            <li>· Pembayaran QRIS, VA, dan e-wallet</li>
          </ul>
        </div>

        <div className="w-full max-w-md rounded-3xl border border-white bg-white/90 p-7 shadow-[0_20px_50px_rgba(26,86,219,0.08)] backdrop-blur">
          <h2 className="mb-1 font-[family-name:var(--font-heading)] text-xl font-extrabold">Log in Member</h2>
          <p className="mb-6 text-sm text-[var(--text-3)]">Gunakan akun Google yang sama saat membeli kelas.</p>
          <GoogleSignInButton callbackUrl={callbackUrl} label="Masuk dengan Google" variant="member" />
          
          <div className="mt-6 flex items-center justify-center gap-1 text-sm text-[var(--text-3)]">
            <span>Belum punya akun?</span>
            <Link href={`/auth/signup${params.callbackUrl ? `?callbackUrl=${encodeURIComponent(params.callbackUrl)}` : ""}`} className="font-semibold text-[var(--brand)] hover:underline">
              Daftar di sini
            </Link>
          </div>

          <p className="mt-5 text-center text-xs text-[var(--text-4)]">
            Dengan masuk, Anda menyetujui penggunaan akun untuk akses kursus English Ready.
          </p>
        </div>
      </div>
    </main>
  );
}
