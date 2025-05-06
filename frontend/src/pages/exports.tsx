import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/utils/api';
import type { PDFExport } from '@/types/api';
import Layout from '@/components/Layout';
import { Download, Trash, ExternalLink, Calendar, ChevronRight, ArrowLeft, Trash2, Copy, Check, X } from 'lucide-react';

// Improved copy to clipboard function with fallback
const copyToClipboard = async (text: string, setCopySuccess: (success: boolean) => void, setCopyError: (error: boolean) => void) => {
  // Reset states
  setCopySuccess(false);
  setCopyError(false);
  
  try {
    // Try using the Clipboard API first
    try {
      await navigator.clipboard.writeText(text);
      setCopySuccess(true);
      return true;
    } catch (clipboardApiError) {
      console.error('Clipboard API failed:', clipboardApiError);
      // Continue to fallback methods
    }
    
    // Fallback method: execCommand
    try {
      // Create a temporary textarea element
      const textArea = document.createElement('textarea');
      
      // Set its value to the text to be copied
      textArea.value = text;
      
      // Make it invisible
      textArea.style.position = 'fixed';
      textArea.style.top = '0';
      textArea.style.left = '0';
      textArea.style.width = '2em';
      textArea.style.height = '2em';
      textArea.style.padding = '0';
      textArea.style.border = 'none';
      textArea.style.outline = 'none';
      textArea.style.boxShadow = 'none';
      textArea.style.background = 'transparent';
      
      // Add it to the document
      document.body.appendChild(textArea);
      
      // Select the text
      textArea.select();
      
      // Try to copy the selected text
      const successful = document.execCommand('copy');
      
      // Clean up
      document.body.removeChild(textArea);
      
      if (successful) {
        setCopySuccess(true);
        return true;
      } else {
        throw new Error('execCommand returned false');
      }
    } catch (execCommandError) {
      console.error('execCommand fallback failed:', execCommandError);
      // Continue to next fallback
    }
    
    // If we get here, both methods failed
    setCopyError(true);
    return false;
  } catch (error) {
    console.error('Could not copy to clipboard:', error);
    setCopyError(true);
    return false;
  }
};

export default function ExportsPage() {
  // Function to convert PDF URLs to HTML URLs
  const getShareUrl = (url: string) => {
    return url.replace('/shared/pdf/', '/shared/html/');
  };
  
  const [pdfExports, setPDFExports] = useState<PDFExport[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  
  // Modal states
  const [showCopyModal, setShowCopyModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedExport, setSelectedExport] = useState<PDFExport | null>(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  
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
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch exports
  useEffect(() => {
    const fetchExports = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const response = await documentsAPI.getPDFExports();
        console.log('Exports fetched successfully:', response.data);
        
        // Handle both paginated and non-paginated responses
        const exportsData = Array.isArray(response.data) 
          ? response.data 
          : (response.data.results || []);
        
        setPDFExports(exportsData);
      } catch (err: any) {
        console.error('Failed to load exports:', err);
        setError('Failed to load exports');
      } finally {
        setIsLoading(false);
      }
    };

    fetchExports();
  }, [isAuthenticated]);

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

  // Show error state
  if (error) {
    return (
      <Layout title="Error">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Check if export is expired
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false; // Never expires
    return new Date(expiresAt) < new Date();
  };
  
  // Get expiration display text
  const getExpirationText = (pdfExport: PDFExport) => {
    if (!pdfExport.expires_at) {
      return "Never expires";
    }
  
    const expirationDate = new Date(pdfExport.expires_at);
    const now = new Date();
    const timeDiff = expirationDate.getTime() - now.getTime();
  
    if (timeDiff <= 0) {
      return expirationDate.toLocaleDateString(); // Already expired
    }
  
    if (timeDiff < 24 * 60 * 60 * 1000) {
      const hours = Math.floor(timeDiff / (1000 * 60 * 60));
      const minutes = Math.floor((timeDiff % (1000 * 60 * 60)) / (1000 * 60));
  
      if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
      if (hours > 0) return `${hours} hour${hours > 1 ? "s" : ""}`;
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
  
    return expirationDate.toLocaleDateString();
  };

  // Handle delete export
  const handleDeleteExport = async () => {
    if (!selectedExport) return;
    
    try {
      setIsDeleting(true);
      await documentsAPI.deletePDFExport(selectedExport.id);
      setPDFExports(pdfExports.filter((export_) => export_.id !== selectedExport.id));
      setShowDeleteModal(false);
      setSelectedExport(null);
    } catch (error: any) {
      console.error("Failed to delete export:", error);
      
      if (error.response?.data?.detail?.includes("permission")) {
        setError("You do not have permission to delete this export.");
      } else {
        setError("Failed to delete export. Please try again.");
      }
      
      setTimeout(() => setError(''), 3000);
    } finally {
      setIsDeleting(false);
    }
  };
  
  // Close copy modal
  const closeCopyModal = () => {
    setShowCopyModal(false);
    setCopySuccess(false);
    setCopyError(false);
    setTimeout(() => setSelectedExport(null), 300); // Delay to allow animation
  };
  
  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setTimeout(() => setSelectedExport(null), 300); // Delay to allow animation
  };

  return (
    <Layout title="Exports">
      {/* Copy Success Modal */}
      {showCopyModal && selectedExport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-primary-100 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-primary-200 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left w-full">
                    <h3 className="text-lg leading-6 font-medium text-primary-800 mb-4">
                      Share Link
                    </h3>
                    
                    <div className="mt-2">
                      <p className="text-sm text-primary-800 mb-2">
                        {copySuccess ? 'Link copied to clipboard!' : 'Share this link to provide access to the document:'}
                      </p>
                      <div className="flex items-center mb-4">
                        <input
                          type="text"
                          className="flex-grow p-2 border border-gray-300 dark:border-primary-600 rounded-md text-sm text-primary-500"
                          value={getShareUrl(selectedExport.share_url)}
                          readOnly
                          onClick={(e) => (e.target as HTMLInputElement).select()}
                        />
                        <button
                          className="ml-2 p-2 bg-secondary-600 text-primary-100 rounded-full text-sm"
                          onClick={() => copyToClipboard(getShareUrl(selectedExport.share_url), setCopySuccess, setCopyError)}
                        >
                          {copySuccess ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                      
                      {/* Copy success/error messages */}
                      {copySuccess && (
                        <div className="mt-2 mb-4 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300 flex items-center">
                          <Check className="w-4 h-4 mr-2" />
                          Link copied to clipboard!
                        </div>
                      )}
                      
                      {copyError && (
                        <div className="mt-2 mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                          Could not copy automatically. Please select and copy the link manually.
                        </div>
                      )}
                      
                      {selectedExport.pin_protected && selectedExport.pin_code && (
                        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">PIN Code</p>
                          <p className="text-lg font-bold text-yellow-900 dark:text-yellow-200">{selectedExport.pin_code}</p>
                          <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                            Share this PIN code with the recipient. They will need it to access the document.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-primary-200 hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rimary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeCopyModal}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedExport && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-primary-100 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-primary-200 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary-800">
                      Delete Export
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-primary-600">
                        Are you sure you want to delete this export? This will invalidate any shared links.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteExport}
                  disabled={isDeleting}
                >
                  {isDeleting ? 'Deleting...' : 'Delete'}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeDeleteModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {pdfExports.length === 0 ? (
            <div className="text-center py-8 bg-primary-50 dark:bg-primary-900/30 rounded-lg sm:border-1 sm:border sm:border-primary-200">
              <ChevronRight className="w-12 h-12 mx-auto text-primary-300 mb-4" />
              <h2 className="text-xl font-semibold mb-2 text-primary-700 dark:text-primary-300">No Exports Yet</h2>
              <p className="text-secondary-500 dark:text-primary-400 mb-4">
                You haven't created any exports yet. Go to a document and use the export or share buttons.
              </p>
              <button
                onClick={() => router.replace('/documents')}
                className="btn-primary"
              >
                Browse Documents
              </button>
            </div>
          ) : (
            <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg p-2 mb-6">
              <h2 className="text-xl font-light text-primary-500 text-center pl-2 sm:text-left mb-4">Exports</h2>
              
              {/* Desktop Table View */}
              {!isMobile && (
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-primary-200">
                    <thead className="bg-primary-100">
                      <tr>
                        <th scope="col" className="py-3 pl-4 pr-3 text-left text-sm font-semibold text-primary-500 sm:pl-6">Document</th>
                        <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-primary-500">Created By</th>
                        <th scope="col" className="px-3 py-3 text-left text-sm font-semibold text-primary-500">Expiration</th>
                        <th scope="col" className="relative py-3 pl-3 pr-4 sm:pr-6">
                          <span className="sr-only">Actions</span>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200 bg-white dark:bg-primary-50">
                      {pdfExports.map((pdfExport) => (
                        <tr 
                          key={pdfExport.id} 
                          className={`transition-colors cursor-pointer ${
                            isExpired(pdfExport.expires_at) 
                              ? 'bg-primary-50 dark:bg-primary-100/50' 
                              : 'bg-primary-50 dark:bg-primary-100'
                          } hover:bg-primary-100 dark:hover:bg-primary-200`}
                        >
                          <td className="whitespace-nowrap py-2 pl-4 pr-3 text-sm sm:pl-6">
                            <div className="flex items-center">
                              <ChevronRight className="h-4 w-4 flex-shrink-0 mr-2 text-primary-500" />
                              <Link 
                                href={`/documents/${pdfExport.document}`}
                                className="document-title font-medium text-primary-600 dark:text-primary-600 cursor-pointer hover:text-primary-950 dark:hover:text-primary-800 truncate max-w-[200px]"
                              >
                                {pdfExport.document_title}
                              </Link>
                              {pdfExport.pin_protected && (
                                <div className="ml-2 flex items-center gap-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                                    </svg>
                                    PIN
                                  </span>
                                  {pdfExport.pin_code && (
                                    <span className="text-xs text-primary-500 dark:text-primary-400">
                                      {pdfExport.pin_code}
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-primary-500">
                            {pdfExport.created_by_name}
                          </td>
                          <td className="whitespace-nowrap px-3 py-2 text-sm text-primary-500">
                            <div className="flex items-center">
                              <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-primary-400" />
                              {isExpired(pdfExport.expires_at) ? (
                                <span className="text-danger-600 dark:text-danger-300">{getExpirationText(pdfExport)}</span>
                              ) : (
                                <span>{getExpirationText(pdfExport)}</span>
                              )}
                            </div>
                          </td>
                          <td className="relative whitespace-nowrap py-2 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                            <div className="flex justify-end space-x-2">
                              {!isExpired(pdfExport.expires_at) && (
                                <>
                                  <a
                                    href={getShareUrl(pdfExport.share_url)}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-10 h-10 flex items-center justify-center rounded-full 
                                              bg-primary-400 dark:bg-primary-200 
                                              text-primary-200 dark:text-primary-500 
                                              hover:bg-primary-500 dark:hover:bg-primary-300 
                                              focus:outline-none focus:ring-2 focus:ring-primary-400"
                                  >
                                    <ExternalLink className="w-5 h-5" />
                                  </a>

                                  <button
                                    onClick={() => {
                                      setSelectedExport(pdfExport);
                                      setShowCopyModal(true);
                                      copyToClipboard(getShareUrl(pdfExport.share_url), setCopySuccess, setCopyError);
                                    }}
                                    className="w-10 h-10 flex items-center justify-center rounded-full 
                                              bg-primary-400 dark:bg-primary-200 
                                              text-primary-200 dark:text-primary-500 
                                              hover:bg-primary-500 dark:hover:bg-primary-300 
                                              focus:outline-none focus:ring-2 focus:ring-primary-400"
                                  >
                                    <Copy className="w-5 h-5" />
                                  </button>
                                </>
                              )}

                              <button
                                onClick={() => {
                                  window.open(getShareUrl(pdfExport.share_url), '_blank');
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full 
                                          bg-primary-400 dark:bg-primary-200 
                                          text-primary-200 dark:text-primary-500 
                                          hover:bg-primary-500 dark:hover:bg-primary-300 
                                          focus:outline-none focus:ring-2 focus:ring-primary-400"
                              >
                                <Download className="w-5 h-5" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedExport(pdfExport);
                                  setShowDeleteModal(true);
                                }}
                                className="w-10 h-10 flex items-center justify-center rounded-full 
                                          bg-danger-400 dark:bg-danger-200 
                                          text-primary-200 
                                          hover:bg-red-600 dark:hover:bg-red-700 
                                          focus:outline-none focus:ring-2 focus:ring-red-400"
                                title="Delete Export"
                              >
                                <Trash2 className="w-5 h-5" />
                              </button>
                            </div>
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
                  {pdfExports.map((pdfExport) => (
                    <div 
                      key={pdfExport.id} 
                      className="border border-primary-200 dark:border-primary-200 rounded-lg p-3 hover:shadow-md dark:hover:shadow-white/10 transition-shadow bg-white dark:bg-primary-100"
                      style={{ 
                        borderLeftWidth: '4px',
                        borderLeftColor: isExpired(pdfExport.expires_at) ? '#EF4444' : '#3B82F6'
                      }}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <Link 
                          href={`/documents/${pdfExport.document}`}
                          className="flex items-center hover:opacity-80"
                        >
                          <ChevronRight className="w-5 h-5 text-primary-500 mr-2" />
                          <span className="document-title text-lg font-semibold text-primary-600 dark:text-primary-600 truncate max-w-[200px]">
                            {pdfExport.document_title}
                          </span>
                        </Link>
                        {pdfExport.pin_protected && (
                          <div className="flex flex-col items-end">
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-300 text-primary-800">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                              </svg>
                              PIN
                            </span>
                            {pdfExport.pin_code && (
                              <span className="text-xs text-primary-500 dark:text-primary-400 mt-1">
                                Code: {pdfExport.pin_code}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                      
                      <div className="text-sm text-primary-500 dark:text-primary-400 mb-2">
                        Created by: {pdfExport.created_by_name}
                      </div>
                      
                      <div className="flex items-center text-sm mb-4">
                        <Calendar className="w-4 h-4 mr-1.5 text-primary-400 dark:text-primary-500" />
                        {isExpired(pdfExport.expires_at) ? (
                          <span className="text-danger-600 dark:text-danger-300">{getExpirationText(pdfExport)}</span>
                        ) : (
                          <span className="text-primary-400 dark:text-primary-500">{getExpirationText(pdfExport)}</span>
                        )}
                      </div>
                      
                      <div className="flex justify-end mt-2 space-x-2">
                        {!isExpired(pdfExport.expires_at) && (
                          <button
                            onClick={() => {
                              setSelectedExport(pdfExport);
                              setShowCopyModal(true);
                              copyToClipboard(getShareUrl(pdfExport.share_url), setCopySuccess, setCopyError);
                            }}
                            className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                          >
                            <Copy className="w-6 h-6" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            window.open(getShareUrl(pdfExport.share_url), '_blank');
                          }}
                          className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                        >
                          <Download className="w-6 h-6" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedExport(pdfExport);
                            setShowDeleteModal(true);
                          }}
                          className="p-1 text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300"
                        >
                          <Trash className="w-6 h-6" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
