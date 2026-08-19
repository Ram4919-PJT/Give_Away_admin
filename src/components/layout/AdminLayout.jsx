import React, { useState, useEffect, useMemo } from "react";
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
  ChevronDown,
  ChevronRight,
  Settings,
  Layers,
} from "lucide-react";
import { adminApi } from "../../api/adminClient";
import { useAdminAuth } from "../../auth/AuthContext";

const NAV_STRUCTURE = [
  { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  {
    id: "users-group",
    label: "Users",
    icon: Users,
    children: [
      { id: "users", label: "All Users" },
      { id: "users-receivers", label: "Receivers" },
      { id: "users-ngos", label: "NGOs" },
      { id: "users-donors", label: "Donors" },
    ],
  },
  {
    id: "verification-group",
    label: "Verification",
    icon: ShieldCheck,
    badgeKey: "kyc",
    children: [
      { id: "verification-receiver", label: "Receiver KYC" },
      { id: "verification-ngo", label: "NGO KYC" },
      { id: "verification-donor", label: "Donor KYC" },
    ],
  },
  {
    id: "assistance-group",
    label: "Assistance",
    icon: FileCheck2,
    badgeKey: "assistance",
    children: [
      { id: "assistance", label: "Money Requests" },
      { id: "assistance-pending", label: "Pending Review" },
      { id: "assistance-approved", label: "Approved" },
      { id: "assistance-rejected", label: "Rejected" },
      { id: "assistance-more-info", label: "More Information Required" },
    ],
  },
  { id: "programs", label: "Programs", icon: Layers },
  { id: "donations", label: "Donations", icon: HeartHandshake },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "audit", label: "Audit / Activity", icon: FileCheck2 },
  { id: "settings", label: "Settings", icon: Settings },
];

const SECONDARY_NAV = [
  { id: "items", label: "Item Verification", icon: PackageSearch },
  { id: "ngos", label: "NGO Profiles", icon: Building2 },
  { id: "funds", label: "Funds", icon: Landmark },
  { id: "inventory", label: "Inventory", icon: PackageSearch },
];

function findLabel(tabId) {
  for (const item of NAV_STRUCTURE) {
    if (item.id === tabId) return item.label;
    if (item.children) {
      const child = item.children.find((c) => c.id === tabId);
      if (child) return child.label;
    }
  }
  const sec = SECONDARY_NAV.find((s) => s.id === tabId);
  return sec?.label || "Dashboard";
}

function isInGroup(tabId, group) {
  if (group.children) return group.children.some((c) => c.id === tabId);
  return group.id === tabId;
}

export default function AdminLayout({ activeTab, setActiveTab, children }) {
  const { admin, logout } = useAdminAuth();
  const [online, setOnline] = useState(true);
  const [pendingKyc, setPendingKyc] = useState(0);
  const [pendingAssistance, setPendingAssistance] = useState(0);
  const [expanded, setExpanded] = useState(() => {
    const init = {};
    NAV_STRUCTURE.forEach((g) => {
      if (g.children) init[g.id] = isInGroup(activeTab, g);
    });
    return init;
  });

  const loadStatus = async () => {
    try {
      await adminApi.getHealth();
      setOnline(true);
    } catch {
      setOnline(false);
    }
    try {
      const requests = await adminApi.listAdminVerifications().catch(() => []);
      const pendingVerifications = Array.isArray(requests)
        ? requests.filter((r) =>
            ["UNDER_REVIEW", "DOCUMENTS_SUBMITTED", "MORE_DOCUMENTS_REQUIRED"].includes(r.status),
          ).length
        : 0;
      setPendingKyc(pendingVerifications);
    } catch {
      /* ignore */
    }
    try {
      const apps = await adminApi.listAdminAssistanceQueue().catch(() => []);
      const pending = Array.isArray(apps)
        ? apps.filter((a) =>
            ["SUBMITTED", "UNDER_REVIEW", "PENDING_REVIEW", "OPEN", "ACTION_REQUIRED"].includes(a.status),
          ).length
        : 0;
      setPendingAssistance(pending);
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    loadStatus();
    const timer = setInterval(loadStatus, 20000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    NAV_STRUCTURE.forEach((g) => {
      if (g.children && isInGroup(activeTab, g)) {
        setExpanded((prev) => ({ ...prev, [g.id]: true }));
      }
    });
  }, [activeTab]);

  const currentPage = useMemo(() => findLabel(activeTab), [activeTab]);
  const initials = (admin?.full_name || "SA")
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const badgeFor = (key) => {
    if (key === "kyc") return pendingKyc;
    if (key === "assistance") return pendingAssistance;
    return 0;
  };

  const toggleGroup = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="flex h-screen bg-[#0b1220] text-slate-100 overflow-hidden">
      <aside className="w-64 bg-[#0f172a] border-r border-slate-800 flex flex-col shrink-0">
        <div className="px-5 py-5 border-b border-slate-800 flex items-center gap-3">
          <div className="h-10 w-10 bg-sky-600 rounded-xl flex items-center justify-center font-bold text-white text-lg">
            GA
          </div>
          <div>
            <h1 className="font-semibold text-base text-white tracking-tight">Give Away</h1>
            <p className="text-[11px] text-slate-400">Admin Portal</p>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-0.5 overflow-y-auto">
          {NAV_STRUCTURE.map((item) => {
            const Icon = item.icon;
            if (!item.children) {
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {item.label}
                </button>
              );
            }

            const groupOpen = expanded[item.id];
            const groupActive = isInGroup(activeTab, item);
            const badge = badgeFor(item.badgeKey);

            return (
              <div key={item.id} className="pt-1">
                <button
                  type="button"
                  onClick={() => toggleGroup(item.id)}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm transition ${
                    groupActive
                      ? "text-white bg-slate-800/60"
                      : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.label}
                  </span>
                  <span className="flex items-center gap-1">
                    {badge > 0 && (
                      <span className="px-1.5 min-w-[1.25rem] text-center text-[10px] font-semibold rounded-full bg-amber-400 text-slate-900">
                        {badge}
                      </span>
                    )}
                    {groupOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                  </span>
                </button>
                {groupOpen && (
                  <div className="ml-3 mt-0.5 space-y-0.5 border-l border-slate-700 pl-2">
                    {item.children.map((child) => {
                      const isActive = activeTab === child.id;
                      return (
                        <button
                          key={child.id}
                          type="button"
                          onClick={() => setActiveTab(child.id)}
                          className={`w-full text-left px-3 py-2 rounded-lg text-xs transition ${
                            isActive
                              ? "bg-sky-600 text-white font-semibold"
                              : "text-slate-400 hover:bg-slate-800/80 hover:text-white"
                          }`}
                        >
                          {child.label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}

          <div className="pt-4 mt-2 border-t border-slate-800">
            <p className="px-3 text-[10px] uppercase tracking-wider text-slate-500 mb-2">Operations</p>
            {SECONDARY_NAV.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs transition ${
                    isActive
                      ? "bg-sky-600 text-white"
                      : "text-slate-500 hover:bg-slate-800/80 hover:text-white"
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="px-4 py-3 border-t border-slate-800 text-xs text-slate-400 flex items-center gap-2">
          <span className={`h-2 w-2 rounded-full ${online ? "bg-emerald-400" : "bg-red-400"}`} />
          {online ? "System online" : "Connection issue"}
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 border-b border-slate-800 bg-[#0f172a]/90 px-6 flex items-center justify-between shrink-0">
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
