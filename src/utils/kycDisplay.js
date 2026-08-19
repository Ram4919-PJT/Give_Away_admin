export const KYC_FIELD_LABELS = {
  first_name: "First name",
  last_name: "Last name",
  full_name: "Full legal name",
  dob: "Date of birth",
  email: "Email",
  mobile: "Mobile",
  verified_at: "Verified at",
  id_type: "Document type",
  id_number: "Document number",
  address_line: "Address",
  city: "City",
  state: "State",
  pincode: "Postal code",
  latitude: "Latitude",
  longitude: "Longitude",
  location_captured_at: "Location captured",
  relationship: "Relationship",
  category: "Purpose",
  explanation: "Explanation",
  account_holder_name: "Account holder",
  bank_name: "Bank",
  account_number: "Account number",
  ifsc: "IFSC",
  type: "Destination type",
  institution_name: "Institution / vendor",
};

export const RECEIVER_KYC_ADMIN_FIELDS = [
  { path: "personal.first_name", label: "First name" },
  { path: "personal.last_name", label: "Last name" },
  { path: "personal.dob", label: "Date of birth" },
  { path: "personal.email", label: "Email" },
  { path: "identity.id_type", label: "Identity document type" },
  { path: "identity.id_number", label: "Identity document number" },
  { path: "address.address_line", label: "Address" },
  { path: "address.city", label: "City" },
  { path: "address.state", label: "State" },
  { path: "address.pincode", label: "Postal code" },
  { path: "beneficiary.relationship", label: "Beneficiary relationship" },
  { path: "beneficiary.full_name", label: "Beneficiary name" },
  { path: "beneficiary.dob", label: "Beneficiary DOB" },
  { path: "assistance.category", label: "Verification purpose" },
  { path: "assistance.explanation", label: "Purpose explanation" },
  { path: "bank.account_holder_name", label: "Account holder" },
  { path: "bank.bank_name", label: "Bank name" },
  { path: "bank.account_number", label: "Account number" },
  { path: "bank.ifsc", label: "IFSC" },
];

export function maskSensitive(key, value) {
  if (value == null || value === "") return "—";
  if (key.includes("account_number") || key === "id_number") {
    const s = String(value);
    return s.length > 4 ? `••••${s.slice(-4)}` : "••••";
  }
  if (key === "mobile") {
    const digits = String(value).replace(/\D/g, "").slice(-10);
    return digits ? `+91 ${digits}` : value;
  }
  if (key === "verified_at" || key.includes("captured_at")) {
    try {
      return new Date(value).toLocaleString();
    } catch {
      return String(value);
    }
  }
  return String(value);
}

export function labelForFieldPath(path) {
  const match = RECEIVER_KYC_ADMIN_FIELDS.find((f) => f.path === path);
  if (match) return match.label;
  return String(path || "").replace(/\./g, " — ").replace(/_/g, " ");
}
