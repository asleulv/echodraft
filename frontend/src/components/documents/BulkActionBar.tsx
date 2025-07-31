// components/documents/BulkActionBar.tsx
import React from "react";
import { CircleX, Box, Tag, Layers, Trash2 } from "lucide-react";

interface BulkActionBarProps {
  selectedCount: number;
  onClearSelection: () => void;
  onOpenModal: (modalType: 'category' | 'tag' | 'status' | 'delete') => void;
}

export default function BulkActionBar({
  selectedCount,
  onClearSelection,
  onOpenModal
}: BulkActionBarProps) {
  return (
    <div className="fixed top-0 left-0 right-0 z-10 bg-primary-200 shadow-md p-4 flex flex-wrap items-center justify-center space-x-2">
      <span className="text-md text-primary-600 bg-primary-400 p-2 rounded-lg flex items-center">
        {selectedCount} selected
        <button
          onClick={onClearSelection}
          className="ml-2 text-primary-200 hover:text-primary-800"
          title="Deselect all"
        >
          <CircleX className="w-5 h-5" />
        </button>
      </span>

      <button
        onClick={() => onOpenModal('category')}
        className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
        title="Change category"
      >
        <Box className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => onOpenModal('tag')}
        className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
        title="Add tags"
      >
        <Tag className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => onOpenModal('status')}
        className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
        title="Change status"
      >
        <Layers className="w-5 h-5" />
      </button>
      
      <button
        onClick={() => onOpenModal('delete')}
        className="p-1.5 rounded text-danger-500 bg-primary-200 hover:bg-danger-100"
        title="Move to trash"
      >
        <Trash2 className="w-5 h-5" />
      </button>
    </div>
  );
}