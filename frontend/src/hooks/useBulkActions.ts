// hooks/useBulkActions.ts
import { useState, useEffect } from "react";

interface BulkModals {
  category: boolean;
  tag: boolean;
  status: boolean;
  delete: boolean;
}

interface UseBulkActionsProps {
  onSuccess: () => void;
}

export function useBulkActions({ onSuccess }: UseBulkActionsProps) {
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [successMessage, setSuccessMessage] = useState("");
  const [bulkModals, setBulkModals] = useState<BulkModals>({
    category: false,
    tag: false,
    status: false,
    delete: false
  });

  // Check if device is mobile for responsive view mode
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobile = window.innerWidth < 640;
      if (isMobile && viewMode === "list") {
        setViewMode("grid"); // Force grid mode on mobile
      }
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, [viewMode]);

  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  const openBulkModal = (modalType: keyof BulkModals) => {
    setBulkModals(prev => ({ ...prev, [modalType]: true }));
  };

  const closeBulkModal = (modalType: keyof BulkModals) => {
    setBulkModals(prev => ({ ...prev, [modalType]: false }));
  };

  const closeAllBulkModals = () => {
    setBulkModals({
      category: false,
      tag: false,
      status: false,
      delete: false
    });
  };

  return {
    selectedDocuments,
    setSelectedDocuments,
    viewMode,
    setViewMode,
    toggleViewMode,
    bulkModals,
    setBulkModals,
    openBulkModal,
    closeBulkModal,
    closeAllBulkModals,
    successMessage,
    setSuccessMessage
  };
}