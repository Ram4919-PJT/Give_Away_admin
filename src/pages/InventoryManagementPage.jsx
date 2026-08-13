import React, { useState, useEffect } from "react";
import { PackageSearch, Plus, ArrowLeftRight, RefreshCw, CheckCircle2, AlertTriangle } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function InventoryManagementPage() {
  const [inventory, setInventory] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [ngoItemRequests, setNgoItemRequests] = useState([]);
  const [loading, setLoading] = useState(true);

  // Add Item Modal
  const [showAddModal, setShowAddModal] = useState(false);
  const [category, setCategory] = useState("Clothing");
  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");

  // Allocate Item Modal
  const [showAllocateModal, setShowAllocateModal] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState("");
  const [selectedNgoReqId, setSelectedNgoReqId] = useState("");
  const [allocQuantity, setAllocQuantity] = useState("");

  const loadInventoryData = async () => {
    setLoading(true);
    try {
      const [invData, txData, reqData] = await Promise.all([
        adminApi.getInventory().catch(() => []),
        adminApi.getInventoryTransactions().catch(() => []),
        adminApi.getNgoItemRequests().catch(() => []),
      ]);
      setInventory(invData);
      setTransactions(txData);
      const approvedReqs = reqData.filter((r) => r.status === "APPROVED");
      setNgoItemRequests(approvedReqs);

      if (invData.length > 0) setSelectedItemId(invData[0].item_id);
      if (approvedReqs.length > 0) setSelectedNgoReqId(approvedReqs[0].request_id);
    } catch (err) {
      console.error("Failed loading inventory:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInventoryData();
  }, []);

  const handleAddItem = async (e) => {
    e.preventDefault();
    if (!description.trim() || !quantity) return;
    try {
      await adminApi.addInventoryItem(category, description, Number(quantity));
      setShowAddModal(false);
      setDescription("");
      setQuantity("");
      await loadInventoryData();
    } catch (err) {
      alert("Failed adding inventory: " + err.message);
    }
  };

  const handleAllocate = async (e) => {
    e.preventDefault();
    if (!selectedItemId || !selectedNgoReqId || !allocQuantity) return;
    try {
      await adminApi.allocateStock(Number(selectedNgoReqId), Number(selectedItemId), Number(allocQuantity));
      setShowAllocateModal(false);
      setAllocQuantity("");
      await loadInventoryData();
    } catch (err) {
      alert("Failed allocating stock: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <PackageSearch className="w-6 h-6 text-indigo-400" /> Inventory
          </h2>
          <p className="text-sm text-slate-400 mt-1">Track stock and allocate items to approved NGO requests.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
          >
            <Plus className="w-4 h-4" /> Add Stock Item
          </button>
          <button
            onClick={() => setShowAllocateModal(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
          >
            <ArrowLeftRight className="w-4 h-4" /> Allocate to NGO
          </button>
        </div>
      </div>

      {/* Stock Items Grid */}
      <div className="admin-card overflow-hidden">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h3 className="font-bold text-sm text-white">Current Warehouse Stock Levels</h3>
          <button onClick={loadInventoryData} className="text-xs font-bold text-sky-400 hover:underline flex items-center gap-1">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                <th className="p-4">Item ID</th>
                <th className="p-4">Category</th>
                <th className="p-4">Description</th>
                <th className="p-4">Stock Quantity</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-xs">
              {inventory.map((item) => (
                <tr key={item.item_id} className="hover:bg-slate-800/40 transition">
                  <td className="p-4 font-black text-sky-400">#{item.item_id}</td>
                  <td className="p-4 font-bold text-purple-400">{item.category}</td>
                  <td className="p-4 text-slate-200 font-medium">{item.description}</td>
                  <td className="p-4 font-black text-white">{item.quantity} Units</td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                      item.status === "IN_STOCK" ? "badge-verified" : "badge-rejected"
                    }`}>
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Transactions Log */}
      <div className="space-y-3">
        <h3 className="text-base font-bold text-white">Stock Movement Transactions Log</h3>
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Tx ID</th>
                  <th className="p-4">Item ID</th>
                  <th className="p-4">Type</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {transactions.map((tx) => (
                  <tr key={tx.transaction_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{tx.transaction_id}</td>
                    <td className="p-4 font-bold text-white">Item #{tx.item_id}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        tx.transaction_type === "IN" ? "badge-verified" : "badge-review"
                      }`}>
                        STOCK {tx.transaction_type}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-200">{tx.quantity} Units</td>
                    <td className="p-4 text-slate-400">{new Date(tx.transaction_date).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddItem} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Add New Warehouse Item Stock</h3>
              <button type="button" onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Item Category:</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {["Clothing", "Electronics", "Medical Supplies", "Books", "Food Packs", "Furniture", "Toys", "Blankets", "Footwear", "Utensils"].map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Description:</label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Primary Textbooks Set"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Stock Quantity:</label>
              <input
                type="number"
                required
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                placeholder="Number of units..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs rounded border border-black">Add Stock</button>
            </div>
          </form>
        </div>
      )}

      {/* Allocate Modal */}
      {showAllocateModal && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAllocate} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Allocate Stock to Approved NGO Request</h3>
              <button type="button" onClick={() => setShowAllocateModal(false)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Select Stock Item:</label>
              <select
                value={selectedItemId}
                onChange={(e) => setSelectedItemId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {inventory.map((item) => (
                  <option key={item.item_id} value={item.item_id}>
                    Item #{item.item_id} — {item.description} (Stock: {item.quantity})
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Target Approved NGO Item Request:</label>
              <select
                value={selectedNgoReqId}
                onChange={(e) => setSelectedNgoReqId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              >
                {ngoItemRequests.length === 0 ? (
                  <option value="">No approved NGO item requests available</option>
                ) : (
                  ngoItemRequests.map((req) => (
                    <option key={req.request_id} value={req.request_id}>
                      Req #{req.request_id} — NGO #{req.ngo_id} ({req.item_category}: {req.quantity_requested} Units)
                    </option>
                  ))
                )}
              </select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Quantity to Allocate:</label>
              <input
                type="number"
                required
                value={allocQuantity}
                onChange={(e) => setAllocQuantity(e.target.value)}
                placeholder="Number of units..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button type="button" onClick={() => setShowAllocateModal(false)} className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black">Cancel</button>
              <button type="submit" className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded border border-black">Allocate Item</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
