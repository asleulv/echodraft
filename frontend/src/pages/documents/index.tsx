// pages/documents/index.tsx
import React from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import Layout from "@/components/Layout";
import { useDocuments } from "@/hooks/useDocuments";
import { useDocumentFilters } from "@/hooks/useDocumentFilters";
import { useBulkActions } from "@/hooks/useBulkActions";
import SearchBar from "@/components/documents/SearchBar";
import FilterPanel from "@/components/documents/FilterPanel";
import DocumentList from "@/components/documents/DocumentList";
import BulkActionBar from "@/components/documents/BulkActionBar";
import Pagination from "@/components/documents/Pagination";
import BulkActionModals from "@/components/documents/BulkActionModals";

export default function Documents() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Custom hooks for state management
  const {
    documents,
    isLoading,
    error,
    totalResults,
    currentPage,
    hasMoreResults,
    refreshTrigger,
    setCurrentPage,
    triggerRefresh,
    searchTerm,
    setSearchTerm,
    isSearching,
    clearSearch,
  } = useDocuments();

  const {
    selectedTags,
    selectedCategory,
    selectedStatuses,
    categories,
    allAvailableTags,
    showFilters,
    setShowFilters,
    handleTagSelect,
    handleCategorySelect,
    handleStatusToggle,
    clearFilters,
    hasActiveFilters,
  } = useDocumentFilters({ onFilterChange: triggerRefresh });

  const {
    selectedDocuments,
    setSelectedDocuments,
    viewMode,
    setViewMode,
    bulkModals,
    setBulkModals,
    successMessage,
    setSuccessMessage,
  } = useBulkActions({ onSuccess: triggerRefresh });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Loading state
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Documents">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search Bar */}
          <SearchBar
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            isSearching={isSearching}
            clearSearch={clearSearch}
          />

          {/* Filter Panel */}
          <FilterPanel
            showFilters={showFilters}
            setShowFilters={setShowFilters}
            hasActiveFilters={hasActiveFilters}
            clearFilters={clearFilters}
            selectedTags={selectedTags}
            selectedCategory={selectedCategory}
            selectedStatuses={selectedStatuses}
            categories={categories}
            allAvailableTags={allAvailableTags}
            onTagSelect={handleTagSelect}
            onCategorySelect={handleCategorySelect}
            onStatusToggle={handleStatusToggle}
            viewMode={viewMode}
            setViewMode={setViewMode}
          />

          {/* Bulk Action Bar */}
          {selectedDocuments.length > 0 && (
            <BulkActionBar
              selectedCount={selectedDocuments.length}
              onClearSelection={() => setSelectedDocuments([])}
              onOpenModal={(modalType) =>
                setBulkModals((prev) => ({
                  ...prev,
                  [modalType]: true,
                }))
              }
            />
          )}

          {/* Success Message */}
          {successMessage && (
            <div className="bg-success-50 border border-success-200 text-success-700 px-4 py-3 rounded mb-4">
              {successMessage}
            </div>
          )}

          {/* Document List */}
          <DocumentList
            documents={documents}
            isLoading={isLoading}
            error={error}
            totalResults={totalResults}
            searchTerm={searchTerm}
            hasActiveFilters={hasActiveFilters}
            viewMode={viewMode}
            selectedDocuments={selectedDocuments}
            setSelectedDocuments={setSelectedDocuments}
            onTagClick={handleTagSelect}
            onCategoryClick={handleCategorySelect}
            clearFilters={clearFilters}
            router={router}
          />

          {/* Pagination */}
          <Pagination
            currentPage={currentPage}
            totalResults={totalResults}
            hasMoreResults={hasMoreResults}
            onPageChange={setCurrentPage}
            pageSize={100}
          />
        </div>
      </main>

      {/* Bulk Action Modals */}
      <BulkActionModals
        modals={bulkModals}
        setModals={setBulkModals}
        selectedDocuments={selectedDocuments}
        categories={categories}
        onSuccess={(message: string) => {
          setSuccessMessage(message);
          setSelectedDocuments([]);
          triggerRefresh();
          setTimeout(() => setSuccessMessage(""), 3000);
        }}
      />
    </Layout>
  );
}
