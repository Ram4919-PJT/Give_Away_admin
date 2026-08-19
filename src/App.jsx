import React, { useEffect, useMemo, useState } from "react";
import { useAdminAuth } from "./auth/AuthContext";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminLayout from "./components/layout/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import VerificationQueuePage from "./pages/VerificationQueuePage";
import UserManagementPage from "./pages/UserManagementPage";
import AssistanceReviewPage from "./pages/AssistanceReviewPage";
import ItemVerificationPage from "./pages/ItemVerificationPage";
import NgoManagementPage from "./pages/NgoManagementPage";
import DonationsManagementPage from "./pages/DonationsManagementPage";
import FundLedgerPage from "./pages/FundLedgerPage";
import InventoryManagementPage from "./pages/InventoryManagementPage";
import ReportsAuditPage from "./pages/ReportsAuditPage";
import SettingsNotificationsPage from "./pages/SettingsNotificationsPage";
import ProgramsPage from "./pages/ProgramsPage";

function readDeepLinkParams() {
  const params = new URLSearchParams(window.location.search);
  const tab = params.get("tab") || "dashboard";
  const legacyMap = {
    "kyc-receiver": "verification-receiver",
    "kyc-ngo": "verification-ngo",
    "kyc-donor": "verification-donor",
    verification: "verification-receiver",
  };
  const normalizedTab = legacyMap[tab] || tab;
  return {
    tab: normalizedTab,
    requestId: params.get("requestId"),
    applicationId: params.get("applicationId"),
    itemId: params.get("itemId"),
  };
}

function verificationTypeForTab(tab) {
  if (tab === "verification-ngo") return "NGO";
  if (tab === "verification-donor") return "DONOR";
  return "RECEIVER";
}

function assistanceStatusForTab(tab) {
  if (tab === "assistance-pending") return "UNDER_REVIEW";
  if (tab === "assistance-approved") return "APPROVED";
  if (tab === "assistance-rejected") return "REJECTED";
  if (tab === "assistance-more-info") return "ACTION_REQUIRED";
  return null;
}

function userRoleForTab(tab) {
  if (tab === "users-receivers") return "RECEIVER";
  if (tab === "users-ngos") return "NGO";
  if (tab === "users-donors") return "DONOR";
  return "ALL";
}

export default function App() {
  const { admin, booting } = useAdminAuth();
  const deepLink = useMemo(() => readDeepLinkParams(), []);
  const [activeTab, setActiveTab] = useState(deepLink.tab);
  const [kycHighlightId, setKycHighlightId] = useState(deepLink.requestId);
  const [assistanceHighlightId, setAssistanceHighlightId] = useState(deepLink.applicationId);

  useEffect(() => {
    const params = readDeepLinkParams();
    if (params.tab) setActiveTab(params.tab);
    if (params.requestId) setKycHighlightId(params.requestId);
    if (params.applicationId) setAssistanceHighlightId(params.applicationId);
  }, []);

  const navigate = (tab, { requestId, applicationId } = {}) => {
    setActiveTab(tab);
    if (requestId) setKycHighlightId(String(requestId));
    if (applicationId) setAssistanceHighlightId(String(applicationId));
    const qs = new URLSearchParams();
    if (tab && tab !== "dashboard") qs.set("tab", tab);
    if (requestId) qs.set("requestId", requestId);
    if (applicationId) qs.set("applicationId", applicationId);
    const suffix = qs.toString();
    window.history.replaceState({}, "", suffix ? `/?${suffix}` : "/");
  };

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
    if (activeTab.startsWith("verification-")) {
      return (
        <VerificationQueuePage
          initialType={verificationTypeForTab(activeTab)}
          highlightRequestId={kycHighlightId}
        />
      );
    }

    if (activeTab.startsWith("assistance")) {
      return (
        <AssistanceReviewPage
          statusFilter={assistanceStatusForTab(activeTab)}
          highlightApplicationId={assistanceHighlightId}
          onOpenKyc={(requestId) => navigate("verification-receiver", { requestId })}
        />
      );
    }

    if (activeTab.startsWith("users")) {
      return (
        <UserManagementPage
          initialRoleFilter={userRoleForTab(activeTab)}
          onOpenKyc={(role) => {
            const tab =
              role === "NGO" ? "verification-ngo" : role === "DONOR" ? "verification-donor" : "verification-receiver";
            navigate(tab);
          }}
        />
      );
    }

    switch (activeTab) {
      case "dashboard":
        return <AdminDashboardPage onNavigate={navigate} />;
      case "programs":
        return <ProgramsPage />;
      case "items":
        return <ItemVerificationPage highlightItemId={deepLink.itemId} />;
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
      case "settings":
        return <SettingsNotificationsPage />;
      default:
        return <AdminDashboardPage onNavigate={navigate} />;
    }
  };

  return (
    <AdminLayout activeTab={activeTab} setActiveTab={(tab) => navigate(tab)}>
      {renderContent()}
    </AdminLayout>
  );
}
