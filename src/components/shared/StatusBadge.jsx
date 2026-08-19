import React from "react";
import { formatStatusLabel, kycStatusBadgeClass } from "../../utils/status";

export default function StatusBadge({ status }) {
  return (
    <span className={kycStatusBadgeClass(status)}>
      {formatStatusLabel(status)}
    </span>
  );
}
