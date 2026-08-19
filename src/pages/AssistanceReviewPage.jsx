import React, { useEffect, useMemo, useState } from "react";
import { ClipboardList, RefreshCw, Search } from "lucide-react";
import { adminApi } from "../api/adminClient";
import StatusBadge from "../components/shared/StatusBadge";
import AssistanceDetailPanel from "../components/assistance/AssistanceDetailPanel";

function formatInr(amount) {
  const n = Number(amount);
  if (Number.isNaN(n)) return "—";
  return new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(n);
}

const ALL_STATUS_FILTERS = [
  { id: "ALL", label: "All" },
  { id: "SUBMITTED", label: "Submitted" },
  { id: "UNDER_REVIEW", label: "Under review" },
  { id: "ACTION_REQUIRED", label: "More info required" },
  { id: "APPROVED", label: "Approved" },
  { id: "REJECTED", label: "Rejected" },
  { id: "DISBURSED", label: "Disbursed" },
];

export default function AssistanceReviewPage({
  statusFilter = null,
  highlightApplicationId = null,
  onOpenKyc,
}) {
  const [queue, setQueue] = useState([]);
  const [filter, setFilter] = useState(statusFilter || "ALL");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [detail, setDetail] = useState(null);
  const [previousRequests, setPreviousRequests] = useState([]);
  const [alertMsg, setAlertMsg] = useState(null);

  useEffect(() => {
    if (statusFilter) setFilter(statusFilter);
  }, [statusFilter]);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listAdminAssistanceQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  useEffect(() => {
    if (!highlightApplicationId || !queue.length) return;
    const match = queue.find((a) => String(a.application_id) === String(highlightApplicationId));
    if (match) openDetail(match.application_id);
  }, [highlightApplicationId, queue]);

  const openDetail = async (id) => {
    try {
      const full = await adminApi.getAdminAssistanceDetail(id);
      setDetail(full);
      const others = queue.filter(
        (r) => r.receiver_id === full.receiver_id && r.application_id !== full.application_id,
      );
      setPreviousRequests(others.slice(0, 5));
    } catch (err) {
      setAlertMsg({ type: "error", text: err.message || "Could not load application" });
    }
  };

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return queue.filter((row) => {
      const statusOk =
        filter === "ALL" ||
        row.status === filter ||
        (filter === "UNDER_REVIEW" && ["SUBMITTED", "PENDING_REVIEW", "OPEN"].includes(row.status));
      if (!statusOk) return false;
      if (!q) return true;
      return (
        String(row.receiver_name || "").toLowerCase().includes(q) ||
        String(row.category || "").toLowerCase().includes(q) ||
        String(row.application_id).includes(q)
      );
    });
  }, [queue, filter, search]);

  const summary = useMemo(() => {
    const pending = queue.filter((r) =>
      ["SUBMITTED", "UNDER_REVIEW", "PENDING_REVIEW", "OPEN", "ACTION_REQUIRED"].includes(r.status),
    ).length;
    const approved = queue.filter((r) => r.status === "APPROVED").length;
    const rejected = queue.filter((r) => r.status === "REJECTED").length;
    return { pending, approved, rejected, total: queue.length };
  }, [queue]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ClipboardList className="w-6 h-6 text-sky-400" /> Money Requests
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Review financial assistance after receiver KYC is verified. KYC and assistance are separate workflows.
          </p>
        </div>
        <button
          type="button"
          onClick={loadQueue}
          className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg"
        >
          <RefreshCw className={`inline w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
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
          <p className="text-slate-400 text-xs">Approved</p>
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
            placeholder="Search receiver, category, ID…"
            className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200"
          />
        </div>
        {ALL_STATUS_FILTERS.map((tab) => (
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
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[11px]">
              <th className="p-4 text-left">Request ID</th>
              <th className="p-4 text-left">Receiver</th>
              <th className="p-4 text-left">KYC</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Amount</th>
              <th className="p-4 text-left">Submitted</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">Loading…</td>
              </tr>
            ) : !filtered.length ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">No requests match this filter.</td>
              </tr>
            ) : (
              filtered.map((row) => (
                <tr key={row.application_id} className="hover:bg-slate-800/40">
                  <td className="p-4 text-sky-400 font-bold">#{row.application_id}</td>
                  <td className="p-4 text-white">{row.receiver_name || row.receiver_id}</td>
                  <td className="p-4">
                    <StatusBadge status={row.receiver_verification_status || "NOT_STARTED"} />
                  </td>
                  <td className="p-4 text-slate-300">{row.category?.replace(/_/g, " ") || "—"}</td>
                  <td className="p-4">{formatInr(row.amount_requested)}</td>
                  <td className="p-4 text-slate-400">
                    {row.submitted_at ? new Date(row.submitted_at).toLocaleDateString() : "—"}
                  </td>
                  <td className="p-4"><StatusBadge status={row.status} /></td>
                  <td className="p-4 text-right">
                    <button
                      type="button"
                      onClick={() => openDetail(row.application_id)}
                      className="px-3 py-1 bg-sky-600 text-white rounded font-bold"
                    >
                      Review
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {detail && (
        <AssistanceDetailPanel
          detail={detail}
          previousRequests={previousRequests}
          onClose={() => setDetail(null)}
          onUpdated={loadQueue}
          onOpenKyc={onOpenKyc}
          onAlert={setAlertMsg}
        />
      )}
    </div>
  );
}
