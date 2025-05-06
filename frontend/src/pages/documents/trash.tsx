import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { documentsAPI } from "@/utils/api";
import type { Document } from "@/types/api";
import Layout from "@/components/Layout";
import { formatDate } from "@/utils/dateUtils";
import {
  CircleCheck,
  Trash2,
  RefreshCw,
  Folder,
  ChevronRight,
  TriangleAlert,
  CircleX,
} from "lucide-react";

export default function TrashDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [confirmSingleDeleteId, setConfirmSingleDeleteId] = useState<
    number | null
  >(null);
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch deleted documents
  useEffect(() => {
    const fetchDeletedDocuments = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        const response = await documentsAPI.getDeletedDocuments();
        setDocuments(response.data.results || []);
      } catch (err: any) {
        console.error("Failed to load deleted documents:", err);
        setError("Failed to load deleted documents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDeletedDocuments();
  }, [isAuthenticated]);

  // Handle restore document
  const handleRestore = async (documentId: number) => {
    try {
      await documentsAPI.restoreDocument(documentId);
      setSuccessMessage("Document restored successfully");

      // Remove the restored document from the list
      setDocuments(documents.filter((doc) => doc.id !== documentId));

      // Clear the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (err) {
      console.error("Failed to restore document:", err);
      setError("Failed to restore document");

      // Clear the error message after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  // Handle permanent delete
  const handlePermanentDelete = async (documentId: number) => {
    try {
      await documentsAPI.bulkDeletePermanently([documentId]);
      setSuccessMessage("Document permanently deleted");

      // Remove the deleted document from the list
      setDocuments(documents.filter((doc) => doc.id !== documentId));

      // Clear the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (err) {
      console.error("Failed to permanently delete document:", err);
      setError("Failed to permanently delete document");

      // Clear the error message after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  // Handle bulk permanent delete
  const handleBulkPermanentDelete = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      await documentsAPI.bulkDeletePermanently(selectedDocuments);
      setSuccessMessage(
        `${selectedDocuments.length} documents permanently deleted`
      );

      // Remove the deleted documents from the list
      setDocuments(
        documents.filter((doc) => !selectedDocuments.includes(doc.id))
      );

      // Clear selected documents
      setSelectedDocuments([]);

      // Close the confirmation modal
      setConfirmDeleteOpen(false);

      // Clear the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (err) {
      console.error("Failed to permanently delete documents:", err);
      setError("Failed to permanently delete documents");

      // Close the confirmation modal
      setConfirmDeleteOpen(false);

      // Clear the error message after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  // Handle bulk restore
  const handleBulkRestore = async () => {
    if (selectedDocuments.length === 0) return;

    try {
      // Call restoreDocument for each selected document
      const promises = selectedDocuments.map((docId) =>
        documentsAPI.restoreDocument(docId)
      );
      await Promise.all(promises);

      setSuccessMessage(
        `${selectedDocuments.length} documents restored successfully`
      );

      // Remove the restored documents from the list
      setDocuments(
        documents.filter((doc) => !selectedDocuments.includes(doc.id))
      );

      // Clear selected documents
      setSelectedDocuments([]);

      // Clear the success message after 5 seconds
      setTimeout(() => {
        setSuccessMessage("");
      }, 5000);
    } catch (err) {
      console.error("Failed to restore documents:", err);
      setError("Failed to restore documents");

      // Clear the error message after 5 seconds
      setTimeout(() => {
        setError("");
      }, 5000);
    }
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Trash">
      <header className="bg-primary-0">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0"></div>
          </div>
        </div>
      </header>

      {/* Bulk action fixed menu - only show when documents are selected */}
      {selectedDocuments.length > 0 && (
        <div className="fixed top-0 left-0 right-0 z-10 bg-primary-200 shadow-md p-4 flex flex-wrap items-center justify-center space-x-2">
          <span className="text-md text-primary-600 bg-primary-400 p-2 rounded-lg flex items-center">
            {selectedDocuments.length} selected
            {/* X button to deselect all */}
            <button
              onClick={() => setSelectedDocuments([])}
              className="ml-2 text-primary-200 hover:text-primary-800"
              title="Deselect all"
            >
              <CircleX className="w-5 h-5" />
            </button>
          </span>

          <button
            onClick={handleBulkRestore}
            className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
            title="Restore selected documents"
          >
            <RefreshCw className="w-5 h-5" />
          </button>

          <button
            onClick={() => setConfirmDeleteOpen(true)}
            className="p-1.5 rounded text-danger-500 bg-primary-200 hover:bg-danger-100"
            title="Delete forever"
          >
            <TriangleAlert className="w-5 h-5" />
          </button>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="sm:border border-4 border-primary-50 sm:border-primary-200 rounded-lg p-2 sm:p-4 mb-6">
            <h2 className="text-xl font-light text-primary-500 text-center sm:text-left mb-4">
              Trash
            </h2>
            {successMessage && (
              <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6">
                {successMessage}
              </div>
            )}

            {error && (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}

            {documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-500 dark:text-primary-600 mb-4">
                  No documents in trash
                </p>
                <button
                  onClick={() => router.push("/documents")}
                  className="btn-primary"
                >
                  Go to Documents
                </button>
              </div>
            ) : (
              <>
                {/* Desktop Table View */}

                {!isMobile && (
                  <div className="hidden sm:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-primary-200">
                      <thead className="bg-primary-100 text-left text-sm font-semibold text-primary-500">
                        <tr>
                          <th
                            scope="col"
                            className="py-2 pl-4 pr-3 sm:pl-4 w-10"
                          >
                            <label className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full bg-primary-200 hover:bg-primary-300 cursor-pointer">
                              <input
                                type="checkbox"
                                className="absolute w-full h-full opacity-0 cursor-pointer"
                                checked={
                                  selectedDocuments.length ===
                                    documents.length && documents.length > 0
                                }
                                onChange={(e) =>
                                  setSelectedDocuments(
                                    e.target.checked
                                      ? documents.map((doc) => doc.id)
                                      : []
                                  )
                                }
                              />
                              {selectedDocuments.length === documents.length &&
                                documents.length > 0 && (
                                  <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                                )}
                            </label>
                          </th>
                          <th className="py-2 px-3">Title</th>
                          <th className="py-2 px-3">Category</th>
                          <th className="py-2 px-3">Deleted</th>
                          <th className="py-2 px-3">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-primary-200 bg-primary-50">
                        {documents.map((doc) => (
                          <tr key={doc.id} className="hover:bg-primary-100">
                            <td className="py-2 pl-4 pr-3 sm:pl-4 w-10">
                              <label className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full bg-primary-200 hover:bg-primary-300 cursor-pointer">
                                <input
                                  type="checkbox"
                                  className="absolute w-full h-full opacity-0 cursor-pointer"
                                  checked={selectedDocuments.includes(doc.id)}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    setSelectedDocuments(
                                      e.target.checked
                                        ? [...selectedDocuments, doc.id]
                                        : selectedDocuments.filter(
                                            (id) => id !== doc.id
                                          )
                                    );
                                  }}
                                />
                                {selectedDocuments.includes(doc.id) && (
                                  <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                                )}
                              </label>
                            </td>
                            <td className="py-2 px-3 flex items-center gap-1.5">
                              <ChevronRight className="w-4 h-4 text-primary-500" />
                              <span 
                                className="document-title text-sm font-medium text-primary-600 dark:text-primary-600 cursor-pointer hover:text-primary-800 dark:hover:text-primary-600"
                                onClick={() => router.push(`/documents/${doc.slug}`)}
                              >
                                {doc.title}
                              </span>
                              {doc.version > 1 && (
                                <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
                                  v{doc.version}
                                </span>
                              )}
                            </td>
                            <td className="py-2 px-3 text-sm">
                              <span
                                className="px-2 py-0.5 rounded-full text-xs"
                                style={{
                                  backgroundColor: doc.category_name
                                    ? `${doc.category_color}20`
                                    : "#E5E7EB20",
                                  color: doc.category_name
                                    ? doc.category_color
                                    : "#9CA3AF",
                                }}
                              >
                                {doc.category_name || "Uncategorized"}
                              </span>
                            </td>

                            <td className="py-2 px-3 text-sm text-primary-600">
                              {formatDate(doc.updated_at)}
                            </td>

                            <td className="py-2 px-3 flex space-x-2">
                              <button
                                onClick={() => handleRestore(doc.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-primary-400 text-primary-200 hover:bg-primary-500"
                              >
                                <RefreshCw className="w-5 h-5" />
                              </button>
                              <button
                                onClick={() => setConfirmSingleDeleteId(doc.id)}
                                className="w-8 h-8 flex items-center justify-center rounded-full bg-danger-200 text-primary-200 hover:bg-red-600"
                              >
                                <TriangleAlert className="w-5 h-5" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Mobile Card View */}
                {isMobile && (
                  <div className="sm:hidden space-y-2">
                    {/* Mobile selection controls */}
                    {documents.length > 0 && (
                      <div className="flex items-center justify-between mb-4 bg-primary-50  p-3 rounded-lg">
                        <div className="flex items-center">
                          <label className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50 cursor-pointer mr-2">
                            <input
                              type="checkbox"
                              className="absolute w-full h-full opacity-0 cursor-pointer"
                              checked={
                                selectedDocuments.length === documents.length &&
                                documents.length > 0
                              }
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedDocuments(
                                    documents.map((doc) => doc.id)
                                  );
                                } else {
                                  setSelectedDocuments([]);
                                }
                              }}
                            />
                            {selectedDocuments.length === documents.length &&
                              documents.length > 0 && (
                                <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                              )}
                          </label>

                          <span className="text-sm text-primary-600 dark:text-primary-300">
                            {selectedDocuments.length === 0
                              ? "Select all"
                              : `Selected ${selectedDocuments.length} of ${documents.length}`}
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Document cards */}
                    {documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="border border-primary-200 dark:border-primary-200 rounded-lg p-3 hover:shadow-md dark:hover:shadow-white/10 transition-shadow bg-white dark:bg-primary-100"
                        style={{
                          borderLeftWidth: "4px",
                          borderLeftColor: "#EF4444",
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center">
                            <label className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50 cursor-pointer mr-2">
                              <input
                                type="checkbox"
                                className="absolute w-full h-full opacity-0 cursor-pointer"
                                checked={selectedDocuments.includes(doc.id)}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDocuments([
                                      ...selectedDocuments,
                                      doc.id,
                                    ]);
                                  } else {
                                    setSelectedDocuments(
                                      selectedDocuments.filter(
                                        (id) => id !== doc.id
                                      )
                                    );
                                  }
                                }}
                              />
                              {selectedDocuments.includes(doc.id) && (
                                <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                              )}
                            </label>

                            <div className="flex items-center">
                              <ChevronRight className="w-5 h-5 text-primary-500 dark:text-primary-400 mr-2" />
                              <span
                                onClick={() => router.push(`/documents/${doc.slug}`)}
                                className="document-title text-sm font-medium text-primary-600 dark:text-primary-600 cursor-pointer hover:text-primary-800 dark:hover:text-primary-600"
                              >
                                {doc.title}
                              </span>
                              {doc.version > 1 && (
                                <span className="ml-1 px-1 py-0.5 text-xs font-medium bg-primary-300 text-primary-600 rounded">
                                  v{doc.version}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="mb-2">
                          {doc.category_name ? (
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center"
                              style={{
                                backgroundColor:
                                  `${doc.category_color}20` || "#9CA3AF20",
                                color: doc.category_color || "#9CA3AF",
                              }}
                            >
                              <Folder
                                className="w-3 h-3 mr-1 flex-shrink-0"
                                style={{
                                  color: doc.category_color || "#2563eb",
                                }}
                              />
                              {doc.category_name}
                            </span>
                          ) : (
                            <span
                              className="inline-block px-2 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center"
                              style={{
                                backgroundColor: "#9CA3AF20",
                                color: "#9CA3AF",
                              }}
                            >
                              <Folder
                                className="w-3 h-3 mr-1 flex-shrink-0"
                                style={{ color: "#9CA3AF" }}
                              />
                              Uncategorized
                            </span>
                          )}
                        </div>

                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1 mb-3">
                            {doc.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 dark:bg-primary-700 text-primary-800 dark:text-primary-300"
                              >
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        <div className="text-sm text-primary-500 dark:text-primary-400 mb-3">
                          Deleted on:{" "}
                          {formatDate(doc.updated_at)}
                        </div>

                        <div className="flex justify-end mt-2 space-x-2">
                          <button
                            onClick={() => handleRestore(doc.id)}
                            className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <RefreshCw className="w-6 h-6" />
                          </button>
                          <button
                            onClick={() => setConfirmSingleDeleteId(doc.id)}
                            className="p-1 text-danger-400 hover:text-danger-600 dark:text-danger-400 dark:hover:text-danger-300"
                          >
                            <TriangleAlert className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </main>

      {/* Confirmation Modal for Bulk Delete */}
      {confirmDeleteOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-primary-200 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-primary-900 dark:text-danger-300 mb-4">
              Permanently Delete Documents
            </h3>
            <p className="text-primary-500 dark:text-primary-600 mb-6">
              Are you sure you want to permanently delete{" "}
              {selectedDocuments.length} document
              {selectedDocuments.length !== 1 ? "s" : ""}? This action cannot be
              undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmDeleteOpen(false)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleBulkPermanentDelete}
                className="btn-danger flex items-center"
              >
                <TriangleAlert className="w-4 h-4 mr-2" />
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal for Single Delete */}
      {confirmSingleDeleteId !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-primary-200 rounded-lg p-6 max-w-md w-full">
            <h3 className="text-lg font-medium text-primary-900 dark:text-danger-300 mb-4">
              Permanently Delete Document
            </h3>
            <p className="text-primary-500 dark:text-primary-600 mb-6">
              Are you sure you want to permanently delete this document? This
              action cannot be undone.
            </p>
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setConfirmSingleDeleteId(null)}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (confirmSingleDeleteId !== null) {
                    handlePermanentDelete(confirmSingleDeleteId);
                    setConfirmSingleDeleteId(null);
                  }
                }}
                className="btn-danger flex items-center"
              >
                <TriangleAlert className="w-4 h-4 mr-2" />
                Delete Forever
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
