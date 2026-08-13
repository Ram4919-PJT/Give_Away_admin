import React, { useState, useEffect } from "react";
import { Landmark, Plus, ArrowUpRight, ArrowDownLeft, RefreshCw, DollarSign } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function FundLedgerPage() {
  const [pools, setPools] = useState([]);
  const [ledger, setLedger] = useState([]);
  const [disbursements, setDisbursements] = useState([]);
  const [loading, setLoading] = useState(true);

  // New Pool Modal State
  const [showPoolModal, setShowPoolModal] = useState(false);
  const [poolName, setPoolName] = useState("");
  const [initialBalance, setInitialBalance] = useState(0);

  // New Ledger Entry Modal State
  const [showLedgerModal, setShowLedgerModal] = useState(false);
  const [selectedPoolId, setSelectedPoolId] = useState("");
  const [transType, setTransType] = useState("CREDIT");
  const [amount, setAmount] = useState("");

  const loadFundData = async () => {
    setLoading(true);
    try {
      const [poolData, ledgerData, disbData] = await Promise.all([
        adminApi.getFundPools().catch(() => []),
        adminApi.getFundLedger().catch(() => []),
        adminApi.getDisbursements().catch(() => []),
      ]);
      setPools(poolData);
      setLedger(ledgerData);
      setDisbursements(disbData);
      if (poolData.length > 0) setSelectedPoolId(poolData[0].pool_id);
    } catch (err) {
      console.error("Failed loading fund data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFundData();
  }, []);

  const handleCreatePool = async (e) => {
    e.preventDefault();
    if (!poolName.trim()) return;
    try {
      await adminApi.createFundPool(poolName, Number(initialBalance) || 0);
      setShowPoolModal(false);
      setPoolName("");
      setInitialBalance(0);
      await loadFundData();
    } catch (err) {
      alert("Failed creating fund pool: " + err.message);
    }
  };

  const handleAddLedger = async (e) => {
    e.preventDefault();
    if (!selectedPoolId || !amount) return;
    try {
      await adminApi.addLedgerTransaction(Number(selectedPoolId), transType, Number(amount));
      setShowLedgerModal(false);
      setAmount("");
      await loadFundData();
    } catch (err) {
      alert("Failed adding ledger transaction: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <Landmark className="w-6 h-6 text-emerald-400" /> Funds
          </h2>
          <p className="text-sm text-slate-400 mt-1">Manage pools, ledger entries, and disbursements.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowPoolModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Create Pool
          </button>
          <button
            onClick={() => setShowLedgerModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Record Transaction
          </button>
        </div>
      </div>

      {/* Pools Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {pools.map((p) => (
          <div key={p.pool_id} className="admin-card p-5 space-y-2">
            <span className="text-[10px] font-extrabold text-sky-400 uppercase tracking-widest">Pool #{p.pool_id}</span>
            <h3 className="text-base font-bold text-white truncate">{p.pool_name}</h3>
            <p className="text-2xl font-black text-emerald-400">₹{Number(p.balance).toLocaleString("en-IN")}</p>
          </div>
        ))}
      </div>

      {/* Ledger Table */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">Financial Ledger Transactions</h3>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Ledger ID</th>
                  <th className="p-4">Pool ID</th>
                  <th className="p-4">Transaction Type</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Transaction Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {ledger.map((l) => (
                  <tr key={l.ledger_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{l.ledger_id}</td>
                    <td className="p-4 font-bold text-white">Pool #{l.pool_id}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        l.transaction_type === "CREDIT" ? "badge-verified" : "badge-rejected"
                      }`}>
                        {l.transaction_type}
                      </span>
                    </td>
                    <td className={`p-4 font-black ${l.transaction_type === "CREDIT" ? "text-emerald-400" : "text-red-400"}`}>
                      {l.transaction_type === "CREDIT" ? "+" : "-"}₹{Number(l.amount).toLocaleString("en-IN")}
                    </td>
                    <td className="p-4 text-slate-400">{new Date(l.transaction_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Pool Modal */}
      {showPoolModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleCreatePool} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Create New Fund Pool</h3>
              <button type="button" onClick={() => setShowPoolModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Pool Name:</label>
              <input
                type="text"
                required
                value={poolName}
                onChange={(e) => setPoolName(e.target.value)}
                placeholder="e.g. Disaster Relief Pool"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Initial Balance (₹):</label>
              <input
                type="number"
                value={initialBalance}
                onChange={(e) => setInitialBalance(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button type="button" onClick={() => setShowPoolModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded border border-black">Create Fund Pool</button>
            </div>
          </form>
        </div>
      )}

      {/* Record Ledger Modal */}
      {showLedgerModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddLedger} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Record Ledger Transaction</h3>
              <button type="button" onClick={() => setShowLedgerModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target Fund Pool:</label>
              <select
                value={selectedPoolId}
                onChange={(e) => setSelectedPoolId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {pools.map((p) => (
                  <option key={p.pool_id} value={p.pool_id}>
                    {p.pool_name} (Current: ₹{p.balance})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Transaction Type:</label>
              <select
                value={transType}
                onChange={(e) => setTransType(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                <option value="CREDIT">CREDIT (Add Funds)</option>
                <option value="DEBIT">DEBIT (Withdraw / Disburse)</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Amount (₹):</label>
              <input
                type="number"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button type="button" onClick={() => setShowLedgerModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded border border-black">Submit Ledger Entry</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
