import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import api, { documentsAPI, categoriesAPI } from "@/utils/api";
import type { Document, Category } from "@/types/api";
import Layout from "@/components/Layout";
import { formatDate } from "@/utils/dateUtils";
import {
  ChevronRight,
  Grid,
  List,
  Tag,
  CircleX,
  Box,
  X,
  Filter,
  ChevronDown,
  Trash2,
  Pencil,
  Layers,
  Search,
  CircleCheck,
} from "lucide-react";
import {
  BulkCategoryModal,
  BulkTagModal,
  BulkStatusModal,
  BulkDeleteModal,
} from "@/components/modals/BulkActionModals";

export default function Documents() {
  // State management for documents
  const [allDocuments, setAllDocuments] = useState<Document[]>([]); // All documents fetched from API
  const [filteredDocuments, setFilteredDocuments] = useState<Document[]>([]); // Documents after applying filters
  const [paginatedDocuments, setPaginatedDocuments] = useState<Document[]>([]); // Documents for current page
  const [documents, setDocuments] = useState<Document[]>([]); // Current documents to display (before filtering)
  const [clientFilteredDocuments, setClientFilteredDocuments] = useState<Document[]>([]); // Documents filtered on client side
  const [isLoading, setIsLoading] = useState(true);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [error, setError] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "draft",
    "published",
    "archived",
  ]);
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");
  const [categories, setCategories] = useState<Category[]>([]);
  const [isMobile, setIsMobile] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDocuments, setSelectedDocuments] = useState<number[]>([]);
  const [showBulkCategoryModal, setShowBulkCategoryModal] = useState(false);
  const [showBulkTagModal, setShowBulkTagModal] = useState(false);
  const [showBulkStatusModal, setShowBulkStatusModal] = useState(false);
  const [showBulkDeleteModal, setShowBulkDeleteModal] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreResults, setHasMoreResults] = useState(false);
  const [totalResults, setTotalResults] = useState(0);
  const [showAllTags, setShowAllTags] = useState(false);
  const [pageSize, setPageSize] = useState(100); // Number of documents per page - matches backend setting
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Reference to the search input element
  const searchInputRef = React.useRef<HTMLInputElement>(null);

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

  // Check URL for filter parameters and apply them
  useEffect(() => {
    console.log("URL parameters changed:", router.query);
    
    const { tags, category, status } = router.query;
    let filtersChanged = false;

    // Set tags filter from URL
    if (tags && typeof tags === "string") {
      const tagArray = tags.split(",");
      console.log("Setting tags from URL:", tagArray);
      setSelectedTags(tagArray);
      filtersChanged = true;
    } else if (!tags && selectedTags.length > 0) {
      console.log("Clearing tags because URL has no tags parameter");
      setSelectedTags([]);
      filtersChanged = true;
    }

    // Set category filter from URL
    if (category && typeof category === "string") {
      console.log("Setting category from URL:", category);
      setSelectedCategory(category);
      filtersChanged = true;
    } else if (!category && selectedCategory) {
      console.log("Clearing category because URL has no category parameter");
      setSelectedCategory(null);
      filtersChanged = true;
    }

    // Set status filter from URL
    if (status && typeof status === "string") {
      const statusArray = status.split(",");
      console.log("Setting statuses from URL:", statusArray);
      setSelectedStatuses(statusArray);
      filtersChanged = true;
    } else if (!status && selectedStatuses.length !== 3) {
      console.log("Resetting statuses to default because URL has no status parameter");
      setSelectedStatuses(["draft", "published", "archived"]);
      filtersChanged = true;
    }

    // If any filters changed, trigger a refresh
    if (filtersChanged) {
      console.log("Filters changed from URL, triggering refresh");
      // Reset to page 1 when filters change from URL
      setCurrentPage(1);
      // Trigger a refresh after a short delay to ensure state updates have completed
      setTimeout(() => {
        setRefreshTrigger(prev => prev + 1);
      }, 100);
    }
  }, [router.query]); // Only run when URL parameters change

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, [isAuthenticated]);

  // Fetch documents with pagination and server-side filtering
  useEffect(() => {
    const fetchDocuments = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoading(true);
        console.log("Starting document fetch with current filters");

        // Prepare filter parameters
        const params: Record<string, any> = {
          limit: pageSize,
          page: currentPage
        };

        // Add category filter if selected
        if (selectedCategory) {
          params.category = selectedCategory;
        }

        // Add status filter if not all statuses are selected
        if (selectedStatuses.length < 3) {
          params.status = selectedStatuses.join(",");
        }

        // Add tags filter if any tags are selected
        if (selectedTags.length > 0) {
          params.tags = selectedTags.join(",");
        }

        console.log("Fetching documents with params:", params);
        
        // Make a single API call with all filters applied
        const response = await documentsAPI.getDocuments(params);
        
        // Get the documents and total count
        const fetchedDocs = response.data.results || [];
        const totalDocuments = response.data.count || 0;
        
        console.log(`Fetched ${fetchedDocs.length} documents (page ${currentPage}), total: ${totalDocuments}`);
        
        // Update state with the fetched documents
        setDocuments(fetchedDocs);
        setFilteredDocuments(fetchedDocs);
        setTotalResults(totalDocuments);
        setHasMoreResults(totalDocuments > currentPage * pageSize);
        
        // If this is the first page, also update allDocuments for client-side operations
        if (currentPage === 1) {
          setAllDocuments(fetchedDocs);
        }
        
      } catch (err: any) {
        console.error("Error: Failed to load documents:", err);
        setError("Failed to load documents");
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, currentPage, pageSize, refreshTrigger, selectedCategory, selectedStatuses, selectedTags]);

  // Effect to maintain focus on search input
  useEffect(() => {
    // Focus the search input when searching
    if (isSearching && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isSearching, documents]); // Re-run when documents change (search results update)

  // Handle search - using the searchDocuments API function with pagination
  const handleSearch = async (
    term: string,
    page: number = 1,
    append: boolean = false
  ) => {
    if (!term.trim()) {
      // If search term is empty, reset to all documents
      setIsSearching(false);
      setIsSearchLoading(false);
      setDocuments(allDocuments);
      setFilteredDocuments([]);
      setCurrentPage(1);
      setHasMoreResults(false);
      setTotalResults(0);
      return;
    }

    if (page === 1) {
      setSearchTerm(term);
    }

    setIsSearching(true);
    if (!append) {
      setIsSearchLoading(true);
    }
    setError(""); // Clear any previous errors

    try {
      // Prepare additional parameters for filtering
      const additionalParams: Record<string, any> = {
        limit: pageSize, // Use the same page size as regular document fetching
        page: page,
      };

      // Add category filter if selected
      if (selectedCategory) {
        additionalParams.category = selectedCategory;
      }

      // Add status filter if not all statuses are selected
      if (selectedStatuses.length < 3) {
        additionalParams.status = selectedStatuses.join(",");
      }

      console.log(
        `Searching for term: "${term}" with params:`,
        additionalParams
      );

      // Call the searchDocuments API function
      const response = await documentsAPI.searchDocuments(
        term,
        additionalParams
      );
      const searchResults = response.data.results || [];
      const total = response.data.count || 0;

      console.log(`Search results:`, searchResults);
      console.log(`Number of results: ${searchResults.length}`);
      console.log(`Total results: ${total}`);

      // Check if there are more results to load
      setHasMoreResults(total > page * pageSize);
      setTotalResults(total);
      setCurrentPage(page);

      // Log some details about the results to help debug
      if (searchResults.length > 0) {
        console.log(`First result title: "${searchResults[0].title}"`);
        console.log(`First result tags:`, searchResults[0].tags);
        if (searchResults[0].plain_text) {
          console.log(
            `First result has plain_text: ${searchResults[0].plain_text.substring(
              0,
              100
            )}...`
          );
        } else {
          console.log(`First result has no plain_text`);
        }
      }

      if (append) {
        // Append new results to existing ones
        setDocuments((prevDocs) => [...prevDocs, ...searchResults]);
      } else {
        // Replace existing results
        setDocuments(searchResults);
      }
      setFilteredDocuments([]);
    } catch (err: any) {
      console.error("Failed to search documents:", err);
      setError("Failed to search documents. Try using simpler search terms.");

      // Fallback to client-side search if the API call fails
      const searchTermLower = term.toLowerCase();

      // Filter documents that match the search term in title, content, or tags
      const searchResults = allDocuments.filter((doc: Document) => {
        // Search in title
        if (doc.title.toLowerCase().includes(searchTermLower)) {
          return true;
        }

        // Search in plain_text content if available
        if (
          doc.plain_text &&
          doc.plain_text.toLowerCase().includes(searchTermLower)
        ) {
          return true;
        }

        // Search in tags
        if (
          doc.tags.some((tag) => tag.toLowerCase().includes(searchTermLower))
        ) {
          return true;
        }

        return false;
      });

      console.log(`Fallback client-side search results:`, searchResults);

      setDocuments(searchResults);
      setHasMoreResults(false);
      setTotalResults(searchResults.length);
    } finally {
      setIsLoading(false);
      setIsSearchLoading(false);

      // Ensure focus is maintained after search completes
      if (searchInputRef.current) {
        searchInputRef.current.focus();
      }
    }
  };

  // Load more results
  const loadMoreResults = () => {
    if (searchTerm && hasMoreResults) {
      handleSearch(searchTerm, currentPage + 1, true);
    }
  };

  // State for storing all available tags across all documents
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([]);
  const [isLoadingTags, setIsLoadingTags] = useState(false);
  
  // Function to extract unique tags from documents
  const extractTagsFromDocuments = (documents: Document[]) => {
    const uniqueTags = new Set<string>();
    documents.forEach((doc) => {
      if (doc.tags && Array.isArray(doc.tags)) {
        doc.tags.forEach((tag) => uniqueTags.add(tag));
      }
    });
    return Array.from(uniqueTags).sort();
  };
  
  // Fetch ALL tags from ALL documents across ALL pages - completely separate from pagination
  useEffect(() => {
    const fetchAllTags = async () => {
      if (!isAuthenticated) return;
      
      setIsLoadingTags(true);
      console.log("CRITICAL: Fetching ALL documents across ALL pages for tag extraction...");
      
      try {
        // First, get the total count with a small request
        const countResponse = await documentsAPI.getDocuments({
          limit: 1,
          page: 1,
          latest_only: true
        });
        
        const totalDocuments = countResponse.data.count || 0;
        console.log(`CRITICAL: Total documents in system for tag extraction: ${totalDocuments}`);
        
        // Calculate how many pages we need to fetch
        const pageSize = 100; // Backend page size
        const totalPages = Math.ceil(totalDocuments / pageSize);
        console.log(`CRITICAL: Need to fetch ${totalPages} pages to get all documents for tag extraction`);
        
        // Fetch all pages in parallel
        const pagePromises = [];
        for (let page = 1; page <= totalPages; page++) {
          pagePromises.push(
            documentsAPI.getDocuments({
              limit: pageSize,
              page: page,
              latest_only: true
            })
          );
        }
        
        console.log(`CRITICAL: Fetching ${pagePromises.length} pages in parallel for tag extraction`);
        const pageResponses = await Promise.all(pagePromises);
        
        // Combine all documents from all pages
        const allDocs = pageResponses.flatMap(response => response.data.results || []);
        console.log(`CRITICAL: Successfully fetched ALL ${allDocs.length} documents across ${pageResponses.length} pages for tag extraction`);
        
        // Extract all unique tags from ALL documents
        const uniqueTags = new Set<string>();
        
        // Process each document to extract tags
        allDocs.forEach((doc: any) => {
          if (doc.tags && Array.isArray(doc.tags)) {
            doc.tags.forEach((tag: string) => {
              uniqueTags.add(tag);
            });
          }
        });
        
        const tagArray = Array.from(uniqueTags).sort();
        console.log(`CRITICAL: Extracted ${uniqueTags.size} unique tags from ALL documents`);
        console.log(`All available tags: ${tagArray.join(', ')}`);
        
        // Update state with ALL tags
        setAllAvailableTags(tagArray);
      } catch (err) {
        console.error("CRITICAL ERROR: Failed to fetch ALL documents for tag extraction:", err);
        
        // Try a different approach as fallback
        try {
          console.log("FALLBACK: Trying direct API call to fetch ALL documents");
          
          // Use direct fetch as a fallback
          const response = await fetch('/api/v1/documents?limit=10000&latest_only=true', {
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('token')}`,
              'Content-Type': 'application/json'
            }
          });
          
          if (!response.ok) {
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          const docs = data.results || [];
          console.log(`FALLBACK: Received ${docs.length} documents for tag extraction`);
          
          // Extract all unique tags
          const uniqueTags = new Set<string>();
          docs.forEach((doc: any) => {
            if (doc.tags && Array.isArray(doc.tags)) {
              doc.tags.forEach((tag: string) => uniqueTags.add(tag));
            }
          });
          
          const tagArray = Array.from(uniqueTags).sort();
          console.log(`FALLBACK: Extracted ${uniqueTags.size} unique tags`);
          
          setAllAvailableTags(tagArray);
        } catch (fallbackErr) {
          console.error("FALLBACK ERROR: Failed with direct API call:", fallbackErr);
          
          // Last resort: collect tags from current documents
          const uniqueTags = new Set<string>();
          allDocuments.forEach((doc) => {
            if (doc.tags && Array.isArray(doc.tags)) {
              doc.tags.forEach((tag) => uniqueTags.add(tag));
            }
          });
          
          const tagArray = Array.from(uniqueTags).sort();
          console.log(`LAST RESORT: Using ${tagArray.length} tags from current documents`);
          
          setAllAvailableTags(tagArray);
        }
      } finally {
        setIsLoadingTags(false);
      }
    };
    
    // Execute this immediately on component mount
    fetchAllTags();
    
    // Also set up an interval to refresh tags periodically
    const intervalId = setInterval(fetchAllTags, 60000); // Refresh every minute
    
    // Clean up interval on unmount
    return () => clearInterval(intervalId);
  }, [isAuthenticated]); // Only run when authentication changes
  
  // Get filtered tags for the tag selector
  const getFilteredTags = () => {
    // Filter tags based on input
    const filteredTags = allAvailableTags.filter((tag) =>
      tag.toLowerCase().includes(tagInput.toLowerCase())
    );

    // Return top 10 filtered tags
    return filteredTags.slice(0, 10).sort();
  };

  // Perform client-side filtering immediately while waiting for API results
  const performClientSideFiltering = (term: string) => {
    if (!term.trim() || allDocuments.length === 0) return;

    const searchTermLower = term.toLowerCase();

    // Filter documents that match the search term in title, content, or tags
    const filteredResults = allDocuments.filter((doc: Document) => {
      // Search in title
      if (doc.title.toLowerCase().includes(searchTermLower)) {
        return true;
      }

      // Search in plain_text content if available
      if (
        doc.plain_text &&
        doc.plain_text.toLowerCase().includes(searchTermLower)
      ) {
        return true;
      }

      // Search in tags
      if (doc.tags.some((tag) => tag.toLowerCase().includes(searchTermLower))) {
        return true;
      }

      return false;
    });

    // Update client-filtered documents for immediate display
    setClientFilteredDocuments(filteredResults);

    // If we're not already searching, update the documents display
    if (!isSearching) {
      setDocuments(filteredResults);
    }
  };

  // Improved debounced search function
  useEffect(() => {
    // Immediately perform client-side filtering for responsive UI
    if (searchTerm.trim()) {
      performClientSideFiltering(searchTerm);
      setIsSearching(true);
      setIsSearchLoading(true);
    } else {
      // If search term is cleared, reset to all documents
      setIsSearching(false);
      setDocuments(allDocuments);
      setClientFilteredDocuments([]);
      setDebouncedSearchTerm("");
      return;
    }

    // Set up debounce for API search
    const delayDebounceFn = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm, allDocuments]);

  // Trigger API search when debounced search term changes
  useEffect(() => {
    if (debouncedSearchTerm) {
      handleSearch(debouncedSearchTerm);
    }
  }, [debouncedSearchTerm]);

  // Apply filters whenever filter criteria change
  useEffect(() => {
    if (allDocuments.length === 0) return;

    let filtered = [...allDocuments];

    // Filter by tags
    if (selectedTags.length > 0) {
      filtered = filtered.filter((doc) =>
        selectedTags.every((tag) => doc.tags.includes(tag))
      );
    }
    // Filter by category
    if (selectedCategory) {
      if (selectedCategory === "null") {
        // Filter for uncategorized documents
        filtered = filtered.filter((doc) => !doc.category);
      } else {
        filtered = filtered.filter(
          (doc) => doc.category?.toString() === selectedCategory
        );
      }
    }

    // Filter by status
    if (selectedStatuses.length === 0) {
      // If no statuses selected, show no documents
      filtered = [];
    } else if (selectedStatuses.length < 3) {
      // If some (but not all) statuses selected, filter by those statuses
      filtered = filtered.filter((doc) =>
        selectedStatuses.includes(doc.status)
      );
    }

    setFilteredDocuments(filtered);
  }, [allDocuments, selectedTags, selectedCategory, selectedStatuses]);

  // Handle tag selection - SIMPLIFIED to avoid routing issues
  const handleTagSelect = (tag: string) => {
    try {
      console.log(`Tag selected: ${tag}`);
      
      // Update selected tags first
      const newTags = selectedTags.includes(tag)
        ? selectedTags.filter((t) => t !== tag)
        : [...selectedTags, tag];
      
      // Set the new tags
      setSelectedTags(newTags);
      
      // Reset to page 1 when changing filters
      setCurrentPage(1);
      
      // Update URL with the new tags - using shallow routing to avoid full page refresh
      const query: Record<string, string> = {};
      
      // Add tags if any are selected
      if (newTags.length > 0) {
        query.tags = newTags.join(",");
      }
      
      // Add category if selected
      if (selectedCategory) {
        query.category = selectedCategory;
      }
      
      // Add status if not all statuses are selected
      if (selectedStatuses.length < 3) {
        query.status = selectedStatuses.join(",");
      }
      
      // Use router.replace instead of push to avoid adding to history stack
      router.replace(
        {
          pathname: "/documents",
          query
        },
        undefined,
        { shallow: true }
      );
      
      // Trigger a refresh to fetch documents with the new filters
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error in handleTagSelect:", err);
      setError("Failed to apply tag filter. Please try again.");
    }
  };

  // Handle tag click (for backward compatibility)
  const handleTagClick = (tag: string) => {
    console.log(`Tag clicked: ${tag}`);
    handleTagSelect(tag);
  };

  // Handle category selection
  const handleCategorySelect = (categoryId: string | null) => {
    try {
      console.log(`Category selected: ${categoryId}`);
      
      // Set the new category
      setSelectedCategory(categoryId);
      
      // Reset to page 1 when changing filters
      setCurrentPage(1);
      
      // Clear any existing errors
      setError("");
      
      // Update URL to reflect the category filter
      updateUrlWithFilters({ category: categoryId });
      
      // Trigger a refresh to fetch documents with the new category filter
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error in handleCategorySelect:", err);
      setError("Failed to apply category filter. Please try again.");
    }
  };

  // Handle status selection
  const handleStatusToggle = (status: string) => {
    try {
      console.log(`Status toggled: ${status}`);
      
      let newStatuses;
      if (selectedStatuses.includes(status)) {
        // Remove status if already selected
        console.log(`Removing status: ${status} from selected statuses`);
        newStatuses = selectedStatuses.filter((s) => s !== status);
      } else {
        // Add status if not selected
        console.log(`Adding status: ${status} to selected statuses`);
        newStatuses = [...selectedStatuses, status];
      }
      
      // Set the new statuses
      setSelectedStatuses(newStatuses);
      console.log(`New selected statuses: ${newStatuses.join(', ')}`);
      
      // Reset to page 1 when changing filters
      setCurrentPage(1);
      
      // Clear any existing errors
      setError("");
      
      // Update URL to reflect the status filter
      updateUrlWithFilters({ status: newStatuses.length > 0 ? newStatuses.join(",") : null });
      
      // Trigger a refresh to fetch documents with the new status filter
      setRefreshTrigger(prev => prev + 1);
    } catch (err) {
      console.error("Error in handleStatusToggle:", err);
      setError("Failed to apply status filter. Please try again.");
    }
  };

  // Clear all filters
  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCategory(null);
    setSelectedStatuses(["draft", "published", "archived"]);
    router.push("/documents", undefined, { shallow: true });
  };

  // Update URL with filters
  const updateUrlWithFilters = (newFilters: Record<string, string | null>) => {
    console.log("Updating URL with filters:", newFilters);
    
    const query: Record<string, string> = {};

    // Preserve existing filters
    if (selectedTags.length > 0 && !("tags" in newFilters)) {
      query.tags = selectedTags.join(",");
    }

    if (selectedCategory && !("category" in newFilters)) {
      query.category = selectedCategory;
    }

    if (selectedStatuses.length < 3 && !("status" in newFilters)) {
      query.status = selectedStatuses.join(",");
    }

    // Add new filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null) {
        query[key] = value;
      }
    });

    console.log("Final query parameters:", query);

    // Update URL
    router.push(
      {
        pathname: "/documents",
        query,
      },
      undefined,
      { shallow: true }
    );
    
    // Trigger a refresh to fetch documents with the new filters
    setRefreshTrigger(prev => prev + 1);
  };

  // Toggle view mode
  const toggleViewMode = () => {
    setViewMode(viewMode === "grid" ? "list" : "grid");
  };

  // Toggle filters visibility
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  // Function to load the next page of documents
  const loadNextPage = () => {
    setCurrentPage((prevPage) => prevPage + 1);
  };

  // Function to load the previous page of documents
  const loadPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage((prevPage) => prevPage - 1);
    }
  };

  // Only show full-page loading on initial load
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  // Check if any filters are active
  const hasActiveFilters =
    selectedTags.length > 0 || selectedCategory || selectedStatuses.length < 3;

  // Determine which documents to display
  // If filters are active, always use filteredDocuments (even if empty)
  // Otherwise, use documents
  const displayDocuments = hasActiveFilters ? filteredDocuments : documents;

  return (
    <Layout title="Documents">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* Search Bar */}
          <div className="mb-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                {isSearchLoading ? (
                  <div className="animate-spin h-5 w-5 border-2 border-primary-400 border-t-transparent rounded-full"></div>
                ) : (
                  <Search className="h-5 w-5 text-primary-400" />
                )}
              </div>
              <input
                ref={searchInputRef}
                type="text"
                className="form-input pl-10 w-full transition-all duration-200 placeholder-primary-400"
                placeholder="Search documents, tags, or content..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  if (!e.target.value.trim()) {
                    setIsSearching(false);
                    setIsSearchLoading(false);
                    // Reset to all documents if search is cleared
                    setDocuments(allDocuments);
                    setFilteredDocuments([]);
                  }
                }}
                autoFocus={false} // Disabled autofocus to prevent keyboard popup on mobile
              />
              <div className="absolute inset-y-0 right-0 flex items-center">
                {searchTerm && (
                  <button
                    className="pr-3 flex items-center"
                    onClick={() => {
                      setSearchTerm("");
                      setIsSearching(false);
                      setIsSearchLoading(false);
                      // Reset to all documents
                      setDocuments(allDocuments);
                      setFilteredDocuments([]);
                      setClientFilteredDocuments([]);
                      // Focus the search input after clearing
                      if (searchInputRef.current) {
                        searchInputRef.current.focus();
                      }
                    }}
                  >
                    <X className="h-5 w-5 text-primary-400 hover:text-primary-500" />
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Filter Section */}
          <div className="mb-6">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-primary-50 border border-primary-200 dark:border-primary-300 rounded-lg shadow-sm mb-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3">
                <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
                  <button
                    onClick={toggleFilters}
                    className="flex items-center px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-md transition-colors duration-200 mr-3"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    <span className="font-medium">Filters</span>
                    <ChevronDown
                      className={`w-4 h-4 ml-2 transition-transform ${
                        showFilters ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {hasActiveFilters && (
                    <button
                      onClick={clearFilters}
                      className="flex items-center px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-md transition-colors duration-200"
                    >
                      <X className="w-3 h-3 mr-2" />
                      <span className="font-medium">Clear filters</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  {/* Active filter count badge */}
                  {hasActiveFilters && (
                    <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm font-medium mr-2">
                      {selectedTags.length + (selectedCategory ? 1 : 0) + (selectedStatuses.length < 3 ? 1 : 0)} active filters
                    </span>
                  )}
                  
                  {/* View mode toggle */}
                  <button
                    onClick={toggleViewMode}
                    className="p-2 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors duration-200"
                    aria-label={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
                    title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
                  >
                    {viewMode === "grid" ? (
                      <List className="w-4 h-4" />
                    ) : (
                      <Grid className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              
              {/* Filter controls */}
              {showFilters && (
                <div className="border-t border-primary-200 dark:border-primary-300 p-5 bg-primary-50 dark:bg-primary-100 rounded-b-lg">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {/* Category filter */}
                    <div className="filter-section">
                      <label
                        htmlFor="category-filter"
                        className="block text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2"
                      >
                        Category
                      </label>
                      <select
                        id="category-filter"
                        className="form-input w-full shadow-sm focus:ring-primary-500 focus:border-primary-500"
                        value={selectedCategory || ""}
                        onChange={(e) =>
                          handleCategorySelect(e.target.value || null)
                        }
                      >
                        <option value="">All Categories</option>
                        <option value="null">Uncategorized</option>
                        {categories.map((category) => (
                          <option
                            key={category.id}
                            value={category.id.toString()}
                          >
                            {category.name}
                          </option>
                        ))}
                      </select>
                      {selectedCategory && (
                        <div className="mt-2 text-xs text-primary-500">
                          Selected: {categories.find(c => c.id.toString() === selectedCategory)?.name || "Uncategorized"}
                        </div>
                      )}
                    </div>

                    {/* Status filter */}
                    <div className="filter-section">
                      <span className="block text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                        Status
                      </span>
                      <div className="flex flex-wrap gap-2">
                        {[
                          { id: "draft", label: "Draft" },
                          { id: "published", label: "Published" },
                          { id: "archived", label: "Archived" },
                        ].map((status) => (
                          <button
                            key={status.id}
                            type="button"
                            onClick={() => handleStatusToggle(status.id)}
                            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                              selectedStatuses.includes(status.id)
                                ? "bg-primary-300 text-primary-600" // Selected button (same as original)
                                : "bg-primary-100 text-primary-400 hover:bg-primary-200" // Unselected button (same as original)
                            }`}
                          >
                            {status.label}
                          </button>
                        ))}
                      </div>
                      <div className="mt-2 text-xs text-primary-500">
                        {selectedStatuses.length === 3 
                          ? "All statuses selected" 
                          : `Selected: ${selectedStatuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}`}
                      </div>
                    </div>

                    {/* Tag filter */}
                    <div className="filter-section">
                      <label className="block text-sm font-semibold text-primary-700 dark:text-primary-300 mb-2">
                        Tags
                      </label>
                      <div className="relative">
                        <input
                          type="text"
                          className="form-input w-full shadow-sm focus:ring-primary-500 focus:border-primary-500"
                          placeholder="Search tags..."
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                        />
                        <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-white dark:bg-primary-50 rounded-md border border-primary-200 dark:border-primary-300">
                          {getFilteredTags().length > 0 ? (
                            getFilteredTags().map((tag) => (
                              <button
                                key={tag}
                                onClick={() => handleTagSelect(tag)}
                                className={`px-2 py-1 text-xs font-medium rounded-md ${
                                  selectedTags.includes(tag)
                                    ? "bg-primary-300 text-primary-800 border border-primary-0 dark:border-primary-100"
                                    : "bg-primary-100 text-primary-400 dark:text-primary-600 border border-primary-400 hover:bg-primary-200"
                                }`}
                              >
                                {tag}
                              </button>
                            ))
                          ) : (
                            <span className="text-xs text-primary-400 italic">No matching tags found</span>
                          )}
                        </div>
                        {selectedTags.length > 0 && (
                          <div className="mt-2 text-xs text-primary-500">
                            Selected: {selectedTags.join(", ")}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>


          {/* Documents Section */}
          <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg p-1 sm:p-4 mb-6 min-h-[400px]">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
              <h2 className="text-xl font-light text-primary-500 text-center sm:text-left">
                {isSearching
                  ? `Search Results for "${searchTerm}"`
                  : hasActiveFilters
                  ? "Filtered Documents"
                  : "All Documents"}
                <span className="ml-2 text-sm text-primary-400">
                  {isLoading ? (
                    <span className="opacity-50">Loading...</span>
                  ) : (
                    <>
                      ({totalResults}
                      {isSearching && totalResults > displayDocuments.length
                        ? ` results, showing ${displayDocuments.length}`
                        : " documents"}
                      )
                    </>
                  )}
                </span>
              </h2>

              {/* Bulk action buttons - only show when documents are selected */}
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
                    onClick={() => setShowBulkCategoryModal(true)}
                    className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
                    title="Change category"
                  >
                    <Box className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowBulkTagModal(true)}
                    className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
                    title="Add tags"
                  >
                    <Tag className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowBulkStatusModal(true)}
                    className="p-1.5 rounded text-primary-500 bg-primary-200 hover:bg-primary-50"
                    title="Change status"
                  >
                    <Layers className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setShowBulkDeleteModal(true)}
                    className="p-1.5 rounded text-danger-500 bg-primary-200 hover:bg-danger-100"
                    title="Move to trash"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>

            {/* Success message */}
            {successMessage && (
              <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-4">
                {successMessage}
              </div>
            )}

            {/* Document display */}
            {error ? (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                {error}
              </div>
            ) : displayDocuments.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-primary-500">
                  {hasActiveFilters
                    ? "No documents match your filters. Try adjusting your filter criteria."
                    : "No documents found"}
                </p>
                {!hasActiveFilters && (
                  <button
                    onClick={() => router.push("/documents/new")}
                    className="mt-4 btn-primary"
                  >
                    Create a document
                  </button>
                )}
                {hasActiveFilters && (
                  <button onClick={clearFilters} className="mt-4 btn-primary">
                    Clear all filters
                  </button>
                )}
              </div>
            ) : viewMode === "grid" ? (
              // Grid View - always show on grid mode regardless of screen size
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
                {displayDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`relative border border-primary-200 dark:border-primary-200 rounded-lg p-4 hover:shadow-md dark:hover:shadow-white/10 transition-shadow cursor-pointer ${
                      selectedDocuments.includes(doc.id)
                        ? "bg-primary-200 dark:bg-primary-200"
                        : "bg-white dark:bg-primary-100"
                    }`}
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: doc.category_color || "#9CA3AF", // Use category color or gray for uncategorized
                    }}
                  >
                    <div className="absolute top-2 right-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedDocuments((prev) => [...prev, doc.id]);
                            } else {
                              setSelectedDocuments((prev) =>
                                prev.filter((id) => id !== doc.id)
                              );
                            }
                          }}
                        />
                        <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50 peer-focus:ring peer-focus:ring-primary-400">
                          {selectedDocuments.includes(doc.id) && (
                            <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                          )}
                        </span>
                      </label>
                    </div>

                    {/* Title Clickable Area */}
                    <div className="flex items-center mb-2">
                      <ChevronRight className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mr-2" />
                      <span
                        className="document-title font-semibold truncate max-w-[80%] overflow-hidden whitespace-nowrap text-primary-600 dark:text-primary-600 cursor-pointer"
                        onClick={(e) => {
                          // Navigate to the document page when the title is clicked
                          router.push(`/documents/${doc.slug}`);
                        }}
                      >
                        {doc.title}
                      </span>
                      {doc.version > 1 && (
                        <span className="ml-1 px-1 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
                          v{doc.version}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      {doc.category_name ? (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex items-center cursor-pointer hover:bg-primary-400"
                          style={{
                            backgroundColor:
                              `${doc.category_color}20` || "#9CA3AF20",
                            color: doc.category_color || "#9CA3AF",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorySelect(
                              doc.category?.toString() || null
                            );
                          }}
                        >
                          {doc.category_name}
                        </span>
                      ) : (
                        <span
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-primary-200 text-gray-600 dark:text-primary-400 whitespace-nowrap flex items-center cursor-pointer hover:bg-primary-300"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorySelect("null");
                          }}
                        >
                          Uncategorized
                        </span>
                      )}
                        <span className="text-xs text-primary-500 dark:text-primary-400">
                          {formatDate(doc.updated_at)}
                        </span>
                    </div>

                    {doc.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {doc.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleTagClick(tag);
                            }}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 dark:text-primary-400 hover:bg-primary-300 cursor-pointer"
                          >
                            {tag}
                          </span>
                        ))}
                        {doc.tags.length > 3 && (
                          <span className="text-xs text-primary-500 dark:text-primary-400">
                            +{doc.tags.length - 3} more
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : isMobile ? (
              // Grid View for mobile when in list mode
              <div className="grid grid-cols-1 gap-2">
                {displayDocuments.map((doc) => (
                  <div
                    key={doc.id}
                    className={`relative border border-primary-200 dark:border-primary-200 rounded-lg p-4 hover:shadow-md dark:hover:shadow-white/10 transition-shadow cursor-pointer ${
                      selectedDocuments.includes(doc.id)
                        ? "bg-primary-200 dark:bg-primary-200"
                        : "bg-white dark:bg-primary-100"
                    }`}
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: doc.category_color || "#9CA3AF", // Use category color or gray for uncategorized
                    }}
                  >
                    <div className="absolute top-2 right-2">
                      <label className="flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          className="sr-only peer"
                          checked={selectedDocuments.includes(doc.id)}
                          onChange={(e) => {
                            e.stopPropagation();
                            if (e.target.checked) {
                              setSelectedDocuments((prev) => [...prev, doc.id]);
                            } else {
                              setSelectedDocuments((prev) =>
                                prev.filter((id) => id !== doc.id)
                              );
                            }
                          }}
                        />
                        <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50 peer-focus:ring peer-focus:ring-primary-400">
                          {selectedDocuments.includes(doc.id) && (
                            <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                          )}
                        </span>
                      </label>
                    </div>

                    <div className="flex items-center mb-2">
                      <ChevronRight className="w-5 h-5 text-primary-600 dark:text-primary-400 flex-shrink-0 mr-2" />
                      <span
                        className="document-title font-semibold truncate max-w-[80%] overflow-hidden whitespace-nowrap text-primary-600 dark:text-primary-600 cursor-pointer"
                        onClick={(e) => {
                          // Stop event propagation to prevent triggering the parent div's onClick
                          e.stopPropagation();
                          // Navigate to the document page when the title is clicked
                          router.push(`/documents/${doc.slug}`);
                        }}
                      >
                        {doc.title}
                      </span>
                      {doc.version > 1 && (
                        <span className="ml-1 px-1 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
                          v{doc.version}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center justify-between mb-2">
                      {doc.category_name ? (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer hover:bg-secondary-400"
                          style={{
                            backgroundColor:
                              `${doc.category_color}20` || "#9CA3AF20",
                            color: doc.category_color || "#9CA3AF",
                          }}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorySelect(
                              doc.category?.toString() || null
                            );
                          }}
                        >
                          {doc.category_name}
                        </span>
                      ) : (
                        <span
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-primary-200 text-gray-600 dark:text-primary-400 hover:bg-secondary-400 cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCategorySelect("null");
                          }}
                        >
                          Uncategorized
                        </span>
                      )}
                      <span className="text-xs text-primary-500 dark:text-primary-400">
                        {formatDate(doc.updated_at)}
                      </span>
                    </div>

                    {doc.tags.length > 0 && (
                      <>
                        {/* First row: 3 tags max + "more" */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {doc.tags.slice(0, 3).map((tag) => (
                            <span
                              key={tag}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleTagClick(tag);
                              }}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 dark:text-primary-500 cursor-pointer"
                            >
                              {tag}
                            </span>
                          ))}

                          {doc.tags.length > 3 && !showAllTags && (
                            <span
                              onClick={() => setShowAllTags(true)}
                              className="inline-flex items-center text-xs text-primary-500 dark:text-primary-400 cursor-pointer"
                            >
                              +{doc.tags.length - 3} more
                            </span>
                          )}
                        </div>

                        {/* Second row: hidden tags when expanded */}
                        {showAllTags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {doc.tags.slice(3).map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagClick(tag);
                                }}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 dark:text-primary-500 cursor-pointer"
                              >
                                {tag}
                              </span>
                            ))}
                            <span
                              onClick={() => setShowAllTags(false)}
                              className="inline-flex items-center text-xs text-primary-500 dark:text-primary-400 cursor-pointer"
                            >
                              View Less
                            </span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              // Table View for desktop - removed the 'hidden md:block' class that was causing the issue
              <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                <table className="min-w-full divide-y divide-primary-200">
                  <thead className="bg-primary-100">
                    <tr>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-4 pr-3 w-12"
                      >
                        <label className="flex items-center cursor-pointer">
                          <input
                            type="checkbox"
                            className="hidden"
                            checked={
                              selectedDocuments.length > 0 &&
                              selectedDocuments.length ===
                                displayDocuments.length
                            }
                            onChange={(e) => {
                              if (e.target.checked) {
                                // Select all documents
                                setSelectedDocuments(
                                  displayDocuments.map((doc) => doc.id)
                                );
                              } else {
                                // Deselect all documents
                                setSelectedDocuments([]);
                              }
                            }}
                          />
                          <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50">
                            {selectedDocuments.length > 0 &&
                              selectedDocuments.length ===
                                displayDocuments.length && (
                                <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                              )}
                          </span>
                        </label>
                      </th>

                      <th
                        scope="col"
                        className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500"
                      >
                        Title
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                      >
                        Category
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                      >
                        Tags
                      </th>
                      <th
                        scope="col"
                        className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                      >
                        Updated
                      </th>
                      <th
                        scope="col"
                        className="relative py-3.5 pl-3 pr-4 sm:pr-6"
                      >
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-primary-200 bg-white dark:bg-primary-50">
                    {displayDocuments.map((doc) => (
                      <tr
                        key={doc.id}
                        className={`transition-colors cursor-pointer ${
                          selectedDocuments.includes(doc.id)
                            ? "bg-primary-200 dark:bg-primary-150"
                            : "bg-primary-50 dark:bg-primary-50"
                        } hover:bg-primary-100 dark:hover:bg-primary-100`}
                      >
                        {/* Checkbox column */}
                        <td className="relative whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              className="hidden"
                              checked={selectedDocuments.includes(doc.id)}
                              onChange={(e) => {
                                e.stopPropagation();
                                if (e.target.checked) {
                                  setSelectedDocuments((prev) => [
                                    ...prev,
                                    doc.id,
                                  ]);
                                } else {
                                  setSelectedDocuments((prev) =>
                                    prev.filter((id) => id !== doc.id)
                                  );
                                }
                              }}
                              onClick={(e) => e.stopPropagation()}
                            />
                            <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50">
                              {selectedDocuments.includes(doc.id) && (
                                <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                              )}
                            </span>
                          </label>
                        </td>

                        {/* Document title column */}
                        <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
                          <div className="flex items-center">
                            <ChevronRight
                              className="h-4 w-4 flex-shrink-0 mr-2"
                              style={{
                                color: doc.category_color
                                  ? `${doc.category_color}80`
                                  : "#9CA3AF80",
                              }}
                            />
                            <span
                              className="document-title font-medium text-primary-600 dark:text-primary-600 cursor-pointer hover:text-primary-950 dark:hover:text-primary-800 overflow-hidden text-ellipsis whitespace-nowrap max-w-[250px]"
                              onClick={() =>
                                router.push(`/documents/${doc.slug}`)
                              }
                            >
                              {doc.title}
                            </span>
                            {doc.version > 1 && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
                                v{doc.version}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Category Column */}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                          {doc.category_name ? (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200"
                              style={{
                                backgroundColor:
                                  `${doc.category_color}20` || "#9CA3AF20",
                                color: doc.category_color || "#9CA3AF",
                                position: "relative",
                                overflow: "hidden",
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategorySelect(
                                  doc.category?.toString() || null
                                );
                              }}
                              onMouseOver={(e) => {
                                e.currentTarget.style.boxShadow =
                                  "inset 0 0 0 9999px rgba(0, 0, 0, 0.1)"; // Adds a dark overlay
                              }}
                              onMouseOut={(e) => {
                                e.currentTarget.style.boxShadow = "none"; // Removes the overlay effect
                              }}
                            >
                              {doc.category_name}
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 dark:bg-primary-200 text-gray-600 dark:text-primary-400 hover:bg-primary-300 cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCategorySelect("null");
                              }}
                            >
                              Uncategorized
                            </span>
                          )}
                        </td>

                        {/* Tags Column */}

                        <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                          {/* Inline tags + "+X more" */}
                          <div className="flex flex-wrap gap-1">
                            {doc.tags.slice(0, 5).map((tag) => (
                              <span
                                key={tag}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleTagClick(tag);
                                }}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 dark:text-primary-500 hover:bg-primary-300 cursor-pointer"
                              >
                                {tag}
                              </span>
                            ))}

                            {/* "+X more" on the same line */}
                            {doc.tags.length > 5 && !showAllTags && (
                              <span
                                onClick={() => setShowAllTags(true)}
                                className="inline-flex items-center text-xs text-primary-500 dark:text-primary-400 cursor-pointer"
                              >
                                +{doc.tags.length - 5} more
                              </span>
                            )}
                          </div>

                          {/* Extra tags below, in a new line when toggled */}
                          {showAllTags && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {doc.tags.slice(5).map((tag) => (
                                <span
                                  key={tag}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleTagClick(tag);
                                  }}
                                  className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 dark:text-primary-500 hover:bg-primary-300 cursor-pointer"
                                >
                                  {tag}
                                </span>
                              ))}
                              {/* "View Less" button inline with extra tags */}
                              <span
                                onClick={() => setShowAllTags(false)}
                                className="inline-flex items-center text-xs text-primary-500 dark:text-primary-400 cursor-pointer"
                              >
                                View Less
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Last Updated Column */}
                        <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                          {formatDate(doc.updated_at)}
                        </td>

                        {/* Edit Button */}
                        <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              router.push(`/documents/${doc.slug}/edit`);
                            }}
                            className="text-primary-400 hover:text-primary-600 mr-3"
                          >
                            <Pencil className="h-4 w-4" />
                            <span className="sr-only">Edit</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination controls */}
            <div className="mt-6 flex justify-between items-center">
              {currentPage > 1 && (
                <button
                  onClick={loadPreviousPage}
                  className="px-4 py-2 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700"
                >
                  Previous
                </button>
              )}
              {currentPage <= 1 && <div></div>} {/* Empty div for spacing when Previous is hidden */}

              <span className="text-primary-600">
                Page {currentPage} of {Math.ceil(totalResults / pageSize)}
              </span>

              {hasMoreResults && (
                <button
                  onClick={loadNextPage}
                  className="px-4 py-2 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700"
                >
                  Next
                </button>
              )}
              {!hasMoreResults && <div></div>} {/* Empty div for spacing when Next is hidden */}
            </div>
          </div>
        </div>
      </main>

      {/* Bulk action modals */}
      {showBulkCategoryModal && (
        <BulkCategoryModal
          isOpen={showBulkCategoryModal}
          onClose={() => setShowBulkCategoryModal(false)}
          documentIds={selectedDocuments}
          categories={categories}
          onSuccess={() => {
            setSuccessMessage("Categories updated successfully");
            setSelectedDocuments([]);
            // Trigger a refresh of the documents
            setRefreshTrigger((prev) => prev + 1);
            setTimeout(() => {
              setSuccessMessage("");
            }, 3000);
          }}
        />
      )}

      {showBulkTagModal && (
        <BulkTagModal
          isOpen={showBulkTagModal}
          onClose={() => setShowBulkTagModal(false)}
          documentIds={selectedDocuments}
          onSuccess={() => {
            setSuccessMessage("Status updated successfully");
            setSelectedDocuments([]);
            // Trigger a refresh of the documents
            setRefreshTrigger((prev) => prev + 1);
            setTimeout(() => {
              setSuccessMessage("");
            }, 3000);
          }}
        />
      )}

      {showBulkStatusModal && (
        <BulkStatusModal
          isOpen={showBulkStatusModal}
          onClose={() => setShowBulkStatusModal(false)}
          documentIds={selectedDocuments}
          onSuccess={() => {
            setSuccessMessage("Status updated successfully");
            setSelectedDocuments([]);
            // Refresh documents
            setCurrentPage(1);
            setTimeout(() => {
              setSuccessMessage("");
            }, 3000);
          }}
        />
      )}

      {showBulkDeleteModal && (
        <BulkDeleteModal
          isOpen={showBulkDeleteModal}
          onClose={() => setShowBulkDeleteModal(false)}
          documentIds={selectedDocuments}
          onSuccess={() => {
            setSuccessMessage("Documents moved to trash successfully");
            setSelectedDocuments([]);
            setRefreshTrigger((prev) => prev + 1);
            // Refresh documents
            setCurrentPage(1);
            setTimeout(() => {
              setSuccessMessage("");
            }, 3000);
          }}
        />
      )}
    </Layout>
  );
}
