"use client";

export function AdminFormDialog({
  title,
  open,
  onClose,
  maxWidth,
  className,
  children,
}: {
  title: string;
  open: boolean;
  onClose: () => void;
  maxWidth?: string;
  className?: string;
  children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="admin-dialog-bg" onClick={onClose} role="presentation">
      <div
        className={`admin-dialog ${className ?? ""}`}
        style={maxWidth ? { width: maxWidth, maxWidth: "96vw" } : undefined}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal
      >
        <div className="flex items-center justify-between mb-4 border-b border-zinc-100 pb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-zinc-900 pr-4">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-zinc-400 hover:bg-zinc-100 hover:text-zinc-700 transition"
            aria-label="Tutup dialog"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
