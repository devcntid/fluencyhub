/* eslint-disable @next/next/no-img-element */
/* eslint-disable jsx-a11y/alt-text */
"use client";

import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PaymentMethodLogo } from "@/components/checkout/PaymentMethodLogo";
import { SnapModal } from "@/components/checkout/SnapModal";
import { VAInstructions } from "@/components/checkout/VAInstructions";
import type { Course, PaymentInstruction, PaymentMethod } from "@/types/db";
import { formatIdr } from "@/lib/utils/cn";

type Props = {
  course: Course;
  methods: PaymentMethod[];
  user: { name: string; email: string; whatsappNumber: string | null } | null;
  midtransClientKey: string;
  midtransSnapScriptUrl: string;
  initialOrder?: {
    id: number;
    orderNumber: string;
    paymentMethodId: number | null;
    couponCode: string | null;
    discountAmount: string | number | null;
    vaNumber?: string | null;
    gatewayPaymentUrl?: string | null;
    expiresAt?: Date | string | null;
    createdAt?: Date | string | null;
    status?: string | null;
  } | null;
  initialStep?: number;
};

const STEPS = ["Kelas", "Data Diri", "Bayar", "Konfirmasi"];
const MAX_PROOF_SIZE = 5 * 1024 * 1024; // 5 MB
const FILE_TOO_LARGE_MSG = "Ukuran file yang diunggah tidak boleh melebihi 5 MB.";

export function CheckoutStepper({
  course,
  methods,
  user,
  midtransClientKey,
  midtransSnapScriptUrl,
  initialOrder,
  initialStep,
}: Props) {
  const router = useRouter();
  const hasPaymentDetails = Boolean(
    initialOrder?.vaNumber ||
    initialOrder?.gatewayPaymentUrl ||
    initialOrder?.status === "pending_verification"
  );

  const [step, setStep] = useState(
    initialStep ??
      (initialOrder
        ? hasPaymentDetails
          ? 6
          : 4
        : 1)
  );
  const [methodId, setMethodId] = useState<number | null>(initialOrder?.paymentMethodId ?? null);
  const [name, setName] = useState(user?.name ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [wa, setWa] = useState(user?.whatsappNumber ?? "");
  const [coupon, setCoupon] = useState(initialOrder?.couponCode ?? "");
  const [discount, setDiscount] = useState(initialOrder ? Number(initialOrder.discountAmount) : 0);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [orderNumber, setOrderNumber] = useState<string | null>(initialOrder?.orderNumber ?? null);
  const [orderId, setOrderId] = useState<number | null>(initialOrder?.id ?? null);
  const [file, setFile] = useState<File | null>(null);
  const [snapToken, setSnapToken] = useState<string | null>(null);
  const [vaNumber, setVaNumber] = useState<string | null>(initialOrder?.vaNumber ?? null);
  const [qrString, setQrString] = useState<string | null>(initialOrder?.gatewayPaymentUrl ?? null);
  const [qrImage, setQrImage] = useState<string | null>(() => {
    if (initialOrder?.gatewayPaymentUrl?.startsWith("data:image/")) {
      return initialOrder.gatewayPaymentUrl;
    }
    return null;
  });
  const [paymentUrl, setPaymentUrl] = useState<string | null>(initialOrder?.gatewayPaymentUrl ?? null);
  const [expiresAt, setExpiresAt] = useState<Date | string | null>(initialOrder?.expiresAt ?? null);
  const [createdAt] = useState<Date | string | null>(initialOrder?.createdAt ?? null);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);
  const [isOrderExpired, setIsOrderExpired] = useState(() => {
    if (initialOrder?.expiresAt) {
      return new Date(initialOrder.expiresAt).getTime() <= Date.now();
    }
    return false;
  });

  const method = methods.find((m) => m.id === methodId) ?? null;
  const base = Number(course.price);
  const total = Math.max(0, base - discount);

  const handleReorder = useCallback(() => {
    if (orderNumber && typeof window !== "undefined") {
      localStorage.removeItem(`fluencyhub_expiry_${orderNumber}`);
    }
    setOrderNumber(null);
    setOrderId(null);
    setVaNumber(null);
    setQrImage(null);
    setQrString(null);
    setPaymentUrl(null);
    setExpiresAt(null);
    setIsOrderExpired(false);
    router.replace(`/checkout?courseId=${course.id}`);
    setStep(methodId ? 4 : 3);
  }, [orderNumber, course.id, methodId, router]);

  // Scroll to top whenever step changes so content isn't scrolled past the sticky header
  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [step]);

  useEffect(() => {
    if (!methodId) {
      return;
    }
    let cancelled = false;
    fetch(`/api/payment-methods/${methodId}`)
      .then((res) => res.json())
      .then((json) => {
        if (!cancelled) setInstructions(json.data?.instructions ?? []);
      })
      .catch(() => {
        if (!cancelled) setInstructions([]);
      });
    return () => {
      cancelled = true;
    };
  }, [methodId]);

  const grouped = useMemo(() => {
    const groups: Record<string, PaymentMethod[]> = {};
    for (const m of methods) {
      if (m.provider === 'xendit') continue; // Hide Xendit for now
      groups[m.provider] = groups[m.provider] ?? [];
      groups[m.provider].push(m);
    }
    return groups;
  }, [methods]);

  useEffect(() => {
    if (step !== 6 || !orderId || isOrderExpired || (method?.type === 'manual_transfer' || method?.provider === 'manual')) {
      return;
    }
    
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/${orderId}/status`);
        if (!res.ok) return;
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.indexOf("application/json") !== -1) {
          const json = await res.json();
          if (json.data?.status === "paid") {
            const num = orderNumber || json.data?.order?.orderNumber;
            window.location.href = num
              ? `/checkout/success?orderNumber=${encodeURIComponent(num)}`
              : `/dashboard`;
          }
        }
      } catch {
        // Ignore network errors during polling
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [step, orderId, method, orderNumber, isOrderExpired, router]);

  async function applyCoupon() {
    setError("");
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code: coupon, courseId: course.id, amount: base }),
    });
    const json = await res.json();
    if (!res.ok) {
      setError(json.error ?? "Invalid coupon");
      setDiscount(0);
      return;
    }
    setDiscount(Number(json.data.discountAmount));
  }

  async function pay() {
    if (!method) {
      setError("Pilih metode pembayaran");
      return;
    }
    if ((method.type === 'manual_transfer' || method.provider === 'manual') && !file) {
      setError("Pilih foto bukti transfer terlebih dahulu sebelum membayar");
      return;
    }
    if ((method.type === 'manual_transfer' || method.provider === 'manual') && file && file.size > MAX_PROOF_SIZE) {
      alert(FILE_TOO_LARGE_MSG);
      setError(FILE_TOO_LARGE_MSG);
      return;
    }
    
    setBusy(true);
    setError("");
    setQrImage(null);
    setQrString(null);
    setVaNumber(null);
    setSnapToken(null);
    try {
      if (wa) {
        await fetch("/api/users/me", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ whatsappNumber: wa, name }),
        });
      }
      const create = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          courseId: course.id,
          paymentMethodId: method.id,
          couponCode: coupon || undefined,
        }),
      });
      const createRaw = await create.text();
      let created: any = {};
      try {
        created = createRaw ? JSON.parse(createRaw) : {};
      } catch {
        throw new Error("Gagal membuat pesanan (respons server tidak valid).");
      }
      if (!create.ok) throw new Error(created.error ?? "Gagal membuat pesanan");
      const id = created.data?.id as number;
      if (!id) throw new Error("ID pesanan tidak valid.");
      setOrderId(id);
      setOrderNumber(created.data.orderNumber);

      const payRes = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      const payRaw = await payRes.text();
      let paid: any = {};
      try {
        paid = payRaw ? JSON.parse(payRaw) : {};
      } catch {
        throw new Error("Gagal memproses pembayaran (respons server tidak valid).");
      }
      if (!payRes.ok) throw new Error(paid.error ?? "Gagal memproses pembayaran");

      if (paid.data?.expiresAt || paid.data?.order?.expiresAt) {
        setExpiresAt(paid.data.expiresAt || paid.data.order.expiresAt);
      }

      const path = paid.data?.path as string | undefined;
      if (path === "manual" || method.type === "manual_transfer") {
        // Lakukan upload file
        const form = new FormData();
        form.set("file", file!);
        form.set("folder", "proofs");
        const up = await fetch("/api/upload", { method: "POST", body: form });
        if (up.status === 413) throw new Error(FILE_TOO_LARGE_MSG);
        const upContentType = up.headers.get("content-type") ?? "";
        if (!upContentType.includes("application/json")) {
          console.error("API /upload non-JSON response:", await up.text());
          throw new Error("Upload bukti transfer gagal. Silakan coba lagi.");
        }
        const uploaded = await up.json();
        if (!up.ok) throw new Error(uploaded.error ?? "Upload gagal");
  
        const proof = await fetch("/api/payment-proofs", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: id,
            fileUrl: uploaded.data.url,
            fileSizeBytes: file!.size,
            mimeType: file!.type,
            fileName: file!.name,
          }),
        });
        const proved = await proof.json();
        if (!proof.ok) throw new Error(proved.error ?? "Gagal menyimpan bukti transfer");
        router.push(`/checkout/success?orderNumber=${created.data.orderNumber}`);
        return;
      }
      if (path === "snap" && paid.data?.snapToken) {
        setSnapToken(paid.data.snapToken as string);
        return;
      }
      if (path === "va") {
        setVaNumber((paid.data?.vaNumber as string) ?? null);
        setPaymentUrl(null);
        setStep(6);
        return;
      }
      if (path === "retail") {
        setVaNumber((paid.data?.vaNumber as string) ?? (paid.data?.paymentCode as string) ?? null);
        setPaymentUrl(null);
        setStep(6);
        return;
      }
      if (path === "qris") {
        setQrString((paid.data?.qrString as string) ?? null);
        setQrImage((paid.data?.qrImage as string) ?? null);
        setVaNumber((paid.data?.vaNumber as string) ?? (paid.data?.order?.vaNumber as string) ?? null);
        setPaymentUrl(null);
        setStep(6);
        return;
      }
      if (path === "redirect" && paid.data?.checkoutUrl) {
        const checkoutUrl = paid.data.checkoutUrl as string;
        setPaymentUrl(checkoutUrl);
        setVaNumber((paid.data?.vaNumber as string) ?? (paid.data?.order?.vaNumber as string) ?? null);
        setStep(6);
        if (method?.type === "e_wallet") {
          window.open(checkoutUrl, "_blank");
        }
        return;
      }
      router.push(`/checkout/success?orderNumber=${created.data.orderNumber}`);
    } catch (e) {
      const raw = e instanceof Error ? e.message : "Terjadi kendala saat memproses pesanan.";
      let friendly = raw;
      if (
        raw.toLowerCase().includes("credential") ||
        raw.toLowerCase().includes("configured") ||
        raw.includes("FASPAY") ||
        raw.includes("MIDTRANS") ||
        raw.includes("XENDIT") ||
        raw.toLowerCase().includes("unauthorized")
      ) {
        friendly = "Metode pembayaran ini sedang dalam pemeliharaan sistem. Silakan pilih metode pembayaran lain atau hubungi admin.";
      }
      setError(friendly);
    } finally {
      setBusy(false);
    }
  }

  const onSnapDone = useCallback(
    (kind: "success" | "pending" | "error" | "close") => {
      if (kind === "error") {
        setError("Snap payment failed. Try again.");
        setSnapToken(null);
        return;
      }
      if (kind === "close") {
        setSnapToken(null);
        return;
      }
      if (orderNumber) {
        router.push(`/checkout/success?orderNumber=${orderNumber}`);
      }
    },
    [orderNumber, router],
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-10">
      <div className="fixed top-[62px] left-0 right-0 z-40 border-b border-zinc-200/90 bg-white shadow-xs">
        <div className="mx-auto flex max-w-[860px] items-center justify-between gap-2 sm:gap-4 px-3 sm:px-4 py-2.5 sm:py-3">
          {/* Back button */}
          <div className="w-8 sm:w-24 shrink-0 flex items-center">
            {step > 1 && step < 5 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 w-8 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs transition-colors"
                title="Kembali ke langkah sebelumnya"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="hidden sm:inline">Kembali</span>
              </button>
            ) : step >= 5 ? (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 w-8 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs transition-colors"
                title="Ubah metode pembayaran"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="hidden sm:inline">Kembali</span>
              </button>
            ) : (
              <Link
                href="/#harga"
                className="inline-flex items-center justify-center gap-1.5 h-8 sm:h-9 w-8 sm:w-auto sm:px-3 rounded-lg sm:rounded-xl border border-zinc-200/90 bg-white hover:bg-zinc-50 text-xs font-semibold text-zinc-700 shadow-xs transition-colors"
                title="Kembali ke daftar kelas"
              >
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6"/>
                </svg>
                <span className="hidden sm:inline">Kembali</span>
              </Link>
            )}
          </div>

          {/* Stepper Progress */}
          <div className="flex flex-1 items-center justify-center gap-1 sm:gap-2">
            {STEPS.map((s, i) => {
              const isDone = (step >= 5 && i < 3) || (step < 5 && step > i + 1);
              const isCurrent = (step >= 5 && i === 3) || step === i + 1;
              return (
                <div key={s} className="flex items-center gap-1 sm:gap-2">
                  <button
                    type="button"
                    disabled={!isDone}
                    onClick={() => {
                      if (step >= 5 && i < 3) {
                        setStep(i + 1);
                      } else if (isDone) {
                        setStep(i + 1);
                      }
                    }}
                    className={`flex items-center gap-1.5 focus:outline-none ${isDone ? "cursor-pointer" : "cursor-default"}`}
                  >
                    <div
                      className={`flex h-6 w-6 sm:h-7 sm:w-7 shrink-0 items-center justify-center rounded-full text-[10px] sm:text-xs font-bold transition-all ${
                        isDone
                          ? "bg-[var(--brand)] text-white shadow-xs"
                          : isCurrent
                          ? "bg-[var(--brand)] text-white shadow-xs ring-4 ring-[var(--brand)]/20"
                          : "bg-zinc-100 text-zinc-400 border border-zinc-200"
                      }`}
                    >
                      {isDone ? (
                        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </div>
                    <span
                      className={`hidden sm:inline text-xs font-semibold font-body transition-colors ${
                        isCurrent
                          ? "text-zinc-900 font-bold"
                          : isDone
                          ? "text-zinc-600"
                          : "text-zinc-400"
                      }`}
                    >
                      {s}
                    </span>
                  </button>
                  {i < 3 && (
                    <div
                      className={`h-[2px] w-3.5 sm:w-6 md:w-8 shrink-0 rounded-full transition-colors ${
                        step >= 5 || step > i + 1 ? "bg-[var(--brand)]" : "bg-zinc-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>

          {/* Right counter balancing slot */}
          <div className="w-8 sm:w-24 shrink-0 flex items-center justify-end">
            <span className="sm:hidden font-mono text-[11px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-md">
              {Math.min(step, 4)}/4
            </span>
          </div>
        </div>
      </div>

      <div className="mx-auto grid w-full max-w-[860px] min-w-0 gap-4 px-3 sm:px-4 pt-[68px] sm:pt-[76px] pb-6 md:grid-cols-[1fr_280px]">
        <div className="min-w-0 w-full">
          {error ? (
            <div className="mb-4 flex items-start justify-between gap-3 rounded-xl border border-rose-200 bg-rose-50/95 p-4 shadow-sm text-rose-900 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-start gap-3 min-w-0">
                <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </div>
                <div className="min-w-0">
                  <p className="text-[14px] font-bold text-rose-900">Pembayaran Belum Dapat Diproses</p>
                  <p className="mt-0.5 text-[13px] text-rose-700 leading-relaxed">{error}</p>
                  {step === 4 && (
                    <button
                      type="button"
                      onClick={() => {
                        setError("");
                        setStep(3);
                      }}
                      className="mt-2.5 inline-flex items-center gap-1.5 rounded-lg bg-rose-600 px-3 py-1.5 text-[12px] font-semibold text-white shadow-xs hover:bg-rose-700 transition-colors"
                    >
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="m15 18-6-6 6-6"/>
                      </svg>
                      Ganti Metode Pembayaran
                    </button>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setError("")}
                className="shrink-0 rounded-md p-1 text-rose-400 hover:bg-rose-100 hover:text-rose-600 transition-colors"
                title="Tutup pemberitahuan"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
              </button>
            </div>
          ) : null}

          {step === 1 && (
            <div className="card anim !p-4 sm:!p-6">
              <h2 className="mb-4 text-[18px] sm:text-[20px] font-extrabold font-heading text-[var(--text)]">Konfirmasi Kelas</h2>
              <div className="mb-5 flex gap-3 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface-2)] p-3.5">
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} className="h-14 w-[84px] shrink-0 rounded-[var(--r)] object-cover" />
                ) : (
                  <div className="h-14 w-[84px] shrink-0 rounded-[var(--r)] bg-zinc-200" />
                )}
                <div>
                  <p className="mb-1 text-[13px] font-bold font-heading">{course.title}</p>
                  <div className="flex flex-wrap gap-1.5">
                    <span className="badge badge-primary"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="23 7 16 12 23 17 23 7"/><rect width="15" height="14" x="1" y="5" rx="2" ry="2"/></svg> Live Class</span>
                    <span className="badge badge-success"><svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 12c-2-2.67-4-4-6-4a4 4 0 1 0 0 8c2 0 4-1.33 6-4Zm0 0c2 2.67 4 4 6 4a4 4 0 1 0 0-8c-2 0-4 1.33-6 4Z"/></svg> Seumur Hidup</span>
                  </div>
                </div>
              </div>
              <label className="label">Kode Kupon (opsional)</label>
              <div className="mb-5 flex gap-2">
                <input className="input flex-1" value={coupon} onChange={(e) => setCoupon(e.target.value)} placeholder="STEMFLUENT atau WELCOME2026" />
                <button type="button" className="btn btn-secondary btn-default" onClick={applyCoupon}>
                  Apply
                </button>
              </div>
              <button type="button" className="btn btn-primary btn-full btn-default mt-1" onClick={() => setStep(2)}>
                Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {step === 2 && (
            <div className="card anim !p-4 sm:!p-6">
              <h2 className="mb-1.5 text-[18px] sm:text-[20px] font-extrabold font-heading text-[var(--text)]">Data Diri</h2>
              <p className="mb-4 text-[13px] text-[var(--text-3)]">Isi manual atau login dengan Google untuk auto-fill.</p>
              
              <button
                type="button"
                className="mb-4 flex w-full items-center justify-center gap-2.5 rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] p-2.5 text-[14px] font-semibold shadow-[var(--shadow-sm)] hover:bg-[var(--surface-2)] transition-colors"
                onClick={() => signIn("google", { callbackUrl: `/checkout?courseId=${course.id}` })}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Lanjutkan dengan Google
              </button>

              <div className="mb-4 flex items-center gap-3 text-[12px] text-[var(--text-4)]">
                <div className="h-px flex-1 bg-[var(--border)]" /> atau isi manual <div className="h-px flex-1 bg-[var(--border)]" />
              </div>

              <div className="mb-3.5">
                <label className="label">Nama Lengkap</label>
                <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Budi Santoso" />
              </div>
              <div className="mb-3.5">
                <label className="label">Email</label>
                <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="budi@gmail.com" />
              </div>
              <div className="mb-3.5">
                <label className="label">Nomor WhatsApp</label>
                <input className="input" type="tel" value={wa} onChange={(e) => setWa(e.target.value)} placeholder="0812xxxx" />
              </div>
              
              <button
                type="button"
                className="btn btn-primary btn-full btn-default mt-1"
                onClick={() => {
                  if (!name || !email || !wa) {
                    setError("Semua field wajib diisi");
                    return;
                  }
                  if (!user) {
                    signIn("google", { callbackUrl: `/checkout?courseId=${course.id}` });
                    return;
                  }
                  setError("");
                  setStep(3);
                }}
              >
                Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {step === 3 && (
            <div className="card anim !p-4 sm:!p-6">
              <h2 className="mb-1 text-[18px] sm:text-[20px] font-extrabold font-heading text-[var(--text)]">Pilih Metode Pembayaran</h2>
              <p className="mb-5 text-[13px] text-[var(--text-3)]">Semua transaksi diproses secara aman dan terenkripsi.</p>
              
              {Object.entries(grouped).map(([provider, list]) => (
                <div key={provider} className="mb-4.5">
                  <div className="mb-2.5 flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-700">
                      {provider === 'midtrans'
                        ? 'Midtrans Payment Gateway'
                        : provider === 'faspay'
                        ? 'Faspay Payment Gateway'
                        : provider === 'xendit'
                        ? 'Xendit Payment Gateway'
                        : 'Transfer Manual Bank'}
                    </span>
                    <span className="inline-flex items-center rounded-md px-2 py-0.5 text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      {provider === 'manual' ? 'Verifikasi Admin' : 'Otomatis'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    {list.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-3 rounded-xl border-[1.5px] px-3.5 py-3 transition-all hover:bg-zinc-50/70"
                        style={{
                          borderColor: methodId === m.id ? "var(--brand)" : "var(--border)",
                          background: methodId === m.id ? "var(--brand-50)" : "var(--surface)",
                        }}
                      >
                        <input
                          type="radio"
                          name="pm"
                          checked={methodId === m.id}
                          onChange={() => setMethodId(m.id)}
                          className="h-4 w-4 shrink-0 accent-[var(--brand)]"
                        />
                        <PaymentMethodLogo src={m.logoUrl} name={m.name} code={m.code} />
                        <span className="flex-1 text-[14px] font-semibold" style={{ color: methodId === m.id ? 'var(--brand)' : 'var(--text)' }}>
                          {m.name}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              <button type="button" className="btn btn-primary btn-full btn-default mt-2" onClick={() => { if(!methodId) { setError("Pilih metode pembayaran"); return; } setError(""); setStep(4); }}>
                Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="card anim !p-4 sm:!p-6">
              <h2 className="mb-4 text-[18px] sm:text-[20px] font-extrabold font-heading text-[var(--text)]">Review & Bayar</h2>
              
              <div className="mb-4 rounded-[var(--r-md)] border border-[var(--border)] bg-[var(--surface-2)] p-4">
                <div className="mb-1.5 flex justify-between text-[14px]">
                  <span className="text-[var(--text-3)]">Harga kelas</span>
                  <span className="font-semibold">{formatIdr(base)}</span>
                </div>
                {discount > 0 && (
                  <div className="mb-1.5 flex justify-between text-[14px] text-[var(--green)]">
                    <span>Diskon kupon</span>
                    <span>-{formatIdr(discount)}</span>
                  </div>
                )}
                <div className="my-2.5 h-px bg-[var(--border)]" />
                <div className="flex justify-between font-heading text-[18px] font-extrabold">
                  <span>Total</span>
                  <span className="text-[var(--brand)]">{formatIdr(total)}</span>
                </div>
              </div>

              <div className="mb-4 flex items-center justify-between rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3">
                <div className="flex items-center gap-3">
                  {method ? <PaymentMethodLogo src={method.logoUrl} name={method.name} code={method.code} /> : null}
                  <div className="flex flex-col">
                    <span className="text-[14px] font-semibold text-[var(--text)]">{method?.name || '—'}</span>
                    <span className="text-[11px] font-bold text-[var(--text-4)] uppercase tracking-wider">{method?.provider || '—'}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="btn btn-secondary btn-sm text-[12px]"
                >
                  Ubah
                </button>
              </div>

              {(method?.type === 'manual_transfer' || method?.provider === 'manual') && (
                <div className="mb-4 rounded-[var(--r-lg)] border border-[var(--border)] p-5 text-left bg-[var(--surface-2)]">
                  <div className="mb-4">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-4)] mb-1">
                      {method?.name} (TRANSFER MANUAL)
                    </p>
                    <p className="font-semibold text-[15px]">{method?.accountName || "PT FluencyHub Edukasi"}</p>
                  </div>
                  
                  <div className="rounded-md bg-[var(--surface)] p-4 text-center mb-5 border border-[var(--border)]">
                    <p className="font-mono text-[24px] font-bold tracking-[0.2em] text-[var(--text)]">
                      {method?.accountNumber || "-"}
                    </p>
                  </div>
                  
                  <div className="flex gap-3 mb-6">
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(method?.accountNumber || "");
                        alert("Nomor rekening berhasil disalin!");
                      }}
                      className="btn btn-outline btn-full text-[13px] bg-[var(--bg)]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      Salin Rekening
                    </button>
                    <button 
                      onClick={() => {
                        navigator.clipboard.writeText(total.toString());
                        alert("Nominal berhasil disalin!");
                      }}
                      className="btn btn-outline btn-full text-[13px] bg-[var(--bg)]"
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mr-2"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                      Salin Nominal
                    </button>
                  </div>
                  
                  <div className="h-px bg-[var(--border)] mb-5" />
                  
                  <div className="mb-2">
                    <h3 className="font-bold text-[14px] mb-1">Bukti Transfer</h3>
                    <p className="text-[12px] text-[var(--text-3)] mb-3">Silakan unggah foto/PDF bukti transfer di bawah ini:</p>
                    
                    <div className="rounded-[var(--r-md)] border-2 border-dashed border-[var(--border-2)] bg-[var(--surface)] px-4 py-6 text-center transition-colors hover:border-[var(--brand)] hover:bg-[var(--brand-50)] cursor-pointer relative">
                      <input
                        type="file"
                        accept="image/jpeg,image/png,application/pdf"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        onChange={(e) => {
                          const selected = e.target.files?.[0] ?? null;
                          if (selected && selected.size > MAX_PROOF_SIZE) {
                            alert(FILE_TOO_LARGE_MSG);
                            setError(FILE_TOO_LARGE_MSG);
                            setFile(null);
                            e.target.value = "";
                            return;
                          }
                          setError("");
                          setFile(selected);
                        }}
                      />
                      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mx-auto mb-2.5 text-[var(--text-4)]"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                      {file ? (
                        <p className="mb-1 text-[13px] font-semibold text-[var(--brand)]">{file.name}</p>
                      ) : (
                        <>
                          <p className="mb-1 text-[13px] font-semibold text-[var(--text-2)]">Pilih foto/PDF bukti bayar</p>
                          <p className="text-[11px] text-[var(--text-4)]">Maks 5MB</p>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <button type="button" className="btn btn-primary btn-full btn-lg" disabled={busy} onClick={pay}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="11" x="3" y="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                <span className="ml-2">{busy ? "Memproses..." : (method?.type === "manual_transfer" || method?.provider === "manual" ? "Kirim Bukti Transfer" : "Bayar Sekarang")}</span>
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[var(--text-4)]">Diproses oleh Midtrans & Xendit. SSL terenkripsi.</p>
            </div>
          )}

          {step === 6 && (
            <VAInstructions
              vaNumber={vaNumber}
              qrImage={qrImage}
              paymentUrl={method?.type === "e_wallet" ? paymentUrl : null}
              instructions={instructions}
              orderNumber={orderNumber}
              orderStatus={initialOrder?.status}
              methodName={method?.name}
              methodCode={method?.code}
              methodType={method?.type}
              logoUrl={method?.logoUrl}
              merchantName="FluencyHub"
              totalAmount={total}
              expiresAt={expiresAt}
              createdAt={createdAt}
              onReorder={handleReorder}
              onExpireChange={setIsOrderExpired}
              title={
                qrImage || qrString || method?.type === "qr_code"
                  ? "Pembayaran QRIS"
                  : method?.type === "retail_outlet"
                    ? `Pembayaran ${method.name}`
                    : method?.type === "e_wallet"
                      ? `Pembayaran ${method.name}`
                      : "Transfer Virtual Account"
              }
            />
          )}

          {step === 6 && orderNumber && (
            <div className={`card anim text-center py-5 px-4 sm:px-5 mt-4 ${isOrderExpired ? "border-rose-200 bg-rose-50/50" : ""}`}>
              {isOrderExpired ? (
                <>
                  <div className="h-10 w-10 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-2.5">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="15" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="9" x2="15" y2="15" />
                    </svg>
                  </div>
                  <h2 className="mb-1 text-base sm:text-lg font-extrabold font-heading text-rose-700">Pesanan Kedaluwarsa</h2>
                  <p className="mb-4 text-xs sm:text-sm leading-relaxed text-zinc-600 max-w-md mx-auto">
                    Batas waktu pembayaran untuk transaksi ini telah habis. Silakan buat pesanan ulang untuk mendapatkan kode pembayaran yang baru.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
                    <button
                      type="button"
                      onClick={handleReorder}
                      className="rounded-xl bg-black hover:bg-zinc-800 text-white flex-1 font-bold text-xs sm:text-sm py-2.5 inline-flex items-center justify-center gap-2 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8"/>
                        <path d="M21 3v5h-5"/>
                        <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16"/>
                        <path d="M3 21v-5h5"/>
                      </svg>
                      <span>Pesan Ulang Kelas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        handleReorder();
                        setStep(3);
                      }}
                      className="rounded-xl border border-zinc-300 bg-white text-zinc-800 hover:bg-zinc-100 text-xs sm:text-sm py-2.5 px-4 font-semibold shadow-2xs transition cursor-pointer"
                    >
                      Pilih Metode Lain
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <h2 className="mb-1 text-base sm:text-lg font-extrabold font-heading text-[var(--brand)]">Menunggu Pembayaran</h2>
                  <p className="mb-4 text-xs sm:text-sm leading-relaxed text-[var(--text-3)] max-w-md mx-auto">
                    Setelah melakukan transfer atau scan QRIS, klik tombol di bawah untuk memeriksa status verifikasi akun Anda.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2.5">
                    <a
                      href={`/checkout/success?orderNumber=${orderNumber}`}
                      className="rounded-xl bg-black hover:bg-zinc-800 text-white dark:bg-white dark:hover:bg-zinc-100 dark:text-black border border-black dark:border-white flex-1 font-bold text-xs sm:text-sm py-2.5 inline-flex items-center justify-center gap-1.5 shadow-sm transition active:scale-95 cursor-pointer"
                    >
                      <span>Cek Status Pembayaran</span>
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 12h14"/><path d="m12 5 7 7-7 7"/>
                      </svg>
                    </a>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-700 text-xs sm:text-sm py-2.5 px-4 font-semibold shadow-2xs transition cursor-pointer"
                    >
                      Ubah Metode
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        <aside className="h-fit min-w-0 w-full lg:sticky lg:top-[135px]">
          <div className="card">
            <p className="mb-3.5 font-heading text-[14px] font-bold text-[var(--text)]">Ringkasan Order</p>
            {course.thumbnailUrl ? (
              <img src={course.thumbnailUrl} className="mb-3 h-[110px] w-full rounded-[var(--r-md)] object-cover" />
            ) : (
              <div className="mb-3 h-[110px] w-full rounded-[var(--r-md)] bg-zinc-200" />
            )}
            <p className="mb-1 font-heading text-[13px] font-bold leading-tight">{course.title}</p>
            <p className="mb-3.5 text-[11px] text-[var(--text-4)]">Akses Seumur Hidup · Sertifikat</p>
            
            <div className="flex flex-col gap-1.5 border-t border-[var(--border)] pt-3">
              <div className="flex justify-between text-[13px]">
                <span className="text-[var(--text-3)]">Harga</span>
                <span className="font-semibold">{formatIdr(base)}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-[13px] text-[var(--green)]">
                  <span>Diskon Kupon</span>
                  <span>-{formatIdr(discount)}</span>
                </div>
              )}
              <div className="mt-1 flex justify-between border-t border-[var(--border)] pt-2.5 font-heading text-[16px] font-extrabold">
                <span>Total</span>
                <span className="text-[var(--brand)]">{formatIdr(total)}</span>
              </div>
            </div>

            <div className="mt-3.5 rounded-[var(--r)] border border-[var(--green-border)] bg-[var(--green-bg)] px-3 py-2.5">
              {['✓ Email & WhatsApp', '✓ Live Class Zoom/GMeet', '✓ Certificate of Completion'].map(t => (
                <p key={t} className="mb-0.5 text-[11px] font-semibold text-[var(--green)]">{t}</p>
              ))}
            </div>
          </div>
        </aside>
      </div>

      {busy && (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm px-4 text-white">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 mb-4 animate-pulse">
            <svg className="animate-spin h-8 w-8 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
          <h3 className="font-heading text-lg font-bold">Memproses Pembayaran...</h3>
          <p className="mt-1 text-sm text-white/70 text-center">Mohon tunggu sebentar, jangan tutup atau refresh halaman ini</p>
        </div>
      )}

      {snapToken ? (
        <SnapModal
          token={snapToken}
          clientKey={midtransClientKey}
          scriptUrl={midtransSnapScriptUrl}
          onDone={onSnapDone}
        />
      ) : null}
    </div>
  );
}
