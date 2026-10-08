import { LandingIcon } from "@/components/landing/LandingIcon";

export function HeroSection({ settings }: { settings: Record<string, string> }) {
  return (
    <section className="relative overflow-hidden px-5 py-12 md:py-20" style={{ background: "linear-gradient(165deg,#f0f6ff 0%,#fff 55%)" }}>
      <div className="hero-grid relative mx-auto max-w-[1200px]">
        <div>
          <div className="mb-4">
            <span className="nav-pill">
              <span className="live-dot" />
              {settings.hero_eyebrow}
            </span>
          </div>
          <h1 className="heading-xl mb-4">
            {settings.hero_title} <span className="gradient-text">{settings.hero_title_highlight}</span>
          </h1>
          <p className="mb-7 max-w-xl text-[17px] leading-relaxed text-[var(--text-3)]">{settings.hero_subtitle}</p>
          <div className="mb-7 flex flex-wrap gap-2.5">
            <a href="#harga" className="btn btn-primary btn-lg">
              Lihat Pilihan Kelas <LandingIcon name="ArrowRight" color="#fff" />
            </a>
            <a href="#metode" className="btn btn-secondary btn-lg">
              <LandingIcon name="Play" color="var(--brand)" /> Cara Kerja
            </a>
          </div>
          <div className="flex items-center gap-2.5 text-[13px] text-[var(--text-3)]">
            <div className="flex">
              {[11, 12, 13, 14, 15].map((i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={`https://i.pravatar.cc/60?img=${i}`}
                  alt=""
                  className="avatar"
                  style={{ width: 28, height: 28, border: "2px solid #fff", marginLeft: i > 11 ? -8 : 0 }}
                />
              ))}
            </div>
            <span className="font-medium">{settings.hero_social_proof}</span>
          </div>
        </div>
        <div className="relative block mt-10 md:mt-0">
          <div className="hero-image-wrap">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={settings.hero_image_url} alt="" className="aspect-[4/3] w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
              <a href="#metode" className="flex h-16 w-16 items-center justify-center rounded-full bg-white/90 shadow-lg">
                <LandingIcon name="Play" color="var(--brand)" />
              </a>
            </div>
          </div>
          <div className="hero-float" style={{ bottom: -16, left: -16 }}>
            <div className="flex h-9 w-9 items-center justify-center rounded-[var(--r-md)] bg-[#dcfce7]">
              <LandingIcon name="TrendingUp" color="var(--green)" />
            </div>
            <div>
              <div className="text-[10px] font-semibold text-[var(--text-4)]">{settings.hero_stat_label}</div>
              <div className="font-[family-name:var(--font-heading)] text-base font-extrabold">{settings.hero_stat_value}</div>
            </div>
          </div>
          <div className="hero-float flex-col items-start gap-1.5" style={{ top: 20, right: -10 }}>
            {["Applied English STEM ✓", "Business English ✓", "Public Speaking ✓"].map((t, i) => (
              <div key={t} className="text-[11px] font-semibold" style={{ color: i === 0 ? "var(--green)" : "var(--text-3)" }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
