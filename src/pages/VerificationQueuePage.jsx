import React, { useState, useEffect } from "react";
import { ShieldCheck, FileText, CheckCircle2, XCircle, AlertCircle, Eye, RefreshCw, Search } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function VerificationQueuePage() {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [alertMsg, setAlertMsg] = useState(null);

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getVerificationRequests();
      setRequests(data);
    } catch (err) {
      console.error("Failed to load verification queue:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQueue();
  }, []);

  const handleReview = async (status) => {
    if (!selectedReq) return;
    if (status === "REJECTED" && !rejectionReason.trim()) {
      alert("Please enter a rejection reason before rejecting.");
      return;
    }

    setActionLoading(true);
    try {
      if (status === "VERIFIED") {
        await adminApi.approveAccount(selectedReq.user_id, selectedReq.request_id);
      } else {
        await adminApi.rejectAccount(selectedReq.user_id, selectedReq.request_id, rejectionReason);
      }
      setAlertMsg({ type: "success", text: `Verification Request #${selectedReq.request_id} successfully updated to ${status}. Account access updated.` });
      setSelectedReq(null);
      setRejectionReason("");
      await loadQueue();
    } catch (err) {
      setAlertMsg({ type: "error", text: err.message || "Failed to update request." });
    } finally {
      setActionLoading(false);
    }
  };

  const filtered = requests.filter((r) => {
    const matchesStatus = filter === "ALL" || r.status === filter;
    const matchesType = typeFilter === "ALL" || r.request_type === typeFilter;
    return matchesStatus && matchesType;
  });

  const typeBadgeClass = (type) => {
    if (type === "NGO") return "bg-purple-900/60 text-purple-300 border border-purple-500";
    if (type === "DONOR") return "bg-emerald-900/60 text-emerald-300 border border-emerald-500";
    return "bg-sky-900/60 text-sky-300 border border-sky-500";
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-sky-400" /> Approvals
          </h2>
          <p className="text-sm text-slate-400 mt-1">Review Donor, Receiver, and NGO applications. Approving activates the account.</p>
        </div>
        <button
          onClick={loadQueue}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Queue
        </button>
      </div>

      {alertMsg && (
        <div className={`p-4 rounded-lg border border-slate-800 flex items-center justify-between text-xs font-bold ${
          alertMsg.type === "success" ? "bg-emerald-950 text-emerald-300 border-emerald-500" : "bg-red-950 text-red-300 border-red-500"
        }`}>
          <span>{alertMsg.text}</span>
          <button onClick={() => setAlertMsg(null)} className="text-white hover:underline">Dismiss</button>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {["ALL", "DONOR", "RECEIVER", "NGO"].map((tab) => (
          <button
            key={tab}
            onClick={() => setTypeFilter(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition border border-slate-800 ${
              typeFilter === tab ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab} ({requests.filter((r) => tab === "ALL" || r.request_type === tab).length})
          </button>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {["ALL", "UNDER_REVIEW", "SUBMITTED", "VERIFIED", "REJECTED"].map((tab) => (
          <button
            key={tab}
            onClick={() => setFilter(tab)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition border border-slate-800 ${
              filter === tab ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-400 hover:bg-slate-800 hover:text-white"
            }`}
          >
            {tab.replace("_", " ")} ({requests.filter((r) => tab === "ALL" || r.status === tab).length})
          </button>
        ))}
      </div>

      {/* Verification Queue Table */}
      <div className="admin-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                <th className="p-4">Req ID</th>
                <th className="p-4">Applicant Type</th>
                <th className="p-4">User ID</th>
                <th className="p-4">Submitted Date</th>
                <th className="p-4">Documents</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-8 text-center text-slate-500 font-semibold">
                    No verification requests match the selected status filter.
                  </td>
                </tr>
              ) : (
                filtered.map((req) => (
                  <tr key={req.request_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{req.request_id}</td>
                    <td className="p-4 font-bold text-white">
                      <span className={`px-2 py-0.5 rounded text-[10px] ${typeBadgeClass(req.request_type)}`}>
                        {req.request_type}
                      </span>
                    </td>
                    <td className="p-4 font-mono text-slate-300">User #{req.user_id}</td>
                    <td className="p-4 text-slate-400">{new Date(req.submitted_at).toLocaleDateString()}</td>
                    <td className="p-4">
                      <span className="font-bold text-slate-300">{req.documents?.length || 0} Docs Attached</span>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        req.status === "VERIFIED" ? "badge-verified" : req.status === "REJECTED" ? "badge-rejected" : "badge-review"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        onClick={() => setSelectedReq(req)}
                        className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded border border-black flex items-center gap-1.5 ml-auto"
                      >
                        <Eye className="w-3.5 h-3.5" /> Review Application
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal Popup */}
      {selectedReq && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-slate-900 border border-slate-800 rounded-xl max-w-2xl w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div>
                <h3 className="text-lg font-black text-white">Review Verification #{selectedReq.request_id}</h3>
                <p className="text-xs text-slate-400">Applicant: {selectedReq.request_type} (User #{selectedReq.user_id})</p>
              </div>
              <button onClick={() => setSelectedReq(null)} className="text-slate-400 hover:text-white font-bold text-lg">✕</button>
            </div>

            {/* Documents List */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-slate-300 uppercase tracking-wider">Submitted Supporting Documents</h4>
              {selectedReq.documents && selectedReq.documents.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {selectedReq.documents.map((doc) => (
                    <a
                      key={doc.document_id}
                      href={doc.file_url}
                      target="_blank"
                      rel="noreferrer"
                      className="p-3 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between hover:border-sky-500 transition group"
                    >
                      <div className="flex items-center gap-2.5 overflow-hidden">
                        <FileText className="w-5 h-5 text-sky-400 shrink-0" />
                        <div className="truncate">
                          <p className="text-xs font-bold text-slate-200 truncate">{doc.document_type}</p>
                          <p className="text-[10px] text-slate-500">Uploaded: {new Date(doc.uploaded_at).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <Eye className="w-4 h-4 text-slate-400 group-hover:text-sky-400 shrink-0" />
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 italic">No document uploads found for this request.</p>
              )}
            </div>

            {/* Rejection Reasons Log if any */}
            {selectedReq.rejection_reasons && selectedReq.rejection_reasons.length > 0 && (
              <div className="p-3 bg-red-950/40 border border-red-500/50 rounded-lg text-xs space-y-1">
                <span className="font-bold text-red-400">Previous Rejection Notes:</span>
                {selectedReq.rejection_reasons.map((r) => (
                  <p key={r.reason_id} className="text-red-300">• {r.reason}</p>
                ))}
              </div>
            )}

            {/* Rejection Reason Input */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Rejection Reason / Reviewer Notes:</label>
              <textarea
                rows="3"
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Enter detailed reason if rejecting (e.g. Document unreadable, name mismatch...)"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-sky-500"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                onClick={() => setSelectedReq(null)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold text-xs rounded border border-black"
              >
                Cancel
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReview("REJECTED")}
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded border border-black flex items-center gap-1.5 disabled:opacity-50"
              >
                <XCircle className="w-4 h-4" /> Reject Request
              </button>
              <button
                disabled={actionLoading}
                onClick={() => handleReview("VERIFIED")}
                className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black flex items-center gap-1.5 disabled:opacity-50"
              >
                <CheckCircle2 className="w-4 h-4" /> Approve & Verify
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
