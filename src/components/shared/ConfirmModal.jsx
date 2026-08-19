import React from "react";

export default function ConfirmModal({
  open,
  title,
  children,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  tone = "primary",
  busy = false,
  onConfirm,
  onCancel,
}) {
  if (!open) return null;

  const confirmClass =
    tone === "danger"
      ? "bg-red-700 hover:bg-red-600"
      : tone === "success"
        ? "bg-emerald-600 hover:bg-emerald-500"
        : tone === "warning"
          ? "bg-amber-600 hover:bg-amber-500"
          : "bg-sky-600 hover:bg-sky-500";

  return (
    <div className="fixed inset-0 z-[60] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="admin-card max-w-md w-full p-5 space-y-4">
        <h3 className="text-lg font-semibold text-white">{title}</h3>
        <div className="text-sm text-slate-300">{children}</div>
        <div className="flex gap-2 justify-end">
          <button
            type="button"
            onClick={onCancel}
            disabled={busy}
            className="px-4 py-2 text-xs font-bold rounded-lg bg-slate-800 text-slate-300"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={busy}
            className={`px-4 py-2 text-xs font-bold rounded-lg text-white ${confirmClass}`}
          >
            {busy ? "Processing…" : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
