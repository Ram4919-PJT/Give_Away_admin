import React, { useState, useEffect } from "react";
import {
  Users,
  ShieldAlert,
  Building2,
  Landmark,
  ArrowUpRight,
  RefreshCw,
  ClipboardList,
} from "lucide-react";
import { adminApi } from "../api/adminClient";

function formatMoney(value) {
  return `₹${Number(value || 0).toLocaleString("en-IN")}`;
}

function typeStyles(type) {
  if (type === "NGO") return "bg-violet-500/15 text-violet-300";
  if (type === "DONOR") return "bg-emerald-500/15 text-emerald-300";
  return "bg-sky-500/15 text-sky-300";
}

export default function AdminDashboardPage({ onNavigate }) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    usersCount: 0,
    ngosCount: 0,
    pendingVerifications: 0,
    pendingAssistance: 0,
    pendingUsers: 0,
    totalMoneyDonated: 0,
    totalPoolBalance: 0,
    inventoryStockCount: 0,
    applicationsCount: 0,
  });
  const [recentRequests, setRecentRequests] = useState([]);
  const [recentAssistance, setRecentAssistance] = useState([]);
  const [fundPools, setFundPools] = useState([]);

  const loadDashboard = async () => {
    setLoading(true);
    try {
      const [users, ngos, verifications, moneyDons, pools, inventory, apps, assistanceQueue] = await Promise.all([
        adminApi.getUsers().catch(() => []),
        adminApi.getNgoProfiles().catch(() => []),
        adminApi.listAdminVerifications().catch(() => []),
        adminApi.getMoneyDonations().catch(() => []),
        adminApi.getFundPools().catch(() => []),
        adminApi.getInventory().catch(() => []),
        adminApi.getApplications().catch(() => []),
        adminApi.listAdminAssistanceQueue().catch(() => []),
      ]);

      const pending = verifications.filter(
        (v) => ["UNDER_REVIEW", "DOCUMENTS_SUBMITTED", "MORE_DOCUMENTS_REQUIRED"].includes(v.status)
      );
      const pendingAssistance = assistanceQueue.filter((a) =>
        ["SUBMITTED", "UNDER_REVIEW", "PENDING_REVIEW", "OPEN", "ACTION_REQUIRED"].includes(a.status),
      );
      const pendingUsers = users.filter((u) => u.status === "PENDING");
      const verifiedNgos = ngos.filter((n) => n.verification_status === "VERIFIED");

      setStats({
        usersCount: users.length,
        ngosCount: verifiedNgos.length,
        pendingUsers: pendingUsers.length,
        pendingVerifications: pending.length,
        pendingAssistance: pendingAssistance.length,
        totalMoneyDonated: moneyDons.reduce((acc, curr) => acc + (Number(curr.amount) || 0), 0),
        totalPoolBalance: pools.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0),
        inventoryStockCount: inventory.reduce((acc, curr) => acc + (Number(curr.quantity) || 0), 0),
        applicationsCount: apps.length,
      });
      setRecentRequests(pending.slice(0, 6));
      setRecentAssistance(pendingAssistance.slice(0, 5));
      setFundPools(pools.slice(0, 5));
    } catch (err) {
      console.error("Failed loading dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  const cards = [
    {
      label: "Pending KYC reviews",
      value: stats.pendingVerifications,
      hint: "Receiver, NGO, and donor identity",
      icon: ShieldAlert,
      tone: "text-amber-300 bg-amber-500/15",
      action: () => onNavigate?.("verification-receiver"),
      actionLabel: "Review KYC",
    },
    {
      label: "Pending money requests",
      value: stats.pendingAssistance,
      hint: `${stats.applicationsCount} total assistance records`,
      icon: ClipboardList,
      tone: "text-orange-300 bg-orange-500/15",
      action: () => onNavigate?.("assistance-pending"),
      actionLabel: "Review",
    },
    {
      label: "Fund balance",
      value: formatMoney(stats.totalPoolBalance),
      hint: `${formatMoney(stats.totalMoneyDonated)} donated`,
      icon: Landmark,
      tone: "text-emerald-300 bg-emerald-500/15",
      action: () => onNavigate?.("funds"),
      actionLabel: "Funds",
    },
    {
      label: "Verified NGOs",
      value: stats.ngosCount,
      hint: `${stats.usersCount} total users`,
      icon: Building2,
      tone: "text-sky-300 bg-sky-500/15",
      action: () => onNavigate?.("ngos"),
      actionLabel: "NGOs",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Overview</h2>
          <p className="text-sm text-slate-400 mt-1">
            Monitor approvals, funds, partners, and inventory from one place.
          </p>
        </div>
        <button
          onClick={loadDashboard}
          className="inline-flex items-center gap-2 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white text-sm font-medium rounded-lg"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {cards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="admin-card p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm text-slate-400">{card.label}</p>
                  <p className="text-2xl font-semibold text-white mt-2">{card.value}</p>
                </div>
                <div className={`p-2 rounded-lg ${card.tone}`}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between text-sm">
                <span className="text-slate-400">{card.hint}</span>
                <button
                  onClick={card.action}
                  className="text-sky-400 hover:text-sky-300 inline-flex items-center gap-1 font-medium"
                >
                  {card.actionLabel} <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Approval queue</h3>
              <p className="text-sm text-slate-400 mt-0.5">Latest donor, receiver, and NGO applications.</p>
            </div>
            <button
              onClick={() => onNavigate?.("verification-receiver")}
              className="text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {recentRequests.length === 0 ? (
              <p className="text-sm text-slate-500 py-10 text-center">No pending applications.</p>
            ) : (
              recentRequests.map((req) => (
                <div
                  key={req.request_id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`p-2 rounded-lg ${typeStyles(req.request_type)}`}>
                      {req.request_type === "NGO" ? <Building2 className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {req.request_type} application
                      </p>
                      <p className="text-xs text-slate-400">
                        #{req.request_id} · {new Date(req.submitted_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={req.status === "VERIFIED" ? "badge-verified" : req.status === "REJECTED" ? "badge-rejected" : "badge-review"}>
                      {req.status.replace("_", " ")}
                    </span>
                    <button
                      onClick={() => onNavigate?.("verification-receiver", { requestId: req.request_id })}
                      className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg"
                    >
                      Review
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-white">Money requests</h3>
              <p className="text-sm text-slate-400 mt-0.5">Awaiting admin review.</p>
            </div>
            <button
              onClick={() => onNavigate?.("assistance-pending")}
              className="text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              View all
            </button>
          </div>

          <div className="space-y-2.5">
            {recentAssistance.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No pending money requests.</p>
            ) : (
              recentAssistance.map((app) => (
                <div
                  key={app.application_id}
                  className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">
                      {app.receiver_name || `Receiver #${app.receiver_id}`}
                    </p>
                    <p className="text-xs text-slate-400">
                      #{app.application_id} · {formatMoney(app.amount_requested)}
                    </p>
                  </div>
                  <button
                    onClick={() => onNavigate?.("assistance", { applicationId: app.application_id })}
                    className="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-medium rounded-lg shrink-0"
                  >
                    Review
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="admin-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-semibold text-white">Fund pools</h3>
            <button
              onClick={() => onNavigate?.("funds")}
              className="text-sm font-medium text-sky-400 hover:text-sky-300"
            >
              Manage
            </button>
          </div>

          <div className="space-y-3">
            {fundPools.length === 0 ? (
              <p className="text-sm text-slate-500 py-8 text-center">No fund pools yet.</p>
            ) : (
              fundPools.map((pool) => (
                <div key={pool.pool_id} className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                  <div className="flex items-center justify-between gap-3">
                    <h4 className="text-sm font-medium text-white truncate">{pool.pool_name}</h4>
                    <span className="text-sm font-semibold text-emerald-400">
                      {formatMoney(pool.balance)}
                    </span>
                  </div>
                  <div className="w-full bg-slate-800 h-1.5 rounded-full mt-2.5 overflow-hidden">
                    <div
                      className="bg-sky-500 h-full rounded-full"
                      style={{ width: `${Math.min(100, (Number(pool.balance) / 200000) * 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
