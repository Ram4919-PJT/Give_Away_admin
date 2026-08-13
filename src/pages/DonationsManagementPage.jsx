import React, { useState, useEffect } from "react";
import { HeartHandshake, Calendar, Clock, RefreshCw, CheckCircle2, Truck } from "lucide-react";
import { adminApi } from "../api/adminClient";

export default function DonationsManagementPage() {
  const [moneyDons, setMoneyDons] = useState([]);
  const [itemDons, setItemDons] = useState([]);
  const [pickupSchedules, setPickupSchedules] = useState([]);
  const [activeTab, setActiveTab] = useState("money");
  const [loading, setLoading] = useState(true);

  // Pickup Scheduling Modal State
  const [selectedItemDon, setSelectedItemDon] = useState(null);
  const [pickupDate, setPickupDate] = useState("");
  const [pickupTime, setPickupTime] = useState("10:00:00");
  const [schedLoading, setSchedLoading] = useState(false);

  const loadDonations = async () => {
    setLoading(true);
    try {
      const [moneyData, itemData, schedData] = await Promise.all([
        adminApi.getMoneyDonations().catch(() => []),
        adminApi.getItemDonations().catch(() => []),
        adminApi.getPickupSchedules().catch(() => []),
      ]);
      setMoneyDons(moneyData);
      setItemDons(itemData);
      setPickupSchedules(schedData);
    } catch (err) {
      console.error("Failed loading donations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDonations();
  }, []);

  const handleSchedulePickupSubmit = async (e) => {
    e.preventDefault();
    if (!selectedItemDon || !pickupDate) return;

    setSchedLoading(true);
    try {
      await adminApi.schedulePickup(selectedItemDon.item_donation_id, pickupDate, pickupTime);
      setSelectedItemDon(null);
      setPickupDate("");
      await loadDonations();
    } catch (err) {
      alert("Failed scheduling pickup: " + err.message);
    } finally {
      setSchedLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900 p-5 rounded-xl border border-slate-800">
        <div>
          <h2 className="text-2xl font-semibold text-white flex items-center gap-2">
            <HeartHandshake className="w-6 h-6 text-sky-400" /> Donations
          </h2>
          <p className="text-sm text-slate-400 mt-1">Track money and item donations, and schedule pickups.</p>
        </div>
        <button
          onClick={loadDonations}
          className="flex items-center gap-2 px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-lg border border-slate-800 transition"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh Donations
        </button>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2 border-b border-slate-800 pb-3">
        {[
          { id: "money", label: `Money Donations (${moneyDons.length})` },
          { id: "items", label: `Item Donations (${itemDons.length})` },
          { id: "pickups", label: `Pickup Schedules (${pickupSchedules.length})` },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition border border-slate-800 ${
              activeTab === tab.id ? "bg-sky-600 text-white" : "bg-slate-900 text-slate-400 hover:text-white"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Money Donations */}
      {activeTab === "money" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Donation ID</th>
                  <th className="p-4">Donor ID</th>
                  <th className="p-4">Program ID</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Payment Status</th>
                  <th className="p-4">Donated Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {moneyDons.map((d) => (
                  <tr key={d.donation_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{d.donation_id}</td>
                    <td className="p-4 font-bold text-white">Donor #{d.donor_id}</td>
                    <td className="p-4 font-mono text-slate-300">Program #{d.program_id}</td>
                    <td className="p-4 font-black text-emerald-400">₹{Number(d.amount).toLocaleString("en-IN")}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        d.payment_status === "CONFIRMED" ? "badge-verified" : "badge-review"
                      }`}>
                        {d.payment_status}
                      </span>
                    </td>
                    <td className="p-4 text-slate-400">{new Date(d.donated_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Item Donations */}
      {activeTab === "items" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Item ID</th>
                  <th className="p-4">Donor ID</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Quantity</th>
                  <th className="p-4">Status</th>
                  <th className="p-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {itemDons.map((item) => (
                  <tr key={item.item_donation_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{item.item_donation_id}</td>
                    <td className="p-4 font-bold text-white">Donor #{item.donor_id}</td>
                    <td className="p-4 font-bold text-purple-400">{item.category}</td>
                    <td className="p-4 text-slate-300 max-w-xs truncate">{item.description}</td>
                    <td className="p-4 font-bold text-slate-200">{item.quantity} Units</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        item.status === "RECEIVED" ? "badge-verified" : "badge-review"
                      }`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      {item.status === "LISTED" ? (
                        <button
                          onClick={() => setSelectedItemDon(item)}
                          className="px-3.5 py-1.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded border border-black flex items-center gap-1.5 ml-auto"
                        >
                          <Truck className="w-3.5 h-3.5" /> Schedule Pickup
                        </button>
                      ) : (
                        <span className="text-[11px] text-slate-500 italic">Pickup Assigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pickup Schedules */}
      {activeTab === "pickups" && (
        <div className="admin-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950 text-slate-400 text-[11px] uppercase font-extrabold border-b border-slate-800">
                  <th className="p-4">Pickup ID</th>
                  <th className="p-4">Item Donation ID</th>
                  <th className="p-4">Pickup Date</th>
                  <th className="p-4">Pickup Time</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-xs">
                {pickupSchedules.map((p) => (
                  <tr key={p.pickup_id} className="hover:bg-slate-800/40 transition">
                    <td className="p-4 font-black text-sky-400">#{p.pickup_id}</td>
                    <td className="p-4 font-bold text-white">Item #{p.item_donation_id}</td>
                    <td className="p-4 font-bold text-slate-200">{p.pickup_date}</td>
                    <td className="p-4 text-slate-300 font-mono">{p.pickup_time}</td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full ${
                        p.status === "COMPLETED" ? "badge-verified" : "badge-review"
                      }`}>
                        {p.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Schedule Pickup Modal */}
      {selectedItemDon && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSchedulePickupSubmit} className="bg-slate-900 border border-slate-800 rounded-xl max-w-md w-full p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-black text-white">Schedule Warehouse Pickup</h3>
              <button type="button" onClick={() => setSelectedItemDon(null)} className="text-slate-400 hover:text-white font-bold">✕</button>
            </div>

            <div className="p-3 bg-slate-950 border border-black rounded-lg text-xs space-y-1">
              <p className="font-bold text-white">Item Donation #{selectedItemDon.item_donation_id}</p>
              <p className="text-slate-400">Category: {selectedItemDon.category} ({selectedItemDon.quantity} Units)</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Pickup Date:</label>
              <input
                type="date"
                required
                value={pickupDate}
                onChange={(e) => setPickupDate(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-300">Pickup Time Slot:</label>
              <input
                type="time"
                required
                value={pickupTime}
                onChange={(e) => setPickupTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-slate-200 focus:outline-none focus:border-sky-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t-2 border-black">
              <button
                type="button"
                onClick={() => setSelectedItemDon(null)}
                className="px-4 py-2 bg-slate-800 text-slate-300 font-bold text-xs rounded border border-black"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={schedLoading}
                className="px-5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded border border-black disabled:opacity-50"
              >
                Confirm Pickup Schedule
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
