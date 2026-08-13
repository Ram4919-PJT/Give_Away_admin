import React, { useState, useEffect } from "react";
import { Building2, Users, FileText, CheckCircle2, XCircle, RefreshCw } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function NgoManagementPage() {
  const [ngos, setNgos] = useState([]);
  const [itemRequests, setItemRequests] = useState([]);
  const [fundRequests, setFundRequests] = useState([]);
  const [beneficiaries, setBeneficiaries] = useState([]);
  const [activeSubTab, setActiveSubTab] = useState("directory");
  const [loading, setLoading] = useState(true);
  const [verifications, setVerifications] = useState([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [ngoData, itemData, fundData, benData, verData] = await Promise.all([
        adminApi.getNgoProfiles().catch(() => []),
        adminApi.getNgoItemRequests().catch(() => []),
        adminApi.getNgoFundRequests().catch(() => []),
        adminApi.getBeneficiaries().catch(() => []),
        adminApi.getVerificationRequests().catch(() => []),
      ]);
      setNgos(ngoData);
      setItemRequests(itemData);
      setFundRequests(fundData);
      setBeneficiaries(benData);
      setVerifications(verData);
    } catch (err) {
      console.error("Failed loading NGO data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewItemReq = async (id, status) => {
    try {
      await adminApi.reviewNgoItemRequest(id, status);
      await loadData();
    } catch (err) {
      alert("Failed updating item request: " + err.message);
    }
  };

  const handleReviewFundReq = async (id, status) => {
    try {
      await adminApi.reviewNgoFundRequest(id, status);
      await loadData();
    } catch (err) {
      alert("Failed updating fund request: " + err.message);
    }
  };

  const findNgoVerification = (userId) =>
    verifications.find(
      (v) => v.user_id === userId && v.request_type === "NGO" && ["SUBMITTED", "UNDER_REVIEW"].includes(v.status)
    );

  const handleApproveNgo = async (ngo) => {
    try {
      const req = findNgoVerification(ngo.user_id);
      await adminApi.approveAccount(ngo.user_id, req?.request_id);
      await loadData();
    } catch (err) {
      alert("Failed approving NGO: " + err.message);
    }
  };

  const handleRejectNgo = async (ngo) => {
    const reason = window.prompt("Rejection reason:", "") ?? "";
    try {
      const req = findNgoVerification(ngo.user_id);
      await adminApi.rejectAccount(ngo.user_id, req?.request_id, reason);
      await loadData();
    } catch (err) {
      alert("Failed rejecting NGO: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-purple-400" /> NGOs
          </h2>
          <p className="text-sm text-slate-400 mt-1">Review partners, beneficiaries, item requests, and fund requests.</p>
        </div>
        <button
          onClick={loadData}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh NGO Data
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "directory", label: `NGO Directory (${ngos.length})` },
          { id: "itemRequests", label: `Item Requests (${itemRequests.length})` },
          { id: "fundRequests", label: `Fund Requests (${fundRequests.length})` },
          { id: "beneficiaries", label: `Beneficiaries (${beneficiaries.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSubTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition border border-slate-800 ${
              activeSubTab === tab.id ? "bg-purple-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Directory Tab */}
      {activeSubTab === "directory" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">NGO ID</th>
                  <th className="p-4">NGO Name</th>
                  <th className="p-4">Reg Number</th>
                  <th className="p-4">Contact Person</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Verification Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {ngos.map((n) => (
                  <tr key={n.ngo_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-purple-400">#{n.ngo_id}</td>
                    <td className="p-4 font-bold text-white">{n.ngo_name}</td>
                    <td className="p-4 font-mono text-slate-300">{n.registration_number}</td>
                    <td className="p-4 text-slate-300">{n.contact_person}</td>
                    <td className="p-4 text-slate-400 font-mono">{n.mobile}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        n.verification_status === "VERIFIED" ? "badge-verified" : n.verification_status === "REJECTED" ? "badge-rejected" : "badge-review"
                      }`}>
                        {n.verification_status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {n.verification_status === "VERIFIED" || n.verification_status === "REJECTED" ? (
                        <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                      ) : (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleApproveNgo(n)}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectNgo(n)}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded border border-black"
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Requests Tab */}
      {activeSubTab === "itemRequests" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Req ID</th>
                  <th className="p-4">NGO ID</th>
                  <th className="p-4">Item Category</th>
                  <th className="p-4">Quantity Requested</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {itemRequests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{r.request_id}</td>
                    <td className="p-4 font-bold text-white">NGO #{r.ngo_id}</td>
                    <td className="p-4 font-bold text-slate-200">{r.item_category}</td>
                    <td className="p-4 font-bold text-purple-400">{r.quantity_requested} Units</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        r.status === "APPROVED" ? "badge-verified" : r.status === "REJECTED" ? "badge-rejected" : "badge-review"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.status === "SUBMITTED" || r.status === "UNDER_REVIEW" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReviewItemReq(r.request_id, "APPROVED")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewItemReq(r.request_id, "REJECTED")}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded border border-black"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Fund Requests Tab */}
      {activeSubTab === "fundRequests" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Req ID</th>
                  <th className="p-4">NGO ID</th>
                  <th className="p-4">Amount Requested</th>
                  <th className="p-4">Purpose</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {fundRequests.map((r) => (
                  <tr key={r.request_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{r.request_id}</td>
                    <td className="p-4 font-bold text-white">NGO #{r.ngo_id}</td>
                    <td className="p-4 font-black text-emerald-400">₹{Number(r.amount_requested).toLocaleString("en-IN")}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{r.purpose}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        r.status === "APPROVED" ? "badge-verified" : r.status === "REJECTED" ? "badge-rejected" : "badge-review"
                      }`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {r.status === "SUBMITTED" || r.status === "UNDER_REVIEW" ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReviewFundReq(r.request_id, "APPROVED")}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReviewFundReq(r.request_id, "REJECTED")}
                            className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded border border-black"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Reviewed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Beneficiaries Tab */}
      {activeSubTab === "beneficiaries" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">ID</th>
                  <th className="p-4">NGO ID</th>
                  <th className="p-4">Beneficiary Name</th>
                  <th className="p-4">Age</th>
                  <th className="p-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {beneficiaries.map((b) => (
                  <tr key={b.beneficiary_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{b.beneficiary_id}</td>
                    <td className="p-4 font-bold text-purple-400">NGO #{b.ngo_id}</td>
                    <td className="p-4 font-bold text-white">{b.name}</td>
                    <td className="p-4 text-slate-300 font-bold">{b.age} Yrs</td>
                    <td className="p-4 text-slate-400 max-w-sm">{b.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
