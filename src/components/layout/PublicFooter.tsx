import { LandingIcon } from "@/components/landing/LandingIcon";

export function PublicFooter() {
  return (
    <footer className="px-5 py-8 print:hidden" style={{ background: "var(--sidebar)" }}>
      <div className="mx-auto mb-4 flex max-w-[1200px] flex-wrap items-center justify-between gap-4 border-b border-white/[.07] pb-5">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-[var(--r)] bg-[var(--brand)]">
            <LandingIcon name="MessageCircle" color="#fff" />
          </span>
          <span className="font-[family-name:var(--font-heading)] text-base font-extrabold text-white">
            Fluency<span className="text-[var(--brand-500)]">Hub</span>
          </span>
        </div>
        <p className="text-xs text-[var(--text-4)]">© {new Date().getFullYear()} FluencyHub Indonesia. All rights reserved.</p>
      </div>
    </footer>
  );
}
