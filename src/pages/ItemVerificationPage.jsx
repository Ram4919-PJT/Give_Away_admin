import React, { useEffect, useState } from "react";
import { Package, RefreshCw } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function ItemVerificationPage({ highlightItemId = null }) {
  const [queue, setQueue] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const loadQueue = async () => {
    setLoading(true);
    try {
      const data = await adminApi.listAdminItemQueue();
      setQueue(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setQueue([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadQueue(); }, []);

  useEffect(() => {
    if (!highlightItemId || !queue.length) return;
    const match = queue.find((i) => String(i.item_donation_id) === String(highlightItemId));
    if (match) openDetail(match.item_donation_id);
  }, [highlightItemId, queue]);

  const openDetail = async (id) => {
    try {
      setSelected(await adminApi.getAdminItemDetail(id));
      setReason("");
    } catch (err) {
      alert(err.message || "Could not load item");
    }
  };

  const review = async (action) => {
    if (!selected) return;
    if (action === "reject" && !reason.trim()) {
      alert("Rejection reason required");
      return;
    }
    setBusy(true);
    try {
      await adminApi.reviewAdminItem(selected.item_donation_id, {
        action,
        rejection_reason: action === "reject" ? reason.trim() : undefined,
      });
      setSelected(null);
      await loadQueue();
    } catch (err) {
      alert(err.message || "Review failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2"><Package className="w-6 h-6 text-sky-400" /> Item Verification</h2>
          <p className="text-sm text-slate-400 mt-1">Review donor item donations before they become available to receivers.</p>
        </div>
        <button type="button" onClick={loadQueue} className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg"><RefreshCw className={`inline w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh</button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-xs">
          <thead><tr className="bg-slate-950 text-slate-400 uppercase text-[11px]"><th className="p-4 text-left">Item</th><th className="p-4 text-left">Category</th><th className="p-4 text-left">Status</th><th className="p-4 text-right">Action</th></tr></thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? <tr><td colSpan={4} className="p-8 text-center text-slate-500">Loading…</td></tr>
              : queue.map((row) => (
                <tr key={row.item_donation_id}>
                  <td className="p-4 text-white">{row.item_name || `Item #${row.item_donation_id}`}</td>
                  <td className="p-4">{row.category}</td>
                  <td className="p-4"><span className="badge-review">{row.status}</span></td>
                  <td className="p-4 text-right"><button type="button" onClick={() => openDetail(row.item_donation_id)} className="px-3 py-1 bg-sky-600 text-white rounded font-bold">Review</button></td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {selected && (
        <div className="admin-card p-5 space-y-4">
          <h3 className="text-white font-bold">{selected.item_name}</h3>
          <p className="text-slate-400 text-xs">Status: {selected.status}</p>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Rejection / change reason" className="w-full bg-slate-950 border border-slate-800 rounded p-3 text-xs text-slate-200 min-h-[80px]" />
          <div className="flex gap-2">
            <button type="button" disabled={busy} onClick={() => review("approve")} className="px-4 py-2 bg-emerald-600 text-white rounded text-xs font-bold">Approve Item</button>
            <button type="button" disabled={busy} onClick={() => review("reject")} className="px-4 py-2 bg-red-700 text-white rounded text-xs font-bold">Reject Item</button>
            <button type="button" onClick={() => setSelected(null)} className="px-4 py-2 bg-slate-700 text-white rounded text-xs font-bold">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
