import {
  clearAuthStorage,
  getStoredAccessToken,
  getStoredRefreshToken,
  saveTokens,
} from "../auth/authStorage";

const API_BASE = import.meta.env.VITE_API_URL || "/api/v1";

function parseErrorDetail(data, fallback) {
  if (!data?.detail) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.detail)) {
    return data.detail.map((item) => item.msg || item.message || JSON.stringify(item)).join(", ");
  }
  return fallback;
}

async function refreshAccessToken() {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) throw new Error("Session expired");

  const response = await fetch(`${API_BASE}/auth/refresh`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    clearAuthStorage();
    throw new Error(parseErrorDetail(data, "Session expired"));
  }
  saveTokens(data);
  return data.access_token;
}

async function request(endpoint, options = {}, { auth = true, retry = true } = {}) {
  const headers = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...(options.headers || {}),
  };
  const accessToken = auth ? getStoredAccessToken() : null;
  if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (res.status === 401 && auth && retry) {
    await refreshAccessToken();
    return request(endpoint, options, { auth, retry: false });
  }

  if (res.status === 204) return null;

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(parseErrorDetail(data, `HTTP ${res.status}: ${res.statusText}`));
  }
  return data;
}

export const adminApi = {
  login: (email, password) =>
    request(
      "/auth/login",
      {
        method: "POST",
        body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
      },
      { auth: false }
    ),

  getMe: () => request("/auth/me"),

  logout: async () => {
    const refreshToken = getStoredRefreshToken();
    if (!refreshToken) return;
    try {
      await request(
        "/auth/logout",
        {
          method: "POST",
          body: JSON.stringify({ refresh_token: refreshToken }),
        },
        { auth: false }
      );
    } catch {
      /* revoke best-effort */
    }
  },

  getHealth: () => fetch("/gateway/health").then((r) => r.json()),

  getUsers: (status) => request(`/users?limit=200${status ? `&status=${status}` : ""}`),
  getUser: (id) => request(`/users/${id}`),
  updateUserStatus: (id, status) =>
    request(`/users/${id}/status`, {
      method: "PATCH",
      body: JSON.stringify({ status }),
    }),
  assignUserRole: (id, role_name) =>
    request(`/users/${id}/role`, {
      method: "PATCH",
      body: JSON.stringify({ role_name }),
    }),

  getDonorProfiles: () => request("/core/profiles/donors"),
  getReceiverProfiles: () => request("/core/profiles/receivers"),
  getNgoProfiles: () => request("/core/profiles/ngos"),
  getBeneficiaries: (ngoId) => request(`/core/beneficiaries${ngoId ? `?ngo_id=${ngoId}` : ""}`),
  getPrograms: () => request("/core/programs"),

  getVerificationRequests: () => request("/core/verification/requests"),
  getVerificationRequest: (id) => request(`/core/verification/requests/${id}`),
  reviewVerificationRequest: (id, status, reason = "") =>
    request(`/core/verification/requests/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status, reason }),
    }),

  listAdminVerifications: ({ request_type, status } = {}) => {
    const params = new URLSearchParams();
    if (request_type) params.set("request_type", request_type);
    if (status) params.set("status", status);
    const qs = params.toString();
    return request(`/core/admin/verifications${qs ? `?${qs}` : ""}`);
  },
  getAdminVerificationDetail: (id) => request(`/core/admin/verifications/${id}`),
  approveKyc: (id, note = "") =>
    request(`/core/admin/verifications/${id}/approve`, {
      method: "POST",
      body: JSON.stringify({ note }),
    }),
  rejectKyc: (id, reason) =>
    request(`/core/admin/verifications/${id}/reject`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),
  requestMoreKycDocuments: (id, payload) =>
    request(`/core/admin/verifications/${id}/request-documents`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  requestKycFieldUpdates: (id, { field_paths, reason, comment }) =>
    request(`/core/admin/verifications/${id}/request-field-updates`, {
      method: "POST",
      body: JSON.stringify({
        field_paths,
        reason,
        comment,
      }),
    }),
  suspendKyc: (id, reason) =>
    request(`/core/admin/verifications/${id}/suspend`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    }),

  openVerificationDocument: async (requestId, documentId) => {
    const token = getStoredAccessToken();
    const response = await fetch(
      `${API_BASE}/core/verification/requests/${requestId}/documents/${documentId}/view`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(parseErrorDetail(data, "Could not open document"));
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  listAdminAssistanceQueue: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/core/admin/applications/queue${qs}`);
  },
  getAdminAssistanceDetail: (id) => request(`/core/admin/applications/${id}`),
  reviewAdminAssistance: (id, payload) =>
    request(`/core/admin/applications/${id}/review`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),
  disburseAdminAssistance: (id, { disbursement_reference, note }) =>
    request(`/core/admin/applications/${id}/disburse`, {
      method: "POST",
      body: JSON.stringify({ disbursement_reference, note }),
    }),

  openAssistanceDocument: async (applicationId, documentId) => {
    const token = getStoredAccessToken();
    const response = await fetch(
      `${API_BASE}/core/applications/${applicationId}/documents/${documentId}/view`,
      { headers: token ? { Authorization: `Bearer ${token}` } : {} }
    );
    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      throw new Error(parseErrorDetail(data, "Could not open document"));
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank", "noopener,noreferrer");
    setTimeout(() => URL.revokeObjectURL(url), 60_000);
  },

  listAdminItemQueue: (status) => {
    const qs = status ? `?status=${encodeURIComponent(status)}` : "";
    return request(`/core/admin/item-donations/queue${qs}`);
  },
  getAdminItemDetail: (id) => request(`/core/admin/item-donations/${id}`),
  reviewAdminItem: (id, payload) =>
    request(`/core/admin/item-donations/${id}/review`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getVerificationDocuments: () => request("/core/verification/documents"),
  getRejectionReasons: () => request("/core/verification/rejection-reasons"),

  getMoneyDonations: () => request("/core/donations/money"),
  getItemDonations: () => request("/core/donations/items"),
  getPickupSchedules: () => request("/core/donations/pickup-schedules"),
  schedulePickup: (item_donation_id, pickup_date, pickup_time) =>
    request("/core/donations/pickup-schedules", {
      method: "POST",
      body: JSON.stringify({ item_donation_id, pickup_date, pickup_time }),
    }),

  getApplications: () => request("/core/applications"),
  reviewApplication: (id, status) =>
    request(`/core/applications/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  getNgoItemRequests: () => request("/core/applications/ngo-item-requests"),
  reviewNgoItemRequest: (id, status) =>
    request(`/core/applications/ngo-item-requests/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),
  getNgoFundRequests: () => request("/core/applications/ngo-fund-requests"),
  reviewNgoFundRequest: (id, status) =>
    request(`/core/applications/ngo-fund-requests/${id}/review`, {
      method: "POST",
      body: JSON.stringify({ status }),
    }),

  getInventory: () => request("/core/inventory"),
  addInventoryItem: (category, description, quantity) =>
    request("/core/inventory", {
      method: "POST",
      body: JSON.stringify({ category, description, quantity }),
    }),
  allocateStock: (ngo_request_id, item_id, quantity_allocated) =>
    request("/core/inventory/allocate", {
      method: "POST",
      body: JSON.stringify({ ngo_request_id, item_id, quantity_allocated }),
    }),
  getInventoryTransactions: () => request("/core/inventory/transactions"),

  getFundPools: () => request("/core/funds/pools"),
  createFundPool: (pool_name, balance = 0) =>
    request("/core/funds/pools", {
      method: "POST",
      body: JSON.stringify({ pool_name, balance }),
    }),
  getFundLedger: () => request("/core/funds/ledger"),
  addLedgerTransaction: (pool_id, transaction_type, amount) =>
    request("/core/funds/ledger", {
      method: "POST",
      body: JSON.stringify({ pool_id, transaction_type, amount }),
    }),
  getDisbursements: () => request("/core/funds/disbursements"),
  createDisbursement: (application_id, amount) =>
    request("/core/funds/disbursements", {
      method: "POST",
      body: JSON.stringify({ application_id, amount }),
    }),

  getNotifications: () => request("/notifications"),
  getNotificationTemplates: () => request("/notifications/templates"),
  createNotificationTemplate: (template_name, channel, content) =>
    request("/notifications/templates", {
      method: "POST",
      body: JSON.stringify({ template_name, channel, content }),
    }),
  sendNotification: (user_id, title, message) =>
    request("/notifications", {
      method: "POST",
      body: JSON.stringify({ user_id, title, message }),
    }),

  activateAccount: async (userId) => {
    await adminApi.updateUserStatus(userId, "ACTIVE");
    try {
      await adminApi.sendNotification(
        userId,
        "Account activated",
        "Your Give Away account is active. You can sign in to the user application."
      );
    } catch {
      /* notification is best-effort */
    }
  },

  suspendAccount: async (userId, reason = "") => {
    await adminApi.updateUserStatus(userId, "SUSPENDED");
    try {
      await adminApi.sendNotification(
        userId,
        "Account suspended",
        reason || "Your account has been suspended. Contact support for assistance."
      );
    } catch {
      /* notification is best-effort */
    }
  },

  /** @deprecated Use approveKyc — KYC approval must not change account status */
  approveAccount: async (userId, verificationRequestId) => {
    if (verificationRequestId) {
      await adminApi.approveKyc(verificationRequestId);
    }
  },

  /** @deprecated Use rejectKyc + suspendAccount separately when needed */
  rejectAccount: async (userId, verificationRequestId, reason = "") => {
    if (verificationRequestId) {
      await adminApi.rejectKyc(verificationRequestId, reason || "Verification rejected");
    }
  },
};
