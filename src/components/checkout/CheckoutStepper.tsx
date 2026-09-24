"use client";

import { signIn } from "next-auth/react";
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
  initialOrder?: any;
};

const STEPS = ["Kelas", "Data Diri", "Bayar", "Konfirmasi"];

export function CheckoutStepper({
  course,
  methods,
  user,
  midtransClientKey,
  midtransSnapScriptUrl,
  initialOrder,
}: Props) {
  const [step, setStep] = useState(initialOrder ? 4 : 1);
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
  const [vaNumber, setVaNumber] = useState<string | null>(null);
  const [qrString, setQrString] = useState<string | null>(null);
  const [qrImage, setQrImage] = useState<string | null>(null);
  const [instructions, setInstructions] = useState<PaymentInstruction[]>([]);

  const method = methods.find((m) => m.id === methodId) ?? null;
  const base = Number(course.price);
  const total = Math.max(0, base - discount);

  useEffect(() => {
    if (!methodId) {
      setInstructions([]);
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
      const created = await create.json();
      if (!create.ok) throw new Error(created.error ?? "Failed to create order");
      const id = created.data.id as number;
      setOrderId(id);
      setOrderNumber(created.data.orderNumber);

      const payRes = await fetch(`/api/orders/${id}/pay`, { method: "POST" });
      const paid = await payRes.json();
      if (!payRes.ok) throw new Error(paid.error ?? "Payment failed");

      const path = paid.data?.path as string | undefined;
      if (path === "manual" || method.type === "manual_transfer") {
        // Lakukan upload file
        const form = new FormData();
        form.set("file", file!);
        form.set("folder", "proofs");
        const up = await fetch("/api/upload", { method: "POST", body: form });
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
        window.location.href = `/checkout/success?orderNumber=${created.data.orderNumber}`;
        return;
      }
      if (path === "snap" && paid.data?.snapToken) {
        setSnapToken(paid.data.snapToken as string);
        return;
      }
      if (path === "va") {
        setVaNumber((paid.data?.vaNumber as string) ?? null);
        setStep(6);
        return;
      }
      if (path === "qris") {
        setQrString((paid.data?.qrString as string) ?? null);
        setQrImage((paid.data?.qrImage as string) ?? null);
        setVaNumber(null);
        setStep(6);
        return;
      }
      if (path === "redirect" && paid.data?.checkoutUrl) {
        window.location.href = paid.data.checkoutUrl as string;
        return;
      }
      window.location.href = `/checkout/success?orderNumber=${created.data.orderNumber}`;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
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
        window.location.href = `/checkout/success?orderNumber=${orderNumber}`;
      }
    },
    [orderNumber],
  );

  return (
    <div className="min-h-screen bg-[var(--bg)] pb-10">
      <div className="sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--border)] bg-[var(--surface)] px-5 py-3 shadow-sm">
        {step > 1 && step < 5 ? (
          <button onClick={() => setStep(step - 1)} className="btn btn-secondary btn-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Kembali
          </button>
        ) : (
          <a href="/#harga" className="btn btn-secondary btn-sm flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
            Kembali
          </a>
        )}
        <div className="flex flex-1 items-center justify-center gap-2 md:gap-3">
          {STEPS.map((s, i) => (
            <div key={s} className="flex items-center gap-2 md:gap-3">
              <div className="flex items-center gap-2">
                <div
                  className="flex h-6 w-6 md:h-7 md:w-7 shrink-0 items-center justify-center rounded-full text-[10px] md:text-xs font-bold transition-colors"
                  style={{
                    background: step >= i + 1 ? "var(--brand)" : "var(--surface-2)",
                    color: step >= i + 1 ? "#fff" : "var(--text-4)",
                  }}
                >
                  {step > i + 1 ? <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg> : i + 1}
                </div>
                <span className="hidden text-xs font-semibold md:inline font-body" style={{ color: step === i + 1 ? 'var(--brand)' : 'var(--text-4)' }}>{s}</span>
              </div>
              {i < 3 && <div className="h-[2px] w-3 md:w-7 shrink-0 rounded-[1px] transition-colors" style={{ background: step > i + 1 ? 'var(--brand)' : 'var(--border)' }} />}
            </div>
          ))}
        </div>
        <div className="w-[60px] md:w-[90px]" />
      </div>

      <div className="mx-auto grid max-w-[860px] gap-4 px-4 py-6 md:grid-cols-[1fr_280px]">
        <div>
          {error ? <p className="mb-3 rounded-md bg-[#fef2f2] p-3 text-sm font-semibold text-[var(--red)] border border-[var(--red-border)]">{error}</p> : null}

          {step === 1 && (
            <div className="card anim">
              <h2 className="mb-4 text-[20px] font-extrabold font-heading text-[var(--text)]">Konfirmasi Kelas</h2>
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
            <div className="card anim">
              <h2 className="mb-1.5 text-[20px] font-extrabold font-heading text-[var(--text)]">Data Diri</h2>
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
            <div className="card anim">
              <h2 className="mb-1 text-[20px] font-extrabold font-heading text-[var(--text)]">Pilih Metode Pembayaran</h2>
              <p className="mb-5 text-[13px] text-[var(--text-3)]">Semua transaksi diproses secara aman dan terenkripsi.</p>
              
              {Object.entries(grouped).map(([provider, list]) => (
                <div key={provider} className="mb-4.5">
                  <div className="mb-2 flex items-center gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-4)]">
                      {provider === 'midtrans' ? 'Midtrans' : provider === 'xendit' ? 'Xendit' : 'Bank Transfer'}
                    </p>
                    <span className={`badge ${provider === 'midtrans' ? 'badge-primary' : provider === 'xendit' ? 'badge-success' : 'badge-warning'}`}>
                      {provider}
                    </span>
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {list.map((m) => (
                      <label
                        key={m.id}
                        className="flex cursor-pointer items-center gap-3 rounded-[var(--r)] border-[1.5px] px-3.5 py-2.5 transition-all"
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
              <button type="button" className="btn btn-primary btn-full btn-default mt-1" onClick={() => { if(!methodId) { setError("Pilih metode pembayaran"); return; } setError(""); setStep(4); }}>
                Lanjutkan <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </button>
            </div>
          )}

          {step === 4 && (
            <div className="card anim">
              <h2 className="mb-4 text-[20px] font-extrabold font-heading text-[var(--text)]">Review & Bayar</h2>
              
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

              <div className="mb-4 flex items-center gap-3 rounded-[var(--r)] border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3">
                {method ? <PaymentMethodLogo src={method.logoUrl} name={method.name} code={method.code} /> : null}
                <div className="flex flex-col">
                  <span className="text-[14px] font-semibold text-[var(--text)]">{method?.name || '—'}</span>
                  <span className="text-[11px] font-bold text-[var(--text-4)] uppercase tracking-wider">{method?.provider || '—'}</span>
                </div>
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
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
                <span className="ml-2">{busy ? "Memproses..." : "Bayar Sekarang"}</span>
              </button>
              <p className="mt-2.5 text-center text-[11px] text-[var(--text-4)]">Diproses oleh Midtrans & Xendit. SSL terenkripsi.</p>
            </div>
          )}

          {step === 6 && (vaNumber || qrImage || qrString) && (
            <VAInstructions
              vaNumber={vaNumber}
              qrImage={qrImage}
              instructions={instructions}
              orderNumber={orderNumber}
              methodName={method?.name}
              methodCode={method?.code}
              logoUrl={method?.logoUrl}
              title={qrImage || qrString ? "Scan QRIS" : "Transfer / payment code"}
            />
          )}

          {step === 6 && orderNumber && (
            <div className="card anim text-center py-6 px-5 mt-4">
              <h2 className="mb-2 text-[18px] font-extrabold font-heading text-[var(--brand)]">Menunggu Verifikasi!</h2>
              <p className="mb-5 text-[14px] leading-relaxed text-[var(--text-3)]">
                Silakan selesaikan pembayaran sesuai instruksi di atas.
              </p>
              <a
                href={`/checkout/success?orderNumber=${orderNumber}`}
                className="btn btn-primary btn-lg btn-full"
              >
                Cek Status Pembayaran <svg className="ml-2" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></svg>
              </a>
            </div>
          )}
        </div>

        <aside className="h-fit lg:sticky lg:top-[80px]">
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
