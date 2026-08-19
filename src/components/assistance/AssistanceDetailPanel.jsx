import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle, ExternalLink } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import DocumentGrid from "../shared/DocumentGrid";
import ConfirmModal from "../shared/ConfirmModal";
import { adminApi } from "../../api/adminClient";
import { ASSISTANCE_REVIEWABLE } from "../../utils/status";

function formatInr(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

function HistoryTimeline({ history = [], rejectionReason, actionReason, reviewedAt, reviewedBy }) {
  const items = [...(history || [])];
  return (
    <div className="space-y-3 text-xs">
      <ul className="space-y-2">
        {items.map((h) => (
          <li key={h.history_id} className="flex gap-3 text-slate-300">
            <span className="text-slate-500 shrink-0">
              {h.changed_at ? new Date(h.changed_at).toLocaleString() : "—"}
            </span>
            <span className="font-semibold text-white">{h.status?.replace(/_/g, " ")}</span>
          </li>
        ))}
      </ul>
      {rejectionReason && (
        <p className="text-red-300"><strong>Rejection:</strong> {rejectionReason}</p>
      )}
      {actionReason && (
        <p className="text-amber-300"><strong>Action required:</strong> {actionReason}</p>
      )}
      {reviewedAt && (
        <p className="text-slate-400">
          Reviewed {new Date(reviewedAt).toLocaleString()}
          {reviewedBy ? ` · Admin user #${reviewedBy}` : ""}
        </p>
      )}
    </div>
  );
}

export default function AssistanceDetailPanel({
  detail,
  previousRequests = [],
  onClose,
  onUpdated,
  onOpenKyc,
  onAlert,
}) {
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");
  const [approvedAmount, setApprovedAmount] = useState("");
  const [utr, setUtr] = useState("");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [showMoreInfo, setShowMoreInfo] = useState(false);

  if (!detail) return null;

  const canReview = ASSISTANCE_REVIEWABLE.has(detail.status);
  const canDisburse =
    detail.status === "APPROVED" &&
    ["READY_FOR_DISBURSEMENT", "BANK_DETAILS_SUBMITTED"].includes(detail.payout_status);
  const kycOk = String(detail.receiver_verification_status || "").toUpperCase() === "VERIFIED";

  const review = (action) => {
    if (action === "reject" && !reason.trim()) {
      onAlert?.({ type: "error", text: "Rejection reason is required." });
      return;
    }
    if (action === "request_action" && !reason.trim()) {
      onAlert?.({ type: "error", text: "Explain what information or documents are required." });
      return;
    }
    setBusy(true);
    const payload = {
      action,
      rejection_reason: action === "reject" ? reason.trim() : undefined,
      action_required_reason: action === "request_action" ? reason.trim() : undefined,
    };
    if (action === "approve" && approvedAmount.trim()) {
      payload.approved_amount = Number(approvedAmount);
    }
    adminApi.reviewAdminAssistance(detail.application_id, payload)
      .then(() => {
        onAlert?.({ type: "success", text: `Application ${action === "approve" ? "approved" : action === "reject" ? "rejected" : "updated"}.` });
        onClose?.();
        onUpdated?.();
      })
      .catch((err) => onAlert?.({ type: "error", text: err.message || "Review failed." }))
      .finally(() => {
        setBusy(false);
        setShowApprove(false);
        setShowReject(false);
        setShowMoreInfo(false);
      });
  };

  const disburse = () => {
    if (!utr.trim()) {
      onAlert?.({ type: "error", text: "Disbursement reference required." });
      return;
    }
    setBusy(true);
    adminApi.disburseAdminAssistance(detail.application_id, {
      disbursement_reference: utr.trim(),
      note: reason.trim() || undefined,
    })
      .then(() => {
        onAlert?.({ type: "success", text: "Disbursement recorded." });
        onClose?.();
        onUpdated?.();
      })
      .catch((err) => onAlert?.({ type: "error", text: err.message || "Disburse failed." }))
      .finally(() => setBusy(false));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-stretch justify-end">
      <div className="w-full max-w-4xl bg-[#0f172a] border-l border-slate-800 h-full overflow-y-auto">
        <header className="sticky top-0 z-10 bg-[#0f172a]/95 border-b border-slate-800 p-5 flex justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">Money request</p>
            <h2 className="text-xl font-semibold text-white">APP-{detail.application_id}</h2>
            <p className="text-xs text-slate-400 mt-1">{detail.receiver_name}</p>
          </div>
          <div className="text-right space-y-2">
            <StatusBadge status={detail.status} />
            <button type="button" onClick={onClose} className="text-slate-400 text-sm">Close</button>
          </div>
        </header>

        <div className="p-5 space-y-4">
          {!kycOk && (
            <div className="admin-card p-3 text-xs text-amber-300 border border-amber-700/50">
              Receiver KYC is not VERIFIED. Approval will be blocked by the backend until KYC is complete.
            </div>
          )}

          {canReview && (
            <div className="admin-card p-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy || !kycOk}
                onClick={() => setShowApprove(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowReject(true)}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowMoreInfo(true)}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" /> Request more information
              </button>
              {canDisburse && (
                <button
                  type="button"
                  disabled={busy}
                  onClick={disburse}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg text-xs font-bold"
                >
                  Mark disbursed
                </button>
              )}
            </div>
          )}

          <section className="admin-card p-4 space-y-2 text-xs">
            <h4 className="text-xs font-bold uppercase text-slate-400">Receiver</h4>
            <p><span className="text-slate-500">Name:</span> {detail.receiver_name}</p>
            <p><span className="text-slate-500">Email:</span> {detail.receiver_email || "—"}</p>
            <p><span className="text-slate-500">Mobile:</span> {detail.receiver_mobile || "—"}</p>
            <p><span className="text-slate-500">KYC:</span> <StatusBadge status={detail.receiver_verification_status} /></p>
            {detail.receiver_kyc_reference && (
              <p><span className="text-slate-500">KYC ref:</span> {detail.receiver_kyc_reference}</p>
            )}
            {detail.receiver_kyc_request_id && onOpenKyc && (
              <button
                type="button"
                onClick={() => onOpenKyc(detail.receiver_kyc_request_id)}
                className="text-sky-400 font-bold inline-flex items-center gap-1"
              >
                <ExternalLink className="w-3.5 h-3.5" /> View receiver KYC
              </button>
            )}
          </section>

          <section className="admin-card p-4 space-y-2 text-xs text-slate-300">
            <h4 className="text-xs font-bold uppercase text-slate-400">Request</h4>
            <p><strong className="text-slate-500">Category:</strong> {detail.category?.replace(/_/g, " ") || "—"}</p>
            <p><strong className="text-slate-500">Amount:</strong> {formatInr(detail.amount_requested)}</p>
            {detail.amount_approved != null && (
              <p><strong className="text-slate-500">Approved:</strong> {formatInr(detail.amount_approved)}</p>
            )}
            <p><strong className="text-slate-500">Purpose</strong><br />{detail.purpose}</p>
            {detail.expense_breakdown && (
              <p><strong className="text-slate-500">Expense breakdown</strong><br />
                <span className="whitespace-pre-wrap">{detail.expense_breakdown}</span>
              </p>
            )}
            {detail.notes && <p><strong className="text-slate-500">Notes</strong><br />{detail.notes}</p>}
            <p><strong className="text-slate-500">Submitted:</strong>{" "}
              {detail.submitted_at ? new Date(detail.submitted_at).toLocaleString() : "—"}
            </p>
            <p><strong className="text-slate-500">Payout status:</strong> {detail.payout_status || "—"}</p>
          </section>

          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Supporting documents</h4>
            <DocumentGrid
              documents={detail.documents}
              onView={(doc) => adminApi.openAssistanceDocument(detail.application_id, doc.document_id)}
            />
          </section>

          {(detail.bank_account_holder || detail.bank_name) && (
            <section className="admin-card p-4 text-xs text-slate-300 space-y-1">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Bank / destination</h4>
              <p>Holder: {detail.bank_account_holder || "—"}</p>
              <p>Bank: {detail.bank_name || "—"}</p>
              <p>IFSC: {detail.bank_ifsc || "—"}</p>
              <p>Account: {detail.bank_account_last4 ? `••••${detail.bank_account_last4}` : "—"}</p>
              <p>Destination type: {detail.payment_destination_type || "—"}</p>
            </section>
          )}

          {previousRequests.length > 0 && (
            <section className="admin-card p-4">
              <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Other requests from receiver</h4>
              <ul className="text-xs space-y-1 text-slate-300">
                {previousRequests.map((r) => (
                  <li key={r.application_id}>
                    #{r.application_id} · {formatInr(r.amount_requested)} · {r.status}
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section className="admin-card p-4 space-y-3">
            <h4 className="text-xs font-bold uppercase text-slate-400">Review notes</h4>
            <input
              value={approvedAmount}
              onChange={(e) => setApprovedAmount(e.target.value)}
              placeholder="Approved amount (optional)"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            />
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Rejection reason / more information instructions"
              className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 min-h-[80px]"
            />
            <input
              value={utr}
              onChange={(e) => setUtr(e.target.value)}
              placeholder="Disbursement UTR / reference"
              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
            />
          </section>

          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Status history</h4>
            <HistoryTimeline
              history={detail.history}
              rejectionReason={detail.rejection_reason}
              actionReason={detail.action_required_reason}
              reviewedAt={detail.reviewed_at}
              reviewedBy={detail.reviewed_by_user_id}
            />
          </section>
        </div>
      </div>

      <ConfirmModal
        open={showApprove}
        title="Approve assistance request?"
        tone="success"
        busy={busy}
        confirmLabel="Approve"
        onCancel={() => setShowApprove(false)}
        onConfirm={() => review("approve")}
      >
        <p>
          Approve <strong>{formatInr(approvedAmount || detail.amount_requested)}</strong> for{" "}
          <strong>{detail.receiver_name}</strong>? This does not change KYC status.
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={showReject}
        title="Reject assistance request?"
        tone="danger"
        busy={busy}
        confirmLabel="Reject"
        onCancel={() => setShowReject(false)}
        onConfirm={() => review("reject")}
      >
        <p>{reason.trim() || "Provide a rejection reason in the notes field."}</p>
      </ConfirmModal>

      <ConfirmModal
        open={showMoreInfo}
        title="Request more information?"
        tone="warning"
        busy={busy}
        confirmLabel="Send request"
        onCancel={() => setShowMoreInfo(false)}
        onConfirm={() => review("request_action")}
      >
        <p>
          The receiver will be asked to provide:{" "}
          {reason.trim() || "add details in the notes field before confirming."}
        </p>
      </ConfirmModal>
    </div>
  );
}
