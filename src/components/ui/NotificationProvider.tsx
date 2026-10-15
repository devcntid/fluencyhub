"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";

// Types
export type ToastType = "success" | "error" | "warning" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title?: string;
  message: string;
  duration?: number;
}

export interface ConfirmOptions {
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info" | "primary";
}

interface NotificationContextValue {
  toast: {
    success: (message: string, options?: { title?: string; duration?: number }) => void;
    error: (message: string, options?: { title?: string; duration?: number }) => void;
    warning: (message: string, options?: { title?: string; duration?: number }) => void;
    info: (message: string, options?: { title?: string; duration?: number }) => void;
    dismiss: (id: string) => void;
  };
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const NotificationContext = createContext<NotificationContextValue | null>(null);

// Icons
function CheckCircleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}

function AlertTriangleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
      <line x1="12" y1="9" x2="12" y2="13" />
      <line x1="12" y1="17" x2="12.01" y2="17" />
    </svg>
  );
}

function TrashIcon({ className = "w-6 h-6" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
      <line x1="10" y1="11" x2="10" y2="17" />
      <line x1="14" y1="11" x2="14" y2="17" />
    </svg>
  );
}

function InfoIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  );
}

function CloseIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [mounted, setMounted] = useState(false);

  // Confirm dialog state
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (value: boolean) => void;
  }>({
    isOpen: false,
    options: { message: "" },
  });

  const confirmBtnRef = useRef<HTMLButtonElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, options?: { title?: string; duration?: number }) => {
      const id = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}`;
      const duration = options?.duration ?? 3500;
      const newToast: ToastItem = {
        id,
        type,
        title: options?.title,
        message,
        duration,
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const toast = useRef({
    success: (msg: string, opt?: { title?: string; duration?: number }) => addToast("success", msg, opt),
    error: (msg: string, opt?: { title?: string; duration?: number }) => addToast("error", msg, opt),
    warning: (msg: string, opt?: { title?: string; duration?: number }) => addToast("warning", msg, opt),
    info: (msg: string, opt?: { title?: string; duration?: number }) => addToast("info", msg, opt),
    dismiss: dismissToast,
  }).current;

  // Intercept window.alert so ugly native browser alerts become toasts
  useEffect(() => {
    if (typeof window === "undefined") return;
    const originalAlert = window.alert;

    window.alert = (msg?: any) => {
      const text = typeof msg === "string" ? msg : String(msg ?? "");
      const lower = text.toLowerCase();
      if (lower.includes("error") || lower.includes("gagal") || lower.includes("failed")) {
        toast.error(text);
      } else if (lower.includes("success") || lower.includes("berhasil")) {
        toast.success(text);
      } else if (lower.includes("warning") || lower.includes("perhatian") || lower.includes("harus")) {
        toast.warning(text);
      } else {
        toast.info(text);
      }
    };

    return () => {
      window.alert = originalAlert;
    };
  }, [toast]);

  // Confirm dialog promise
  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirmAction = (result: boolean) => {
    if (confirmState.resolve) {
      confirmState.resolve(result);
    }
    setConfirmState((prev) => ({ ...prev, isOpen: false }));
  };

  // Lock body scroll when confirm modal is open
  useEffect(() => {
    if (confirmState.isOpen) {
      const prev = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        confirmBtnRef.current?.focus();
      }, 50);
      return () => {
        document.body.style.overflow = prev;
      };
    }
  }, [confirmState.isOpen]);

  // Handle ESC and Enter keys in confirm modal
  useEffect(() => {
    if (!confirmState.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleConfirmAction(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [confirmState.isOpen]);

  const variant = confirmState.options.variant ?? "danger";

  return (
    <NotificationContext.Provider value={{ toast, confirm }}>
      {children}

      {/* Mount Portal for Toasts and Confirm Dialog */}
      {mounted && typeof document !== "undefined" && createPortal(
        <>
          {/* Toast Container */}
          <div
            aria-live="polite"
            className="fixed top-5 right-5 z-[999999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none px-4 sm:px-0"
          >
            {toasts.map((t) => {
              const isSuccess = t.type === "success";
              const isError = t.type === "error";
              const isWarning = t.type === "warning";

              const badgeStyle = isSuccess
                ? "bg-emerald-50 text-emerald-600 border border-emerald-200"
                : isError
                ? "bg-rose-50 text-rose-600 border border-rose-200"
                : isWarning
                ? "bg-amber-50 text-amber-600 border border-amber-200"
                : "bg-blue-50 text-blue-600 border border-blue-200";

              const borderStyle = isSuccess
                ? "border-emerald-200/80 shadow-emerald-500/10"
                : isError
                ? "border-rose-200/80 shadow-rose-500/10"
                : isWarning
                ? "border-amber-200/80 shadow-amber-500/10"
                : "border-blue-200/80 shadow-blue-500/10";

              return (
                <div
                  key={t.id}
                  className={`pointer-events-auto flex items-start gap-3.5 p-4 rounded-2xl bg-white/95 backdrop-blur-md border shadow-xl transition-all duration-300 animate-in fade-in slide-in-from-top-3 sm:slide-in-from-right-4 ${borderStyle}`}
                >
                  <div className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${badgeStyle}`}>
                    {isSuccess && <CheckCircleIcon className="w-5 h-5" />}
                    {isError && <AlertTriangleIcon className="w-5 h-5" />}
                    {isWarning && <AlertTriangleIcon className="w-5 h-5" />}
                    {!isSuccess && !isError && !isWarning && <InfoIcon className="w-5 h-5" />}
                  </div>

                  <div className="flex-1 min-w-0 pt-0.5">
                    {t.title && (
                      <h4 className="text-xs font-bold text-zinc-900 mb-0.5 tracking-tight font-[family-name:var(--font-heading)]">
                        {t.title}
                      </h4>
                    )}
                    <p className="text-xs text-zinc-700 font-medium leading-relaxed break-words">
                      {t.message}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => dismissToast(t.id)}
                    className="shrink-0 p-1 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition cursor-pointer"
                    aria-label="Tutup notifikasi"
                  >
                    <CloseIcon className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Confirm Dialog Modal */}
          {confirmState.isOpen && (
            <div
              className="fixed inset-0 z-[999999] flex items-center justify-center p-4 bg-zinc-950/65 backdrop-blur-xs transition-opacity duration-200 animate-in fade-in"
              onClick={() => handleConfirmAction(false)}
            >
              <div
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="confirm-modal-title"
                aria-describedby="confirm-modal-desc"
                className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-zinc-200/90 overflow-hidden transition-all duration-200 animate-in zoom-in-95"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Decorative Top Accent Bar */}
                <div
                  className={`absolute top-0 inset-x-0 h-1.5 ${
                    variant === "danger"
                      ? "bg-gradient-to-r from-rose-500 to-red-600"
                      : variant === "warning"
                      ? "bg-gradient-to-r from-amber-400 to-amber-600"
                      : "bg-gradient-to-r from-blue-500 to-indigo-600"
                  }`}
                />

                <div className="flex items-start gap-4 pt-1">
                  {/* Glowing Icon Badge */}
                  <div
                    className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl ring-6 transition-all ${
                      variant === "danger"
                        ? "bg-rose-50 text-rose-600 ring-rose-50/70 border border-rose-100"
                        : variant === "warning"
                        ? "bg-amber-50 text-amber-600 ring-amber-50/70 border border-amber-100"
                        : "bg-blue-50 text-blue-600 ring-blue-50/70 border border-blue-100"
                    }`}
                  >
                    {variant === "danger" ? (
                      <TrashIcon className="w-6 h-6" />
                    ) : variant === "warning" ? (
                      <AlertTriangleIcon className="w-6 h-6" />
                    ) : (
                      <InfoIcon className="w-6 h-6" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3
                      id="confirm-modal-title"
                      className="text-base sm:text-lg font-extrabold text-zinc-900 tracking-tight font-[family-name:var(--font-heading)]"
                    >
                      {confirmState.options.title || (variant === "danger" ? "Konfirmasi Hapus" : "Konfirmasi Tindakan")}
                    </h3>
                    <p
                      id="confirm-modal-desc"
                      className="mt-1.5 text-xs sm:text-sm text-zinc-600 font-medium leading-relaxed whitespace-pre-line"
                    >
                      {confirmState.options.message}
                    </p>
                  </div>
                </div>

                {/* Actions Footer */}
                <div className="mt-6 flex items-center justify-end gap-2.5 pt-4 border-t border-zinc-100">
                  <button
                    type="button"
                    onClick={() => handleConfirmAction(false)}
                    className="px-4 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-zinc-700 bg-zinc-100 hover:bg-zinc-200/80 active:scale-98 transition cursor-pointer"
                  >
                    {confirmState.options.cancelText || "Batal"}
                  </button>

                  <button
                    ref={confirmBtnRef}
                    type="button"
                    onClick={() => handleConfirmAction(true)}
                    className={`px-5 py-2.5 text-xs sm:text-sm font-bold rounded-xl text-white shadow-md active:scale-98 transition cursor-pointer flex items-center gap-1.5 ${
                      variant === "danger"
                        ? "bg-rose-600 hover:bg-rose-700 shadow-rose-600/25"
                        : variant === "warning"
                        ? "bg-amber-600 hover:bg-amber-700 shadow-amber-600/25"
                        : "bg-[var(--brand,#1a56db)] hover:opacity-95 shadow-blue-600/25"
                    }`}
                  >
                    <span>{confirmState.options.confirmText || (variant === "danger" ? "Ya, Hapus" : "Lanjutkan")}</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </>,
        document.body
      )}
    </NotificationContext.Provider>
  );
}

export function useNotification() {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error("useNotification must be used within a NotificationProvider");
  }
  return ctx;
}

export function useToast() {
  const { toast } = useNotification();
  return toast;
}

export function useConfirm() {
  const { confirm } = useNotification();
  return confirm;
}
