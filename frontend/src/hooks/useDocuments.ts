// hooks/useDocuments.ts
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { documentsAPI } from "@/utils/api";
import {
  searchDocuments as searchDocsUtil,
  parseSearchQuery,
} from "@/utils/searchUtils";
import type { Document } from "@/types/api";

export function useDocuments() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);

  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const pageSize = 100;

  // Store previous query to detect changes
  const prevQuery = useRef(router.query);

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch documents
  const fetchDocuments = async (params: Record<string, any> = {}) => {
    if (!isAuthenticated) return;

    try {
      setIsLoading(true);
      setError("");

      // Get filters from URL
      const { tags, category, status } = router.query;

      if (debouncedSearchTerm.trim()) {

        // Parse search query for advanced features
        const parsedQuery = parseSearchQuery(debouncedSearchTerm);

        const searchResult = await searchDocsUtil({
          query: debouncedSearchTerm,
          page: currentPage,
          limit: pageSize,
          // Include current filters in search
          ...(tags && typeof tags === "string" && { tags }),
          ...(category && typeof category === "string" && { category }),
          ...(status && typeof status === "string" && { status }),
        });

        setDocuments(searchResult.documents);
        setTotalResults(searchResult.totalCount);
        setHasMoreResults(searchResult.hasMore);
        setIsSearching(true);
      } else {
        // BROWSE MODE: Regular document listing with filters

        const requestParams: Record<string, any> = {
          limit: pageSize,
          page: currentPage,
          ...params,
        };

        // Apply filters from URL
        if (tags && typeof tags === "string") {
          requestParams.tags = tags;
        }

        if (category && typeof category === "string") {
          requestParams.category = category;
        }

        if (status && typeof status === "string") {
          requestParams.status = status;
        }

        const response = await documentsAPI.getDocuments(requestParams);
        const fetchedDocs = response.data.results || response.data.documents || [];
        const totalCount = response.data.count || (response.data.documents ? response.data.documents.length : 0);

        setDocuments(fetchedDocs);
        setTotalResults(totalCount);
        setHasMoreResults(totalCount > currentPage * pageSize);
        setIsSearching(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load documents. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch documents when dependencies change
  useEffect(() => {
    fetchDocuments();
  }, [
    isAuthenticated,
    currentPage,
    debouncedSearchTerm,
    refreshTrigger,
    router.query,
  ]);

  // Reset to page 1 when search term changes or filters change
  useEffect(() => {
    const queryChanged =
      JSON.stringify(router.query) !== JSON.stringify(prevQuery.current);
    const searchChanged = searchTerm !== debouncedSearchTerm;

    if (searchChanged || queryChanged) {
      setCurrentPage(1);
    }

    prevQuery.current = router.query;
  }, [searchTerm, debouncedSearchTerm, router.query]);

  const triggerRefresh = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  const clearSearch = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    setIsSearching(false);
    setCurrentPage(1);
  };

  return {
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
  };
}
