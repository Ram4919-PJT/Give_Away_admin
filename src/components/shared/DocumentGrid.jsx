import React from "react";
import { FileText } from "lucide-react";

export default function DocumentGrid({ documents = [], onView, emptyLabel = "No documents uploaded." }) {
  if (!documents?.length) {
    return <p className="text-xs text-slate-500">{emptyLabel}</p>;
  }

  return (
    <div className="grid sm:grid-cols-2 gap-2">
      {documents.map((doc) => (
        <div
          key={doc.document_id}
          className="bg-slate-950 border border-slate-800 rounded-lg p-3 flex items-start gap-3"
        >
          <FileText className="w-4 h-4 text-sky-400 shrink-0 mt-0.5" />
          <div className="min-w-0 flex-1">
            <p className="text-white text-xs font-semibold truncate">
              {(doc.document_type || "Document").replace(/_/g, " ")}
            </p>
            <p className="text-[10px] text-slate-500 truncate">{doc.original_filename || "file"}</p>
            {doc.verification_status && (
              <p className="text-[10px] text-slate-400">{doc.verification_status}</p>
            )}
            {doc.uploaded_at && (
              <p className="text-[10px] text-slate-500">
                {new Date(doc.uploaded_at).toLocaleString()}
              </p>
            )}
          </div>
          {onView && (
            <button
              type="button"
              onClick={() => onView(doc)}
              className="text-sky-400 hover:text-sky-300 text-xs font-bold shrink-0"
            >
              View
            </button>
          )}
        </div>
      ))}
    </div>
  );
}
