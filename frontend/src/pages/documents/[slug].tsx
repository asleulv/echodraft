import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/utils/api';
import type { DocumentDetail, Document } from '@/types/api';
import Layout from '@/components/Layout';
import TipTapViewer from '@/components/TipTapViewer';
import { Edit, Trash2, ArrowLeft, Info, Calendar, Download, Share2, ChevronDown, ChevronUp, Tag, Clipboard, Check } from 'lucide-react';
import { generateHtmlDocument, printDocument } from '@/utils/htmlExport';
import { formatDate } from '@/utils/dateUtils';

export default function DocumentDetail() {
  const [docData, setDocData] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [versions, setVersions] = useState<Document[]>([]);
  const [isLoadingVersions, setIsLoadingVersions] = useState(false);
  const [showVersions, setShowVersions] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showMetadata, setShowMetadata] = useState(false);
  const [showGeneratedMessage, setShowGeneratedMessage] = useState(false);
  
  // State for share modal
  const [showShareModal, setShowShareModal] = useState(false);
  const [expirationOption, setExpirationOption] = useState('1w');
  const [pinProtected, setPinProtected] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [isCreatingShare, setIsCreatingShare] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { slug } = router.query;

  // Function to go back to the previous page
  const handleGoBack = () => {
    router.back(); // This uses Next.js router to go back to the previous page
  };

  const handlePrint = () => {
    if (!docData) return;
    try {
      printDocument();
    } catch (error) {
      console.error('Error printing document:', error);
      setError('Failed to print document. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Add useEffect to set data-page attribute on body
  useEffect(() => {
    // Set data-page attribute on body to identify this as the document view page
    document.body.setAttribute('data-page', 'document-view');
    
    // Clean up when component unmounts
    return () => {
      document.body.removeAttribute('data-page');
    };
  }, []);

  // Check if device is mobile and set metadata visibility accordingly
  useEffect(() => {
    const checkIfMobile = () => {
      const isMobileView = window.innerWidth < 640;
      setIsMobile(isMobileView);
      // Hide metadata by default on mobile
      if (isMobileView) {
        setShowMetadata(false);
      }
      // No else clause - this keeps the default state (false) for desktop
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
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch document versions
  const fetchVersions = async () => {
    if (!docData || !slug || typeof slug !== 'string') return;
    
    try {
      setIsLoadingVersions(true);
      const response = await documentsAPI.getDocumentVersions(slug);
      console.log('Document versions fetched successfully:', response.data);
      
      // Handle both paginated and non-paginated responses
      const versionData = Array.isArray(response.data) 
        ? response.data 
        : (response.data.results || []);
      
      setVersions(versionData);
    } catch (err) {
      console.error('Failed to fetch document versions:', err);
    } finally {
      setIsLoadingVersions(false);
    }
  };

  // Check for the generated=true query parameter
  useEffect(() => {
    if (router.query.generated === 'true') {
      setShowGeneratedMessage(true);
      // Hide the message after 5 seconds
      const timer = setTimeout(() => {
        setShowGeneratedMessage(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [router.query]);

  // Fetch document
  useEffect(() => {
    const fetchDocument = async () => {
      if (!isAuthenticated) return;
      
      // Check if slug is valid
      if (!slug || typeof slug !== 'string') {
        console.error('Invalid slug:', slug);
        setError('Invalid document ID');
        setIsLoading(false);
        return;
      }
      
      try {
        console.log('Fetching document with slug:', slug);
        setIsLoading(true);
        
        // Get version from URL query if provided
        const version = router.query.version ? String(router.query.version) : undefined;
        console.log('Version from URL query:', version);
        
        // Try to fetch the document using the slug
        try {
          const response = await documentsAPI.getDocument(slug, version);
          console.log('Document fetched successfully:', response.data);
          setDocData(response.data);
          setIsLoading(false);
          return;
        } catch (slugError) {
          console.error('Failed to fetch document by slug, trying to fetch by ID:', slugError);
          
          // If the slug is numeric, it might be an ID
          if (/^\d+$/.test(slug)) {
            try {
              // Try to fetch documents and filter by ID
              const listResponse = await documentsAPI.getDocuments();
              const documents = listResponse.data.results || [];
              const foundDocument = documents.find((doc: any) => doc.id === parseInt(slug, 10));
              
              if (foundDocument) {
                console.log('Found document by ID:', foundDocument);
                // Fetch the full document details
                const detailResponse = await documentsAPI.getDocument(foundDocument.slug);
                console.log('Document fetched successfully by ID:', detailResponse.data);
                setDocData(detailResponse.data);
                setIsLoading(false);
                return;
              }
            } catch (idError) {
              console.error('Failed to fetch document by ID:', idError);
            }
          }
          
          // If we get here, we couldn't find the document
          throw slugError;
        }
      } catch (err: any) {
        console.error('Failed to load document:', err);
        setError('Failed to load document');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [isAuthenticated, slug, router.query]);

  // Download document as HTML
  const downloadDocument = async () => {
    if (!docData) return;
    
    try {
      // Show loading indicator
      const button = window.document.activeElement as HTMLButtonElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>';
      button.disabled = true;
      
      // Get document data for HTML generation
      const response = await documentsAPI.exportHTML(docData.slug);
      const { document: htmlDocData, html_content } = response.data;
      
      // Generate and download HTML document
      generateHtmlDocument(htmlDocData, html_content);
      
      // Reset button
      button.innerHTML = originalContent;
      button.disabled = false;
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };

  // Create shareable PDF link
  const createShareableLink = async () => {
    setShowShareModal(true);
  };
  
  // Function to extract plain text from HTML content
  const extractPlainText = (html: string): string => {
    if (!html) return '';
    
    // Create a temporary div to hold the HTML content
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = html;
    
    // Replace <br>, <p>, <div>, <li> tags with newlines to preserve paragraph structure
    const content = tempDiv.innerHTML
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<\/p>/gi, '\n')
      .replace(/<\/div>/gi, '\n')
      .replace(/<\/li>/gi, '\n');
    
    // Set the modified content back to the div
    tempDiv.innerHTML = content;
    
    // Get the text content (this removes all HTML tags)
    let plainText = tempDiv.textContent || tempDiv.innerText || '';
    
    // Clean up consecutive newlines and whitespace
    plainText = plainText
      .replace(/\n\s*\n/g, '\n\n') // Replace multiple newlines with just two
      .replace(/\n\n\n+/g, '\n\n') // Replace three or more newlines with just two
      .trim();
    
    return plainText;
  };
  
  // Function to copy document content to clipboard
  const copyDocumentContent = async () => {
    if (!docData) return;
    
    // Extract plain text from the HTML content
    const plainText = extractPlainText(docData.content);
    
    // Show a temporary "copying" state on the button
    const button = document.querySelector('[title="Copy to clipboard"]') as HTMLButtonElement;
    if (button) {
      const originalContent = button.innerHTML;
      button.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>';
      button.disabled = true;
      
      // Copy to clipboard
      await copyToClipboard(plainText);
      
      // Reset button after a short delay
      setTimeout(() => {
        button.innerHTML = originalContent;
        button.disabled = false;
      }, 1000);
    } else {
      // If button not found, just copy without visual feedback
      await copyToClipboard(plainText);
    }
  };
  
  // Copy to clipboard function with improved mobile fallback
  const copyToClipboard = async (text: string) => {
    // Reset states
    setCopySuccess(false);
    setCopyError(false);
    
    try {
      // Try using the Clipboard API first
      try {
        await navigator.clipboard.writeText(text);
        setCopySuccess(true);
        
        // Show success notification
        const notification = document.createElement('div');
        notification.className = 'fixed bottom-4 right-4 bg-success-100 border border-success-300 text-success-700 px-4 py-3 rounded flex items-center shadow-lg z-50';
        notification.innerHTML = `
          <div class="mr-2">
            <svg class="h-5 w-5 text-success-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
          </div>
          <div>Copied to clipboard!</div>
        `;
        document.body.appendChild(notification);
        
        // Remove notification after 3 seconds
        setTimeout(() => {
          document.body.removeChild(notification);
          setCopySuccess(false);
        }, 3000);
        
        return;
      } catch (clipboardApiError) {
        console.error('Clipboard API failed:', clipboardApiError);
        // Continue to fallback methods
      }
      
      // Fallback method 1: execCommand (works on some mobile browsers)
      try {
        // Create a temporary input element
        const textArea = document.createElement('textarea');
        textArea.value = text;
        
        // Make the textarea more accessible on mobile
        textArea.style.position = 'fixed';
        textArea.style.top = '0';
        textArea.style.left = '0';
        textArea.style.width = '100%';
        textArea.style.height = '100px';
        textArea.style.padding = '10px';
        textArea.style.zIndex = '9999';
        textArea.style.fontSize = '16px'; // Prevents zoom on iOS
        
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        // Try to execute copy command
        const successful = document.execCommand('copy');
        if (successful) {
          setCopySuccess(true);
          
          // Show success notification
          const notification = document.createElement('div');
          notification.className = 'fixed bottom-4 right-4 bg-success-100 border border-success-300 text-success-700 px-4 py-3 rounded flex items-center shadow-lg z-50';
          notification.innerHTML = `
            <div class="mr-2">
              <svg class="h-5 w-5 text-success-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <div>Copied to clipboard!</div>
          `;
          document.body.appendChild(notification);
          
          // Remove notification after 3 seconds
          setTimeout(() => {
            document.body.removeChild(notification);
            setCopySuccess(false);
          }, 3000);
        } else {
          throw new Error('execCommand returned false');
        }
        
        // Clean up
        document.body.removeChild(textArea);
        return;
      } catch (execCommandError) {
        console.error('execCommand fallback failed:', execCommandError);
        // Continue to next fallback
      }
      
      // If we get here, both methods failed
      // Show error and provide instructions for manual copy
      setCopyError(true);
      
      // Auto-select the text in the input field to make manual copying easier
      const inputElement = document.querySelector('input[value="' + text + '"]') as HTMLInputElement;
      if (inputElement) {
        inputElement.focus();
        inputElement.select();
      }
    } catch (error) {
      console.error('Could not copy to clipboard:', error);
      setCopyError(true);
    }
  };
  
  const handleShareSubmit = async () => {
    if (!docData) return;
    
    try {
      setIsCreatingShare(true);
      
      const response = await documentsAPI.createHTMLShare(docData.slug, {
        expiration_type: expirationOption,
        pin_protected: pinProtected
      });
      
      // Set the share URL and PIN code for display first
      setShareUrl(response.data.share_url);
      if (pinProtected && response.data.pin_code) {
        setPinCode(response.data.pin_code);
      }
      
      // Try to copy the share URL to clipboard
      await copyToClipboard(response.data.share_url);
      
      setIsCreatingShare(false);
    } catch (error) {
      console.error('Error creating shareable document link:', error);
      setError('Failed to create shareable document link. Please try again.');
      setTimeout(() => setError(''), 3000);
      setIsCreatingShare(false);
    }
  };
  
  // Close the share modal
  const closeShareModal = () => {
    setShowShareModal(false);
    setShareUrl('');
    setPinCode('');
    setExpirationOption('1w');
    setPinProtected(false);
    setCopySuccess(false);
    setCopyError(false);
  };
  
  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary-300 border-t-secondary-500 rounded-full animate-spin"></div>
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

  // Show document not found
  if (!docData) {
    return (
      <Layout title="Document Not Found">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Document Not Found</h2>
              <p className="text-secondary-500 dark:text-primary-600 mb-4">
                The document you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }
  
  return (
    <Layout title={docData.title}>
  

      {/* Share Modal */}
      {showShareModal && (
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
                      Share Document
                    </h3>
                    
                    {shareUrl ? (
                      <div className="mt-2">
                        <p className="text-sm text-primary-800 mb-2">
                          Your shareable link has been created and copied to clipboard:
                        </p>
                        <div className="flex items-center mb-4">
                          <input
                            type="text"
                            className="flex-grow p-2 border border-gray-300 dark:border-primary-600 rounded-md text-sm text-primary-500"
                            value={shareUrl}
                            readOnly
                          />
                          <button
                            className="ml-2 p-2 bg-primary-600 text-primary-100 rounded-full text-sm"
                            onClick={() => copyToClipboard(shareUrl)}
                          >
                            Copy
                          </button>
                        </div>
                        
                        {/* Copy success/error messages */}
                        {copySuccess && (
                          <div className="mt-2 mb-4 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-md text-sm text-green-700 dark:text-green-300">
                            Link copied to clipboard!
                          </div>
                        )}
                        
                        {copyError && (
                          <div className="mt-2 mb-4 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md text-sm text-yellow-700 dark:text-yellow-300">
                            Could not copy automatically. Please select and copy the link manually.
                          </div>
                        )}
                        
                        {pinCode && (
                          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                            <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">PIN Code</p>
                            <p className="text-lg font-bold text-yellow-900 dark:text-yellow-200">{pinCode}</p>
                            <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                              Share this PIN code with the recipient. They will need it to access the document.
                            </p>
                          </div>
                        )}
                        
                        <p className="text-sm text-gray-500 dark:text-primary-500">
                          Anyone with this link can view the document
                          {expirationOption !== 'never' && ' until it expires'}.
                        </p>
                      </div>
                    ) : (
                      <div className="mt-2">
                        <div className="mb-4">
                          <label className="block text-sm font-medium text-primary-600 mb-1">
                            Expiration Time
                          </label>
                          <select
                            className="w-full p-2 border border-primary-300 rounded-md text-primary-800 bg-primary-100"
                            value={expirationOption}
                            onChange={(e) => setExpirationOption(e.target.value)}
                          >
                            <option value="1h">1 Hour</option>
                            <option value="24h">24 Hours</option>
                            <option value="1w">1 Week</option>
                            <option value="1m">1 Month</option>
                            <option value="never">Never Expires</option>
                          </select>
                        </div>
                        
                        <div className="mb-4">
                          <div className="flex items-center">
                            <input
                              id="pin-protected"
                              name="pin-protected"
                              type="checkbox"
                              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-primary-600 rounded"
                              checked={pinProtected}
                              onChange={(e) => setPinProtected(e.target.checked)}
                            />
                            <label htmlFor="pin-protected" className="ml-2 block text-sm text-secondary-700 dark:text-secondary-400">
                              Protect with PIN code
                            </label>
                          </div>
                          <p className="mt-1 text-xs text-primary-600">
                            A random 4-digit PIN will be generated that recipients must enter to view the document.
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <div className="bg-primary-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                {shareUrl ? (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-secondary-600 dark:bg-secondary-400 text-base font-medium hover:bg-secondary-500 dark:hover:bg-secondary-300 text-primary-200 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={closeShareModal}
                  >
                    Done
                  </button>
                ) : (
                  <button
                    type="button"
                    className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-secondary-600 dark:bg-secondary-400 text-base font-medium text-primary-200 hover:bg-secondary-500 dark:hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:ml-3 sm:w-auto sm:text-sm"
                    onClick={handleShareSubmit}
                    disabled={isCreatingShare}
                  >
                    {isCreatingShare ? 'Creating...' : 'Create Share Link'}
                  </button>
                )}
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 dark:border-primary-500 shadow-sm px-4 py-2 bg-white dark:bg-primary-600 text-base font-medium text-gray-700 dark:text-primary-200 hover:bg-gray-50 dark:hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeShareModal}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto sm:px-6 lg:px-8">
        <div className={`${isMobile ? 'px-0 py-2' : 'px-4 py-6'} sm:px-0`}>
          <div className={`${isMobile ? 'border-0 p-1' : 'border-4 border-dashed border-primary-200 rounded-lg p-4'} mb-6`}>
          {/* Success message when document was just generated */}
          {showGeneratedMessage && (
            <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-4 flex items-start">
              <div className="flex-shrink-0 mr-2">
                <svg className="h-5 w-5 text-success-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
              </div>
              <div>Document generated successfully!</div>
            </div>
          )}
          
          <header className="bg-primary-0">
        <div className="max-w-7xl mx-auto py-4 sm:py-2 px-2 sm:px-5 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">

            </div>
            <div className="flex items-center justify-center sm:justify-end space-x-3">
              <button
                onClick={() => router.push(`/documents/${docData.slug}/edit`)}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-300 text-primary-600 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                title="Edit document"
              >
                <Edit size={18} />
              </button>
              <button
                onClick={downloadDocument}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-300 text-primary-600 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                title="Download"
              >
                <Download size={18} />
              </button>
              <button
                onClick={createShareableLink}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-300 text-primary-600 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                title="Share"
              >
                <Share2 size={18} />
              </button>
              <button
                onClick={copyDocumentContent}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-primary-300 text-primary-600 hover:bg-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-400"
                title="Copy to clipboard"
              >
                <Clipboard size={18} />
              </button>
              <button
                onClick={async () => {
                  if (window.confirm('Are you sure you want to delete this document? It will be moved to trash.')) {
                    try {
                      await documentsAPI.deleteDocument(docData.slug);
                      router.push('/documents');
                    } catch (error) {
                      console.error('Error deleting document:', error);
                      setError('Failed to delete document. Please try again.');
                      setTimeout(() => setError(''), 3000);
                    }
                  }
                }}
                className="w-10 h-10 flex items-center justify-center rounded-full bg-danger-400 dark:bg-danger-200 text-primary-200 hover:bg-red-600 dark:hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-400"
                title="Delete document"
              >
                <Trash2 size={18} />
              </button>
            </div>
          </div>
        </div>
      </header>
          <div className="flex items-center justify-center mb-4">
            <button
              onClick={handleGoBack}
              className="text-primary-500 hover:text-primary-600 focus:outline-none mr-2"
              aria-label="Go Back"
            >
              <ArrowLeft className="w-6 h-6 m-0" />
            </button>
            <h2 className="text-xl font-semibold text-primary-500 leading-none m-0">{docData.title}</h2>
          </div>
                      
            {/* Metadata toggle button */}
            <div className="flex justify-center items-center mb-2">
              <button 
                onClick={() => setShowMetadata(!showMetadata)}
                className="flex items-center text-sm text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300"
              >
                {showMetadata ? (
                  <>
                    <ChevronUp size={16} className="mr-1" />
                    <span>Hide Details</span>
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} className="mr-1" />
                    <span>Show Details</span>
                  </>
                )}
              </button>
            </div>
            
            {/* Document metadata */}
            {showMetadata && (
              <div className="mb-4 ">
                <div className="flex flex-wrap justify-center items-center gap-2 mb-2">
                  {/* Category badge */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <span className="mr-1">Category:</span>
                    {docData.category_name ? (
                      <span className="flex items-center">
                        {docData.category_color && (
                          <span 
                            className="inline-block w-2 h-2 rounded-full mr-1" 
                            style={{ backgroundColor: docData.category_color }}
                          ></span>
                        )}
                        {docData.category_name}
                      </span>
                    ) : 'Uncategorized'}
                  </div>
                  
                  {/* Status badge */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <span className="mr-1">Status:</span>
                    <span>{docData.status.charAt(0).toUpperCase() + docData.status.slice(1)}</span>
                  </div>
                  
                  {/* Version badge with dropdown toggle */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <span className="mr-1">Version:</span>
                    <span className="mr-1">{docData.version}</span>
                    <button
                      onClick={() => {
                        if (!showVersions) {
                          fetchVersions();
                        }
                        setShowVersions(!showVersions);
                      }}
                      className="text-primary-600 hover:text-primary-800 dark:hover:text-primary-600"
                    >
                      {showVersions ? '▲' : '▼'}
                    </button>
                  </div>
                  
                  {/* Author badge */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <span className="mr-1">Author:</span>
                    <span>{docData.created_by_name}</span>
                  </div>
                  
                  {/* Dates in compact format */}
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="mr-1">Created:</span>
                    <span>{formatDate(docData.created_at, true)}</span>
                  </div>
                  
                  <div className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary-50 text-primary-600">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span className="mr-1">Updated:</span>
                    <span>{formatDate(docData.updated_at, true)}</span>
                  </div>
                </div>
                
                {/* Tags section */}
                {docData.tags && docData.tags.length > 0 && (
                  <div className="mt-2">
                    <div className="flex items-center justify-center mb-1">
                      <Tag className="w-3 h-3 mr-1 text-primary-500" />
                      <span className="text-xs text-primary-500 mr-2">Tags:</span> {/* Add margin to space the text from the tags */}
                      <div className="flex flex-wrap gap-1">
                        {docData.tags.map((tag) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-600"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                
                {/* Document versions dropdown */}
                {showVersions && (
                  <div className="mt-3 border border-primary-200 rounded-md p-2">
                    <h4 className="text-sm font-medium mb-2">Document Versions</h4>
                    {isLoadingVersions ? (
                      <p className="text-sm text-primary-500">Loading versions...</p>
                    ) : versions.length > 0 ? (
                      <ul className="space-y-1">
                        {versions.map((version) => (
                          <li key={version.id} className="text-sm">
                            <a
                              href={`/documents/${docData.slug}?version=${version.version}`}
                              className={`block p-1 hover:bg-primary-100 rounded ${
                                version.version === docData.version ? 'bg-primary-100 font-medium' : ''
                              }`}
                            >
                              Version {version.version} - {formatDate(version.updated_at, true)}
                              {version.version === docData.version && ' (current)'}
                            </a>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-sm text-primary-500">No previous versions found.</p>
                    )}
                  </div>
                )}
              </div>
            )}
            
            {/* Document content */}
            <div className="prose dark:prose-invert max-w-none">
              <TipTapViewer content={docData.content} />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
