import React from "react";
import { Save } from "lucide-react";

interface SaveSelectionActionsProps {
  selectedCount: number;
  handleClearSelection: () => void;
  handleSaveToDocument: () => void;
  isSubmitting: boolean;
}

export default function SaveSelectionActions({
  selectedCount,
  handleClearSelection,
  handleSaveToDocument,
  isSubmitting,
}: SaveSelectionActionsProps) {
  return (
    <div className="mt-6 p-4 bg-secondary-100 border border-secondary-200  rounded flex flex-col sm:flex-row justify-between items-center gap-4">
      <div className="text-secondary-600 font-semibold">
        You have selected {selectedCount} paragraph{selectedCount > 1 ? "s" : ""}.
      </div>
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleClearSelection}
          className="btn-secondary"
          disabled={isSubmitting}
        >
          Clear Selection
        </button>
        <button
          type="button"
          className="btn-primary flex items-center gap-2"
          onClick={handleSaveToDocument}
          disabled={isSubmitting}
        >
          <Save className="h-4 w-4" />
          {isSubmitting ? "Saving..." : "Save Selected to Document"}
        </button>
      </div>
    </div>
  );
}
