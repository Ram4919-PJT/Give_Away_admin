import React, { useEffect, useState } from "react";
import { Layers, RefreshCw } from "lucide-react";
import { adminApi } from "../api/adminClient";
import StatusBadge from "../components/shared/StatusBadge";

export default function ProgramsPage() {
  const [programs, setPrograms] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getPrograms();
      setPrograms(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setPrograms([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-sky-400" /> Programs & Campaigns
          </h2>
          <p className="text-sm text-slate-400 mt-1">NGO programs and campaigns registered on the platform.</p>
        </div>
        <button
          type="button"
          onClick={load}
          className="px-4 py-2 bg-sky-600 text-white text-xs font-bold rounded-lg"
        >
          <RefreshCw className={`inline w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
        </button>
      </div>

      <div className="admin-card overflow-hidden">
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-slate-950 text-slate-400 uppercase text-[11px]">
              <th className="p-4 text-left">Program</th>
              <th className="p-4 text-left">NGO</th>
              <th className="p-4 text-left">Category</th>
              <th className="p-4 text-left">Status</th>
              <th className="p-4 text-left">Created</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {loading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">Loading programs…</td>
              </tr>
            ) : !programs.length ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-slate-500">No programs found.</td>
              </tr>
            ) : (
              programs.map((p) => (
                <tr key={p.program_id || p.id} className="hover:bg-slate-800/40">
                  <td className="p-4 text-white font-medium">{p.program_name || p.title || "—"}</td>
                  <td className="p-4 text-slate-300">{p.ngo_name || p.ngo_id || "—"}</td>
                  <td className="p-4 text-slate-300">{p.category?.replace(/_/g, " ") || "—"}</td>
                  <td className="p-4">
                    <StatusBadge status={p.status || "ACTIVE"} />
                  </td>
                  <td className="p-4 text-slate-400">
                    {p.created_at ? new Date(p.created_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
