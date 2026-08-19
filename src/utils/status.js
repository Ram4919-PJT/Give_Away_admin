export function normalizeStatus(status) {
  return String(status || "").toUpperCase().replace(/-/g, "_");
}

export function kycStatusBadgeClass(status) {
  const s = normalizeStatus(status);
  if (s === "VERIFIED" || s === "APPROVED") return "badge-verified";
  if (s === "REJECTED" || s === "SUSPENDED") return "badge-rejected";
  if (s === "MORE_DOCUMENTS_REQUIRED" || s === "MORE_INFO_REQUIRED" || s === "ACTION_REQUIRED") {
    return "badge-pending";
  }
  if (["UNDER_REVIEW", "DOCUMENTS_SUBMITTED", "VALIDATION_IN_PROGRESS", "SUBMITTED", "DRAFT"].includes(s)) {
    return "badge-review";
  }
  return "badge-active";
}

export function formatStatusLabel(status) {
  const s = normalizeStatus(status);
  if (s === "MORE_DOCUMENTS_REQUIRED") return "More information required";
  if (s === "ACTION_REQUIRED") return "More information required";
  return s.replace(/_/g, " ");
}

export const KYC_REVIEWABLE = new Set([
  "UNDER_REVIEW",
  "MORE_DOCUMENTS_REQUIRED",
  "DOCUMENTS_SUBMITTED",
  "VALIDATION_IN_PROGRESS",
]);

export const ASSISTANCE_REVIEWABLE = new Set([
  "SUBMITTED",
  "UNDER_REVIEW",
  "PENDING_REVIEW",
  "OPEN",
  "ACTION_REQUIRED",
]);
