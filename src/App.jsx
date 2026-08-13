import React, { useState } from "react";
import { useAdminAuth } from "./auth/AuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import VerificationQueuePage from "./pages/VerificationQueuePage";
import UserManagementPage from "./pages/UserManagementPage";
import NgoManagementPage from "./pages/NgoManagementPage";
import DonationsManagementPage from "./pages/DonationsManagementPage";
import FundLedgerPage from "./pages/FundLedgerPage";
import InventoryManagementPage from "./pages/InventoryManagementPage";
import ReportsAuditPage from "./pages/ReportsAuditPage";
import SettingsNotificationsPage from "./pages/SettingsNotificationsPage";

export default function App() {
  const { admin, booting } = useAdminAuth();
  const [activeTab, setActiveTab] = useState("dashboard");

  if (booting) {
    return (
      <div className="min-h-screen bg-[#0b0f19] flex items-center justify-center text-slate-300 text-sm font-semibold">
        Loading admin session…
      </div>
    );
  }

  if (!admin) {
    return <AdminLoginPage />;
  }

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardPage setActiveTab={setActiveTab} />;
      case "verification":
        return <VerificationQueuePage />;
      case "users":
        return <UserManagementPage />;
      case "ngos":
        return <NgoManagementPage />;
      case "donations":
        return <DonationsManagementPage />;
      case "funds":
        return <FundLedgerPage />;
      case "inventory":
        return <InventoryManagementPage />;
      case "audit":
        return <ReportsAuditPage />;
      case "notifications":
        return <SettingsNotificationsPage />;
      default:
        return <AdminDashboardPage setActiveTab={setActiveTab} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={setActiveTab}>
      {renderContent()}
    </AdminLayout>
  );
}
