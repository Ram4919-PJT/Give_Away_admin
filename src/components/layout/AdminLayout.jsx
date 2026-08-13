import React, { useState, useEffect } from "react";
import {
  LayoutDashboard,
  ShieldCheck,
  Users,
  Building2,
  HeartHandshake,
  Landmark,
  PackageSearch,
  FileCheck2,
  Bell,
  LogOut,
} from "lucide-react";
import { adminApi } from "../../api/adminClient";
import { useAdminAuth } from "../../auth/AuthContext";

const NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { id: "verification", label: "Approvals", icon: ShieldCheck },
  { id: "users", label: "Users", icon: Users },
  { id: "ngos", label: "NGOs", icon: Building2 },
  { id: "donations", label: "Donations", icon: HeartHandshake },
  { id: "funds", label: "Funds", icon: Landmark },
  { id: "inventory", label: "Inventory", icon: PackageSearch },
  { id: "audit", label: "Reports", icon: FileCheck2 },
  { id: "notifications", label: "Notifications", icon: Bell },
];

export default function AdminLayout({ activeTab, setActiveTab, children }) {
  const { admin, logout } = useAdminAuth();
  const [online, setOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);

  const loadStatus = async () => {
    try {
      await adminApi.getHealth();
      setOnline(true);
    } catch {
      setOnline(false);
    }
    try {
      const [requests, users] = await Promise.all([
        adminApi.getVerificationRequests().catch(() => []),
        adminApi.getUsers("PENDING").catch(() => []),
      ]);
      const pendingVerifications = requests.filter(
        (r) => r.status === "UNDER_REVIEW" || r.status === "SUBMITTED"
      ).length;
      setPendingCount(pendingVerifications + (Array.isArray(users) ? users.length : 0));
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 20000);
    return () => clearInterval(timer);
  }, []);

  const currentPage = NAV_ITEMS.find((item) => item.id === activeTab)?.label || "Dashboard";
  const initials = (admin?.full_name || "SA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="flex h-screen bg-[#0b1220] text-slate-100 overflow-hidden">
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">
            GA
          </div>
          <div>
            <h1 className="font-semibold text-base text-white tracking-tight">Give Away</h1>
            <p className="text-[11px] text-slate-400">Admin Console</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            const showBadge = item.id === "verification" && pendingCount > 0;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${
                  isActive
                    ? "bg-sky-600 text-white"
                    : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                }`}
              >
                <span className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  {item.label}
                </span>
                {showBadge && (
                  <span className={`px-1.5 min-w-[1.25rem] text-center text-[11px] font-semibold rounded-full ${
                    isActive ? "bg-white text-sky-700" : "bg-amber-400 text-slate-900"
                  }`}>
                    {pendingCount}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
          {online ? "System online" : "Connection issue"}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/90 px-6 flex items-center justify-between">
          <div>
            <p className="text-[11px] uppercase tracking-[0.14em] text-slate-500">Administration</p>
            <h2 className="text-lg font-semibold text-white leading-tight">{currentPage}</h2>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium text-white">{admin?.full_name || "Administrator"}</p>
              <p className="text-[11px] text-slate-400">{admin?.email}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-sky-600 flex items-center justify-center text-xs font-semibold text-white">
              {initials}
            </div>
            <button
              type="button"
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <LogOut className="w-3.5 h-3.5" />
              Sign out
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>
    </div>
  );
}
