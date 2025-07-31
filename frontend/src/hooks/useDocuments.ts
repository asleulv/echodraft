// hooks/useDocuments.ts
import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { documentsAPI } from "@/utils/api";
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

      const requestParams = {
        limit: pageSize,
        page: currentPage,
        ...params
      };

      // Get filters from URL
      const { tags, category, status } = router.query;
      
      if (tags && typeof tags === "string") {
        requestParams.tags = tags;
      }
      
      if (category && typeof category === "string") {
        requestParams.category = category;
      }
      
      if (status && typeof status === "string") {
        requestParams.status = status;
      }

      let response;
      
      if (debouncedSearchTerm) {
        // Use search API
        response = await documentsAPI.searchDocuments(debouncedSearchTerm, requestParams);
        setIsSearching(true);
      } else {
        // Use regular documents API
        response = await documentsAPI.getDocuments(requestParams);
        setIsSearching(false);
      }

      const fetchedDocs = response.data.results || [];
      const totalCount = response.data.count || 0;

      setDocuments(fetchedDocs);
      setTotalResults(totalCount);
      setHasMoreResults(totalCount > currentPage * pageSize);

    } catch (err: any) {
      console.error("Failed to fetch documents:", err);
      setError("Failed to load documents");
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
    router.query
  ]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm !== debouncedSearchTerm) {
      setCurrentPage(1);
    }
  }, [searchTerm, debouncedSearchTerm]);

  const triggerRefresh = () => {
    setRefreshTrigger(prev => prev + 1);
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
    clearSearch
  };
}