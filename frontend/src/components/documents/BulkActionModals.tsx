// components/documents/BulkActionModals.tsx
import React from "react";
import type { Category } from "@/types/api";
import {
  BulkCategoryModal,
  BulkTagModal,
  BulkStatusModal,
  BulkDeleteModal,
} from "@/components/modals/BulkActionModals";

interface BulkModals {
  category: boolean;
  tag: boolean;
  status: boolean;
  delete: boolean;
}

interface BulkActionModalsProps {
  modals: BulkModals;
  setModals: React.Dispatch<React.SetStateAction<BulkModals>>;
  selectedDocuments: number[];
  categories: Category[];
  onSuccess: (message: string) => void;
}

export default function BulkActionModals({
  modals,
  setModals,
  selectedDocuments,
  categories,
  onSuccess
}: BulkActionModalsProps) {
  const closeModal = (modalType: keyof BulkModals) => {
    setModals(prev => ({ ...prev, [modalType]: false }));
  };

  return (
    <>
      {modals.category && (
        <BulkCategoryModal
          isOpen={modals.category}
          onClose={() => closeModal('category')}
          documentIds={selectedDocuments}
          categories={categories}
          onSuccess={() => onSuccess("Categories updated successfully")}
        />
      )}

      {modals.tag && (
        <BulkTagModal
          isOpen={modals.tag}
          onClose={() => closeModal('tag')}
          documentIds={selectedDocuments}
          onSuccess={() => onSuccess("Tags updated successfully")}
        />
      )}

      {modals.status && (
        <BulkStatusModal
          isOpen={modals.status}
          onClose={() => closeModal('status')}
          documentIds={selectedDocuments}
          onSuccess={() => onSuccess("Status updated successfully")}
        />
      )}

      {modals.delete && (
        <BulkDeleteModal
          isOpen={modals.delete}
          onClose={() => closeModal('delete')}
          documentIds={selectedDocuments}
          onSuccess={() => onSuccess("Documents moved to trash successfully")}
        />
      )}
    </>
  );
}