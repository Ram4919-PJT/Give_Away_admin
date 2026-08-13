import React, { useState, useEffect } from "react";
import { FileCheck2, RefreshCw } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function ReportsAuditPage() {
  const [activeTab, setActiveTab] = useState("trail");
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadAuditData = async () => {
    setLoading(true);
    try {
      const [vData, userData] = await Promise.all([
        adminApi.getVerificationRequests().catch(() => []),
        adminApi.getUsers().catch(() => []),
      ]);
      setVerificationRequests(vData);
      setUsers(userData);
    } catch (err) {
      console.error("Failed loading audit data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditData();
  }, []);

  const verified = verificationRequests.filter((v) => v.status === "VERIFIED").length;
  const rejected = verificationRequests.filter((v) => v.status === "REJECTED").length;
  const pending = verificationRequests.filter((v) => v.status === "UNDER_REVIEW" || v.status === "SUBMITTED").length;
  const activeUsers = users.filter((u) => u.status === "ACTIVE").length;
  const pendingUsers = users.filter((u) => u.status === "PENDING").length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-emerald-400" /> Reports
          </h2>
          <p className="text-sm text-slate-400 mt-1">Track approvals and account activity across the platform.</p>
        </div>
        <button
          onClick={loadAuditData}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="flex gap-2">
        {[
          { id: "trail", label: "Approval trail" },
          { id: "summary", label: "Summary" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition border ${
              activeTab === tab.id
                ? "bg-emerald-600 text-white border-emerald-500"
                : "bg-slate-900 text-slate-400 border-slate-800 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "trail" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/70 text-slate-400 text-[11px] uppercase tracking-wide font-semibold border-b border-slate-800">
                  <th className="p-4">ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">User</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Submitted</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm">
                {verificationRequests.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      No approval history yet.
                    </td>
                  </tr>
                ) : (
                  verificationRequests.map((v) => (
                    <tr key={v.request_id} className="hover:bg-slate-800/30">
                      <td className="p-4 font-semibold text-sky-400">#{v.request_id}</td>
                      <td className="p-4 text-white">{v.request_type}</td>
                      <td className="p-4 text-slate-300">#{v.user_id}</td>
                      <td className="p-4">
                        <span
                          className={
                            v.status === "VERIFIED"
                              ? "badge-verified"
                              : v.status === "REJECTED"
                                ? "badge-rejected"
                                : "badge-review"
                          }
                        >
                          {v.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400">{new Date(v.submitted_at).toLocaleString()}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === "summary" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="admin-card p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">Approvals</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-2xl font-semibold text-amber-300">{pending}</p>
                <p className="text-xs text-slate-400 mt-1">Pending</p>
              </div>
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-2xl font-semibold text-emerald-300">{verified}</p>
                <p className="text-xs text-slate-400 mt-1">Approved</p>
              </div>
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-2xl font-semibold text-rose-300">{rejected}</p>
                <p className="text-xs text-slate-400 mt-1">Rejected</p>
              </div>
            </div>
          </div>

          <div className="admin-card p-5 space-y-4">
            <h3 className="text-base font-semibold text-white">Accounts</h3>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-2xl font-semibold text-white">{users.length}</p>
                <p className="text-xs text-slate-400 mt-1">Total</p>
              </div>
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-2xl font-semibold text-emerald-300">{activeUsers}</p>
                <p className="text-xs text-slate-400 mt-1">Active</p>
              </div>
              <div className="rounded-xl bg-slate-950/60 border border-slate-800 p-4">
                <p className="text-2xl font-semibold text-amber-300">{pendingUsers}</p>
                <p className="text-xs text-slate-400 mt-1">Pending</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
