import React, { useEffect, useMemo, useState } from "react";
import { ShieldCheck, RefreshCw, Eye, Search } from "lucide-react";
import { adminApi } from "../api/adminClient";
import StatusBadge from "../components/shared/StatusBadge";
import KycDetailPanel from "../components/kyc/KycDetailPanel";

const STATUS_FILTERS = [
  { id: "PENDING", label: "Pending review" },
  { id: "ALL", label: "All" },
  { id: "UNDER_REVIEW", label: "Under review" },
  { id: "DOCUMENTS_SUBMITTED", label: "Documents submitted" },
  { id: "MORE_DOCUMENTS_REQUIRED", label: "More info required" },
  { id: "VERIFIED", label: "Verified" },
  { id: "REJECTED", label: "Rejected" },
];

const PENDING_KYC_STATUSES = new Set([
  "UNDER_REVIEW",
  "DOCUMENTS_SUBMITTED",
  "VALIDATION_IN_PROGRESS",
]);

export default function VerificationQueuePage({ initialType = "RECEIVER", highlightRequestId = null }) {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("PENDING");
  const [typeFilter, setTypeFilter] = useState(initialType);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [alertMsg, setAlertMsg] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const params = {};
      if (typeFilter !== "ALL") params.request_type = typeFilter;
      const data = await adminApi.listAdminVerifications(params);
      setRequests(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error("Failed to load KYC queue:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setTypeFilter(initialType);
  }, [initialType]);

  useEffect(() => {
    loadQueue();
  }, [typeFilter]);

  useEffect(() => {
    if (!highlightRequestId || !requests.length) return;
    const match = requests.find((r) => String(r.request_id) === String(highlightRequestId));
    if (match) openDetail(match);
  }, [highlightRequestId, requests]);

  const openDetail = async (req) => {
    try {
      const full = await adminApi.getAdminVerificationDetail(req.request_id);
      setDetail({ ...req, ...full });
    } catch (err) {
      setAlertMsg({ type: "error", text: err.message || "Could not load verification detail." });
    }
  };

  const typeRequests = useMemo(
    () => requests.filter((r) => typeFilter === "ALL" || r.request_type === typeFilter),
    [requests, typeFilter],
  );

  const summary = useMemo(() => {
    const pending = typeRequests.filter((r) =>
      ["UNDER_REVIEW", "DOCUMENTS_SUBMITTED", "VALIDATION_IN_PROGRESS", "MORE_DOCUMENTS_REQUIRED"].includes(r.status),
    ).length;
    const approved = typeRequests.filter((r) => r.status === "VERIFIED").length;
    const rejected = typeRequests.filter((r) => r.status === "REJECTED").length;
    return { pending, approved, rejected, total: typeRequests.length };
  }, [typeRequests]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return typeRequests.filter((r) => {
      const status = String(r.status || "").toUpperCase();
      const statusOk =
        filter === "ALL" ||
        (filter === "PENDING" && PENDING_KYC_STATUSES.has(status)) ||
        status === filter;
      if (!statusOk) return false;
      if (!q) return true;
      return (
        String(r.applicant_name || "").toLowerCase().includes(q) ||
        String(r.applicant_email || "").toLowerCase().includes(q) ||
        String(r.applicant_mobile || "").includes(q) ||
        String(r.reference_code || "").toLowerCase().includes(q) ||
        String(r.request_id).includes(q)
      );
    });
  }, [typeRequests, filter, search]);

  const pageTitle =
    typeFilter === "NGO"
      ? "NGO KYC Verification"
      : typeFilter === "DONOR"
        ? "Donor Verification"
        : "Receiver KYC Verification";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" /> {pageTitle}
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review identity verification submissions. Approve, reject, or request more information.
          </p>
        </div>
        <button
          type="button"
          onClick={loadQueue}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      {alertMsg && (
        <div
          className={`p-4 rounded-lg border text-xs font-bold flex justify-between ${
            alertMsg.type === "success"
              ? "bg-emerald-950 text-emerald-300 border-emerald-500"
              : "bg-red-950 text-red-300 border-red-500"
          }`}
        >
          <span>{alertMsg.text}</span>
          <button type="button" onClick={() => setAlertMsg(null)}>Dismiss</button>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="admin-card p-4">
          <p className="text-slate-400 text-xs">Pending review</p>
          <p className="text-2xl font-bold text-amber-400">{summary.pending}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-slate-400 text-xs">Verified</p>
          <p className="text-2xl font-bold text-emerald-400">{summary.approved}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-slate-400 text-xs">Rejected</p>
          <p className="text-2xl font-bold text-red-400">{summary.rejected}</p>
        </div>
        <div className="admin-card p-4">
          <p className="text-slate-400 text-xs">Total</p>
          <p className="text-2xl font-bold text-white">{summary.total}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search name, email, mobile, reference…"
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
          />
        </div>
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setFilter(tab.id)}
            className={`px-3 py-2 rounded-lg text-xs font-bold border border-slate-800 ${
              filter === tab.id ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-400"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
              <th className="p-4">Receiver / applicant</th>
              <th className="p-4">Email</th>
              <th className="p-4">Mobile</th>
              <th className="p-4">KYC status</th>
              <th className="p-4">Submitted</th>
              <th className="p-4">Reference</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 text-xs">
            {loading ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">Loading verification queue…</td>
              </tr>
            ) : !filtered.length ? (
              <tr>
                <td colSpan={7} className="p-8 text-center text-slate-500">No verification requests match this filter.</td>
              </tr>
            ) : (
              filtered.map((req) => (
                <tr key={req.request_id} className="hover:bg-slate-800/40">
                  <td className="p-4 text-white font-medium">
                    {req.applicant_name || `User #${req.user_id}`}
                  </td>
                  <td className="p-4 text-slate-300">{req.applicant_email || "—"}</td>
                  <td className="p-4 text-slate-300">{req.applicant_mobile || "—"}</td>
                  <td className="p-4"><StatusBadge status={req.status} /></td>
                  <td className="p-4 text-slate-400">
                    {req.submitted_at ? new Date(req.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4 text-slate-400 font-mono text-[10px]">
                    {req.reference_code || `VER-${req.request_id}`}
                  </td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(req)}
                      className="px-3 py-1.5 bg-sky-600 text-white font-bold rounded text-xs inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" /> Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <KycDetailPanel
          detail={detail}
          onClose={() => setDetail(null)}
          onUpdated={loadQueue}
          onAlert={setAlertMsg}
        />
      )}
    </div>
  );
}
