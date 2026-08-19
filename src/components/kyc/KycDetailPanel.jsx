import React, { useState } from "react";
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import StatusBadge from "../shared/StatusBadge";
import DocumentGrid from "../shared/DocumentGrid";
import ConfirmModal from "../shared/ConfirmModal";
import { adminApi } from "../../api/adminClient";
import { KYC_FIELD_LABELS, maskSensitive, RECEIVER_KYC_ADMIN_FIELDS } from "../../utils/kycDisplay";
import { KYC_REVIEWABLE } from "../../utils/status";

function FieldGrid({ title, fields }) {
  if (!fields?.length) return null;
  return (
    <section className="admin-card p-4 space-y-3">
      <h4 className="text-xs font-bold uppercase tracking-wide text-slate-400">{title}</h4>
      <dl className="grid sm:grid-cols-2 gap-3 text-xs">
        {fields.map(([label, value]) => (
          <div key={label} className="bg-slate-950 rounded-lg p-3">
            <dt className="text-slate-500 mb-1">{label}</dt>
            <dd className="text-white font-medium">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function HistoryTimeline({ history = [] }) {
  if (!history.length) return <p className="text-xs text-slate-500">No history recorded.</p>;
  return (
    <ul className="space-y-2 text-xs">
      {history.map((h) => (
        <li key={h.history_id} className="flex gap-3 text-slate-300">
          <span className="text-slate-500 shrink-0">
            {h.changed_at ? new Date(h.changed_at).toLocaleString() : "—"}
          </span>
          <span className="font-semibold text-white">{h.status?.replace(/_/g, " ")}</span>
          {h.note && <span className="text-slate-400">— {h.note}</span>}
        </li>
      ))}
    </ul>
  );
}

export default function KycDetailPanel({
  detail,
  onClose,
  onUpdated,
  onAlert,
}) {
  const [busy, setBusy] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [moreInfoReason, setMoreInfoReason] = useState("");
  const [approvalNote, setApprovalNote] = useState("");
  const [selectedFields, setSelectedFields] = useState([]);
  const [docType, setDocType] = useState("ID_FRONT");
  const [showApprove, setShowApprove] = useState(false);
  const [showReject, setShowReject] = useState(false);

  if (!detail) return null;

  const payload = detail.payload || {};
  const personal = payload.personal || {};
  const identity = payload.identity || {};
  const address = payload.address || {};
  const beneficiary = payload.beneficiary || {};
  const assistance = payload.assistance || {};
  const bank = payload.bank || {};
  const paymentDest = payload.payment_destination || {};
  const mobileVerified = payload.mobile_verification?.verified_at;

  const canReview = KYC_REVIEWABLE.has(detail.status);
  const isReceiver = detail.request_type === "RECEIVER";

  const toggleField = (path) => {
    setSelectedFields((prev) =>
      prev.includes(path) ? prev.filter((p) => p !== path) : [...prev, path],
    );
  };

  const run = async (fn) => {
    setBusy(true);
    try {
      await fn();
      onUpdated?.();
    } catch (err) {
      onAlert?.({ type: "error", text: err.message || "Action failed." });
    } finally {
      setBusy(false);
      setShowApprove(false);
      setShowReject(false);
    }
  };

  const approve = () =>
    run(async () => {
      await adminApi.approveKyc(detail.request_id, approvalNote.trim() || undefined);
      onAlert?.({ type: "success", text: "KYC approved." });
      onClose?.();
    });

  const reject = () => {
    if (!rejectReason.trim()) {
      onAlert?.({ type: "error", text: "Rejection reason is required." });
      return;
    }
    run(async () => {
      await adminApi.rejectKyc(detail.request_id, rejectReason.trim());
      onAlert?.({ type: "success", text: "KYC rejected." });
      onClose?.();
    });
  };

  const requestMore = async () => {
    if (!moreInfoReason.trim()) {
      onAlert?.({ type: "error", text: "Explain what the applicant must provide." });
      return;
    }
    setBusy(true);
    try {
      if (isReceiver && selectedFields.length) {
        await adminApi.requestKycFieldUpdates(detail.request_id, {
          field_paths: selectedFields,
          reason: moreInfoReason.trim(),
        });
      } else {
        await adminApi.requestMoreKycDocuments(detail.request_id, {
          document_type: docType,
          reason: moreInfoReason.trim(),
        });
      }
      onAlert?.({ type: "success", text: "More information requested." });
      onUpdated?.();
    } catch (err) {
      onAlert?.({ type: "error", text: err.message || "Request failed." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-stretch justify-end">
      <div className="w-full max-w-4xl bg-[#0f172a] border-l border-slate-800 h-full overflow-y-auto">
        <header className="sticky top-0 z-10 bg-[#0f172a]/95 border-b border-slate-800 p-5 flex justify-between gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wide text-slate-500">KYC Review</p>
            <h2 className="text-xl font-semibold text-white">
              {detail.applicant?.name || detail.applicant_name || `User #${detail.user_id}`}
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              {detail.reference_code || `VER-${detail.request_id}`} · {detail.request_type}
            </p>
          </div>
          <div className="text-right space-y-2">
            <StatusBadge status={detail.status} />
            <button type="button" onClick={onClose} className="text-slate-400 text-sm">Close</button>
          </div>
        </header>

        <div className="p-5 space-y-4">
          {canReview && (
            <div className="admin-card p-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowApprove(true)}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve KYC
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={requestMore}
                className="px-4 py-2 bg-amber-600 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
              >
                <AlertCircle className="w-4 h-4" /> Request more information
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={() => setShowReject(true)}
                className="px-4 py-2 bg-red-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-1"
              >
                <XCircle className="w-4 h-4" /> Reject KYC
              </button>
            </div>
          )}

          <FieldGrid
            title="Personal information"
            fields={[
              ["Full legal name", personal.full_name || `${personal.first_name || ""} ${personal.last_name || ""}`.trim() || "—"],
              ["Date of birth", personal.dob || "—"],
              ["Email", personal.email || detail.applicant?.email || "—"],
              ["Mobile verification", mobileVerified ? `Verified ${new Date(mobileVerified).toLocaleString()}` : "Not verified"],
            ]}
          />

          <FieldGrid
            title="Identity"
            fields={[
              ["Document type", identity.id_type?.replace(/_/g, " ") || "—"],
              ["Document number", maskSensitive("id_number", identity.id_number)],
              ["Provider status", identity.provider_status || "—"],
            ]}
          />
          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Identity documents</h4>
            <DocumentGrid
              documents={(detail.documents || []).filter((d) =>
                ["ID_FRONT", "ID_BACK"].includes(d.document_type),
              )}
              onView={(doc) => adminApi.openVerificationDocument(detail.request_id, doc.document_id)}
            />
          </section>

          <FieldGrid
            title="Address & location"
            fields={[
              ["Address", address.address_line || "—"],
              ["City", address.city || "—"],
              ["State", address.state || "—"],
              ["Postal code", address.pincode || "—"],
              ["Coordinates", address.latitude && address.longitude
                ? `${address.latitude}, ${address.longitude}`
                : "Not captured"],
              ["Location captured", address.location_captured_at
                ? maskSensitive("location_captured_at", address.location_captured_at)
                : "—"],
            ]}
          />
          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Address proof</h4>
            <DocumentGrid
              documents={(detail.documents || []).filter((d) => d.document_type === "ADDRESS_PROOF")}
              onView={(doc) => adminApi.openVerificationDocument(detail.request_id, doc.document_id)}
            />
          </section>

          {beneficiary?.relationship && (
            <>
              <FieldGrid
                title="Beneficiary"
                fields={[
                  ["Relationship", beneficiary.relationship === "SELF" ? "Self" : beneficiary.relationship],
                  ...(beneficiary.relationship !== "SELF"
                    ? [
                        ["Beneficiary name", beneficiary.full_name || "—"],
                        ["Beneficiary DOB", beneficiary.dob || "—"],
                      ]
                    : []),
                ]}
              />
              {beneficiary.relationship !== "SELF" && (
                <section className="admin-card p-4">
                  <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Relationship proof</h4>
                  <DocumentGrid
                    documents={(detail.documents || []).filter((d) => d.document_type === "RELATIONSHIP_PROOF")}
                    onView={(doc) => adminApi.openVerificationDocument(detail.request_id, doc.document_id)}
                  />
                </section>
              )}
            </>
          )}

          <FieldGrid
            title="Verification purpose"
            fields={[
              ["Purpose", assistance.category?.replace(/_/g, " ") || "—"],
              ["Explanation", assistance.explanation || "—"],
            ]}
          />

          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Supporting documents</h4>
            <DocumentGrid
              documents={(detail.documents || []).filter((d) =>
                !["ID_FRONT", "ID_BACK", "ADDRESS_PROOF", "BANK_PROOF", "RELATIONSHIP_PROOF"].includes(d.document_type),
              )}
              onView={(doc) => adminApi.openVerificationDocument(detail.request_id, doc.document_id)}
            />
          </section>

          <FieldGrid
            title="Bank information"
            fields={[
              ["Account holder", bank.account_holder_name || "—"],
              ["Bank", bank.bank_name || "—"],
              ["Account number", maskSensitive("account_number", bank.account_number)],
              ["IFSC", bank.ifsc || "—"],
            ]}
          />
          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Bank proof</h4>
            <DocumentGrid
              documents={(detail.documents || []).filter((d) => d.document_type === "BANK_PROOF")}
              onView={(doc) => adminApi.openVerificationDocument(detail.request_id, doc.document_id)}
            />
          </section>

          {paymentDest && Object.keys(paymentDest).length > 0 && (
            <FieldGrid
              title="Payment destination"
              fields={Object.entries(paymentDest).map(([k, v]) => [
                KYC_FIELD_LABELS[k] || k.replace(/_/g, " "),
                maskSensitive(k, v),
              ])}
            />
          )}

          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-2">Consent</h4>
            <p className="text-xs text-slate-300">
              Consent: {detail.consent_given ? "Yes" : "No"}
              {detail.consent_timestamp && (
                <> · {new Date(detail.consent_timestamp).toLocaleString()}</>
              )}
              {detail.consent_version && <> · Version {detail.consent_version}</>}
            </p>
          </section>

          {canReview && isReceiver && (
            <section className="admin-card p-4 space-y-3">
              <h4 className="text-xs font-bold uppercase text-slate-400">Request more information</h4>
              <div className="flex flex-wrap gap-1">
                {RECEIVER_KYC_ADMIN_FIELDS.map((f) => (
                  <button
                    key={f.path}
                    type="button"
                    onClick={() => toggleField(f.path)}
                    className={`px-2 py-1 rounded text-[10px] font-bold border ${
                      selectedFields.includes(f.path)
                        ? "bg-sky-600 border-sky-500 text-white"
                        : "bg-slate-950 border-slate-700 text-slate-400"
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-xs text-slate-200"
              >
                <option value="ID_FRONT">Identity document</option>
                <option value="ADDRESS_PROOF">Address proof</option>
                <option value="BANK_PROOF">Bank proof</option>
                <option value="RELATIONSHIP_PROOF">Relationship proof</option>
                <option value="SUPPORTING_PRIMARY">Supporting document</option>
              </select>
              <textarea
                value={moreInfoReason}
                onChange={(e) => setMoreInfoReason(e.target.value)}
                placeholder="Explain what must be corrected or uploaded"
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 min-h-[80px]"
              />
              <textarea
                value={approvalNote}
                onChange={(e) => setApprovalNote(e.target.value)}
                placeholder="Optional approval note"
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 min-h-[50px]"
              />
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Rejection reason (required to reject)"
                className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 min-h-[70px]"
              />
            </section>
          )}

          <section className="admin-card p-4">
            <h4 className="text-xs font-bold uppercase text-slate-400 mb-3">Verification history</h4>
            <HistoryTimeline history={detail.history} />
            {detail.risk_flags?.length > 0 && (
              <p className="text-xs text-amber-300 mt-3">
                Risk flags: {detail.risk_flags.join(", ")}
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmModal
        open={showApprove}
        title="Approve KYC?"
        tone="success"
        busy={busy}
        confirmLabel="Approve KYC"
        onCancel={() => setShowApprove(false)}
        onConfirm={approve}
      >
        <p>
          Confirm that identity and documents for{" "}
          <strong>{detail.applicant?.name || detail.applicant_name}</strong> have been reviewed.
          The receiver will be able to request financial assistance after approval.
        </p>
      </ConfirmModal>

      <ConfirmModal
        open={showReject}
        title="Reject KYC?"
        tone="danger"
        busy={busy}
        confirmLabel="Reject KYC"
        onCancel={() => setShowReject(false)}
        onConfirm={reject}
      >
        <p>Rejection reason: {rejectReason.trim() || "(required above)"}</p>
      </ConfirmModal>
    </div>
  );
}
