import React, { useState, useEffect } from 'react';
import { documentsAPI } from '@/utils/api';
import { Document } from '@/types/api';
import { FileText, ChevronDown, ChevronUp, ExternalLink, CheckCircle, Circle, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { useRouter } from 'next/router';
import { formatDate } from '@/utils/dateUtils';

interface DocumentPreviewListProps {
  tags: string[];
  categoryFilter?: string;
  status?: string;
  onSelectedDocumentsChange?: (selectedDocIds: number[]) => void;
}

const MAX_SELECTED_DOCS = 3;
const MIN_SELECTED_DOCS = 1;
const DOCS_PER_PAGE = 10;

const DocumentPreviewList: React.FC<DocumentPreviewListProps> = ({
  tags,
  categoryFilter,
  status,
  onSelectedDocumentsChange
}) => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedDocs, setExpandedDocs] = useState<Record<number, boolean>>({});
  const [selectedDocs, setSelectedDocs] = useState<number[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  // Track if selections were made manually
  const [manualSelectionMode, setManualSelectionMode] = useState(false);
  const router = useRouter();

  // Check if any filters are applied - only consider tags and category, not status
  const hasFilters = Boolean(
    (tags && tags.length > 0) || 
    (categoryFilter && categoryFilter !== '')
  );
  
  // Reset manual selection mode when filters change
  useEffect(() => {
    // When filters change, reset manual selection mode
    setManualSelectionMode(false);
  }, [tags, categoryFilter, status]);

  // Fetch documents when filters change
  useEffect(() => {
    if (!hasFilters) return; // Don't fetch if no filters are applied
    
    const fetchFilteredDocuments = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Prepare query parameters
        const params: Record<string, any> = {
          latest_only: true,
          limit: 100 // Fetch more to allow for client-side pagination
        };
        
        // Add category filter if provided
        if (categoryFilter) {
          params.category = categoryFilter;
        }
        
        // Add status filter if provided
        if (status) {
          params.status = status;
        }
        
        // Fetch documents
        const response = await documentsAPI.getDocuments(params);
        let filteredDocs = response.data.results || [];
        
        // Filter by tags on the client side if tags are provided
        if (tags && tags.length > 0) {
          filteredDocs = filteredDocs.filter((doc: Document) => 
            tags.every(tag => doc.tags && doc.tags.includes(tag))
          );
        }
        
        // Sort by updated_at (newest first)
        filteredDocs.sort((a: Document, b: Document) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        );
        
        setDocuments(filteredDocs);
        
        // Calculate total pages
        setTotalPages(Math.max(1, Math.ceil(filteredDocs.length / DOCS_PER_PAGE)));
        
        // Only auto-select documents if:
        // 1. We have results
        // 2. We're not in manual selection mode
        // 3. This is the initial load or filter change
        if (filteredDocs.length > 0 && !manualSelectionMode) {
          const docsToSelect = filteredDocs
            .slice(0, Math.min(MAX_SELECTED_DOCS, filteredDocs.length))
            .map((doc: Document) => doc.id);
          
          setSelectedDocs(docsToSelect);
        } else if (filteredDocs.length === 0) {
          // If no documents match the filters, clear the selection
          // This will trigger the useEffect that notifies the parent
          setSelectedDocs([]);
          // Reset manual selection mode since we have no documents
          setManualSelectionMode(false);
        }
      } catch (err: any) {
        console.error('Failed to fetch filtered documents:', err);
        setError('Failed to load documents. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFilteredDocuments();
  }, [tags, categoryFilter, status, hasFilters, manualSelectionMode]); // Added manualSelectionMode
  
  // Separate effect to notify parent when selections change
  useEffect(() => {
    if (onSelectedDocumentsChange) {
      onSelectedDocumentsChange(selectedDocs);
    }
  }, [selectedDocs, onSelectedDocumentsChange]);
  
  // Toggle document expansion
  const toggleExpand = (docId: number) => {
    setExpandedDocs(prev => ({
      ...prev,
      [docId]: !prev[docId]
    }));
  };
  
  // Navigate to document
  const viewDocument = (slug: string) => {
    router.push(`/documents/${slug}`);
  };
  
  // Toggle document selection
  const toggleDocSelection = (docId: number) => {
    // Set manual selection mode when user clicks to select/deselect
    setManualSelectionMode(true);
    
    // If document is already selected, remove it
    if (selectedDocs.includes(docId)) {
      // Allow deselection of all documents in manual mode
      const newSelectedDocs = selectedDocs.filter(id => id !== docId);
      setSelectedDocs(newSelectedDocs);
      // Parent notification is now handled by the separate useEffect
    } else {
      // Don't allow selection if we're at the maximum
      if (selectedDocs.length >= MAX_SELECTED_DOCS) {
        return;
      }
      
      const newSelectedDocs = [...selectedDocs, docId];
      setSelectedDocs(newSelectedDocs);
      // Parent notification is now handled by the separate useEffect
    }
  };
  
  // Strip HTML tags from content
  const stripHtmlTags = (html: string): string => {
    return html.replace(/<\/?[^>]+(>|$)/g, '');
  };
  
  // Get a preview of the document content
  const getContentPreview = (content: string, isExpanded: boolean) => {
    if (!content) return 'No content available';
    
    // Strip HTML tags
    const plainText = stripHtmlTags(content);
    
    // For plain text, show first 150 characters or more if expanded
    if (isExpanded) {
      return plainText.substring(0, 500) + (plainText.length > 500 ? '...' : '');
    }
    
    return plainText.substring(0, 150) + (plainText.length > 150 ? '...' : '');
  };
  
  // Get paginated documents
  const getPaginatedDocuments = () => {
    const startIndex = (currentPage - 1) * DOCS_PER_PAGE;
    const endIndex = startIndex + DOCS_PER_PAGE;
    return documents.slice(startIndex, endIndex);
  };
  
  // Handle page change
  const changePage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };
  
  return (
    <div className="mt-6 mb-6">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-primary-600 dark:text-primary-400 flex items-center">
          <FileText className="h-4 w-4 mr-2" />
          Matching Documents ({documents.length})
        </h3>
        <div className="text-sm text-primary-600 dark:text-primary-400">
          {selectedDocs.length}/{MAX_SELECTED_DOCS} documents selected
        </div>
      </div>
      
      {!hasFilters ? (
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-3 rounded">
          Please select at least one filter to see matching documents.
        </div>
      ) : isLoading ? (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
        </div>
      ) : error ? (
        <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-3 rounded">
          No documents match the current filters.
        </div>
      ) : (
        <>
          {/* Selected Documents Section */}
          {selectedDocs.length > 0 && (
            <div className="mb-4">
              <h4 className="text-md font-medium mb-2 text-primary-600 dark:text-primary-400">
                Selected Documents
              </h4>
              <div className="space-y-3">
                {documents
                  .filter(doc => selectedDocs.includes(doc.id))
                  .map(doc => (
                    <div 
                      key={doc.id} 
                      className="bg-white dark:bg-primary-50 border-2 border-primary-400 dark:border-primary-400 rounded-md p-4 transition-all duration-200 hover:shadow-md shadow-sm"
                    >
                      <div className="flex justify-between items-start">
                        <div className="flex items-center">
                          <button
                            onClick={() => toggleDocSelection(doc.id)}
                            className="mr-2 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                            aria-label="Deselect document"
                          >
                            <CheckCircle className="h-5 w-5" />
                          </button>
                          <h4 
                            className="text-md font-medium text-primary-600 dark:text-primary-500 cursor-pointer hover:text-primary-800 dark:hover:text-primary-300"
                            onClick={() => viewDocument(doc.slug)}
                          >
                            {doc.title}
                          </h4>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => toggleExpand(doc.id)}
                            className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-200 transition-colors"
                            aria-label={expandedDocs[doc.id] ? "Collapse" : "Expand"}
                          >
                            {expandedDocs[doc.id] ? (
                              <ChevronUp className="h-5 w-5 text-primary-500" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-primary-500" />
                            )}
                          </button>
                          <button
                            onClick={() => viewDocument(doc.slug)}
                            className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-200 transition-colors"
                            aria-label="View document"
                          >
                            <ExternalLink className="h-5 w-5 text-primary-500" />
                          </button>
                        </div>
                      </div>
                      
                      {/* Tags */}
                      {doc.tags && doc.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2 ml-7">
                          {doc.tags.map(tag => (
                            <span
                              key={tag}
                              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/70 dark:text-primary-400"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                      
                      {/* Document preview */}
                      <div className={`mt-2 ml-7 text-sm text-primary-600 dark:text-primary-400 ${expandedDocs[doc.id] ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                        {getContentPreview(doc.plain_text || '', expandedDocs[doc.id])}
                      </div>
                      
                      {/* Metadata */}
                      <div className="mt-2 ml-7 text-xs text-primary-500 dark:text-primary-400 flex items-center justify-between">
                        <span>
                          {doc.category_name ? doc.category_name : 'Uncategorized'} • {doc.status}
                        </span>
                        <span>
                          Updated: {formatDate(doc.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}
          
          {/* Other Documents Section */}
          <h4 className="text-md font-medium mb-2 text-primary-600 dark:text-primary-400">
            Other Documents
          </h4>
          <div className="space-y-3">
            {getPaginatedDocuments()
              .filter(doc => !selectedDocs.includes(doc.id))
              .map(doc => (
                <div 
                  key={doc.id} 
                  className="bg-white dark:bg-primary-50 border border-primary-200 dark:border-primary-300 rounded-md p-4 transition-all duration-200 hover:shadow-md opacity-90"
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center">
                      <button
                        onClick={() => toggleDocSelection(doc.id)}
                        className="mr-2 text-primary-300 hover:text-primary-500 dark:text-primary-600 dark:hover:text-primary-400"
                        aria-label="Select document"
                        disabled={selectedDocs.length >= MAX_SELECTED_DOCS}
                      >
                        <Circle className="h-5 w-5" />
                      </button>
                      <h4 
                        className="text-md font-medium text-primary-600 dark:text-primary-500 cursor-pointer hover:text-primary-800 dark:hover:text-primary-300"
                        onClick={() => viewDocument(doc.slug)}
                      >
                        {doc.title}
                      </h4>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => toggleExpand(doc.id)}
                        className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-200 transition-colors"
                        aria-label={expandedDocs[doc.id] ? "Collapse" : "Expand"}
                      >
                        {expandedDocs[doc.id] ? (
                          <ChevronUp className="h-5 w-5 text-primary-500" />
                        ) : (
                          <ChevronDown className="h-5 w-5 text-primary-500" />
                        )}
                      </button>
                      <button
                        onClick={() => viewDocument(doc.slug)}
                        className="p-1 rounded-full hover:bg-primary-100 dark:hover:bg-primary-200 transition-colors"
                        aria-label="View document"
                      >
                        <ExternalLink className="h-5 w-5 text-primary-500" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Tags */}
                  {doc.tags && doc.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2 ml-7">
                      {doc.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/70 dark:text-primary-400"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  
                  {/* Document preview */}
                  <div className={`mt-2 ml-7 text-sm text-primary-600 dark:text-primary-400 ${expandedDocs[doc.id] ? 'whitespace-pre-line' : 'line-clamp-2'}`}>
                    {getContentPreview(doc.plain_text || '', expandedDocs[doc.id])}
                  </div>
                  
                  {/* Metadata */}
                  <div className="mt-2 ml-7 text-xs text-primary-500 dark:text-primary-400 flex items-center justify-between">
                    <span>
                      {doc.category_name ? doc.category_name : 'Uncategorized'} • {doc.status}
                    </span>
                    <span>
                      Updated: {formatDate(doc.updated_at)}
                    </span>
                  </div>
                </div>
              ))}
          </div>
          
          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center mt-6 space-x-2">
              <button
                onClick={() => changePage(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-full ${
                  currentPage === 1 
                    ? 'text-primary-300 cursor-not-allowed' 
                    : 'text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-800'
                }`}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <span className="text-sm text-primary-600 dark:text-primary-400">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => changePage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-full ${
                  currentPage === totalPages 
                    ? 'text-primary-300 cursor-not-allowed' 
                    : 'text-primary-500 hover:bg-primary-100 dark:hover:bg-primary-800'
                }`}
                aria-label="Next page"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default DocumentPreviewList;
