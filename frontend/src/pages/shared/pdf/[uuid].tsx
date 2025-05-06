import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Download } from 'lucide-react';
import Script from 'next/script';
import WandPencilIcon from '@/components/icons/WandPencilIcon';

export default function SharedPDFView() {
  const [document, setDocument] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExpired, setIsExpired] = useState(false);
  const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [documentTitle, setDocumentTitle] = useState('');
  const [createdByName, setCreatedByName] = useState('');
  const [pinCode, setPinCode] = useState('');
  const [pinError, setPinError] = useState('');
  const router = useRouter();
  const { uuid } = router.query;

  // Process HTML content to ensure text is readable
  const processHtmlForDisplay = (html: string) => {
    // Process HTML content to force black text
    return html.replace(/<([a-z][a-z0-9]*)[^>]*?>/gi, (match: string, tag: string) => {
      // Don't modify certain tags
      if (['style', 'script', 'svg', 'path', 'img', 'br', 'hr'].includes(tag.toLowerCase())) {
        return match;
      }
      // Add style attribute to force black text
      if (match.includes('style="')) {
        return match.replace('style="', 'style="color: #000000 !important; ');
      } else {
        return match.replace('>', ' style="color: #000000 !important;">');
      }
    });
  };

  // Fetch shared document
  useEffect(() => {
    const fetchSharedDocument = async () => {
      if (!uuid) return;
      
      try {
        setIsLoading(true);
        // Use direct axios call without authentication headers for public access
        const response = await axios.get(`/api/v1/shared-pdf/${uuid}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        console.log('Shared document fetched successfully:', response.data);
        
        // Check if the document is PIN protected
        if (response.data.pin_protected) {
          setIsPinProtected(true);
          setDocumentTitle(response.data.document_title);
          setCreatedByName(response.data.created_by_name);
          setIsLoading(false);
          return;
        }
        
        if (response.data.document) {
          setDocument(response.data.document);
          // Process HTML content to ensure text is readable
          const processedHtml = processHtmlForDisplay(response.data.html_content || '');
          setHtmlContent(processedHtml);
        }
        
        setIsLoading(false);
      } catch (err: any) {
        console.error('Failed to load shared document:', err);
        
        // Check if the error is due to an expired link
        if (err.response?.status === 410) {
          setIsExpired(true);
        } else {
          setError('Failed to load shared document');
        }
        
        setIsLoading(false);
      }
    };

    fetchSharedDocument();
  }, [uuid]);
  
  // Submit PIN code
  const submitPinCode = async () => {
    if (!uuid || !pinCode) return;
    
    try {
      setPinError('');
      setIsLoading(true);
      
      // Send PIN code to the server
      const response = await axios.post(`/api/v1/shared-pdf/${uuid}/`, {
        pin_code: pinCode
      }, {
        headers: { 'Content-Type': 'application/json' }
      });
      
      console.log('PIN verification successful:', response.data);
      
      if (response.data.document) {
        setDocument(response.data.document);
        // Process HTML content to ensure text is readable
        const processedHtml = processHtmlForDisplay(response.data.html_content || '');
        setHtmlContent(processedHtml);
        setIsPinProtected(false);
      }
      
      setIsLoading(false);
    } catch (err: any) {
      console.error('PIN verification failed:', err);
      
      if (err.response?.status === 403) {
        setPinError('Invalid PIN code. Please try again.');
      } else {
        setError('Failed to verify PIN code');
      }
      
      setIsLoading(false);
    }
  };

  // Generate PDF function
  const generatePDF = async () => {
    if (!document || !html2pdfLoaded || typeof window === 'undefined') return;
    
    try {
      // Show loading indicator
      const button = window.document.activeElement as HTMLButtonElement;
      const originalContent = button.innerHTML;
      button.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>';
      button.disabled = true;
      
      // Process HTML content to force black text
      const processedHtmlContent = htmlContent.replace(/<([a-z][a-z0-9]*)[^>]*?>/gi, (match: string, tag: string) => {
        // Don't modify certain tags
        if (['style', 'script', 'svg', 'path', 'img', 'br', 'hr'].includes(tag.toLowerCase())) {
          return match;
        }
        // Add style attribute to force black text
        if (match.includes('style="')) {
          return match.replace('style="', 'style="color: #000000 !important; ');
        } else {
          return match.replace('>', ' style="color: #000000 !important;">');
        }
      });
      
      // Create HTML template for PDF with style to force all text to be black and ensure numbered lists display correctly
      const htmlTemplate = `
        <div style="font-family: Arial, sans-serif; margin: 40px; color: #000000 !important; background-color: #ffffff !important;">
          <style>
            /* Simple reset to ensure consistent styling */
            * {
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            
            /* Basic styling for document */
            body {
              font-family: Arial, sans-serif;
              line-height: 1.5;
              color: #000000 !important;
              background-color: #ffffff !important;
            }
            
            /* Ensure numbered lists display correctly */
            ol {
              list-style-type: decimal;
              margin-left: 20px;
              padding-left: 20px;
            }
            
            ul {
              list-style-type: disc;
              margin-left: 20px;
              padding-left: 20px;
            }
            
            /* Table styles */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 8px 0;
              page-break-inside: avoid !important;
            }
            
            th, td {
              border: 1px solid #000000;
              padding: 8px;
              text-align: left;
              color: #000000 !important;
            }
            
            /* Page break control */
            @page {
              margin: 1cm;
            }
            
            .page-break {
              page-break-before: always !important;
            }
          </style>
          <h1 style="color: #000000 !important; font-weight: bold;">${document.title}</h1>
          <div style="color: #000000 !important; margin-bottom: 20px; font-size: 0.9em;">
            <p style="color: #000000 !important;">Created by: ${document.created_by_name}</p>
            <p style="color: #000000 !important;">Created: ${new Date(document.created_at).toLocaleDateString()}</p>
            <p style="color: #000000 !important;">Last updated: ${new Date(document.updated_at).toLocaleDateString()}</p>
            <p style="color: #000000 !important;">Version: ${document.version}</p>
            <p style="color: #000000 !important;">Status: ${document.status}</p>
          </div>
          <div style="line-height: 1.5; color: #000000 !important;">
            ${processedHtmlContent}
          </div>
        </div>
      `;
      
      // Generate PDF
      const element = window.document.createElement('div');
      element.innerHTML = htmlTemplate;
      window.document.body.appendChild(element);
      
      const options = {
        margin: 10,
        filename: `${document.title}.pdf`,
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { 
          scale: 2,
          useCORS: true, // Allow loading of images from other domains
          logging: true, // Enable logging for debugging
          imageTimeout: 15000, // Increase timeout for image loading (15 seconds)
          allowTaint: true, // Allow images from other domains to taint the canvas
        },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
      };
      
      // @ts-ignore - html2pdf is loaded via script tag
      await window.html2pdf().from(element).set(options).save();
      
      // Clean up
      window.document.body.removeChild(element);
      button.innerHTML = originalContent;
      button.disabled = false;
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF. Please try again.');
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-700">Loading...</h2>
        </div>
      </div>
    );
  }

  // Show expired state
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-6">
            This shared PDF link has expired and is no longer available.
          </p>
          <p className="text-gray-500 text-sm">
            Please contact the document owner for a new link.
          </p>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-danger-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">
            {error}
          </p>
          <p className="text-gray-500 text-sm">
            The shared document may have been deleted or is no longer accessible.
          </p>
        </div>
      </div>
    );
  }

  // Show PIN entry form
  if (isPinProtected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-blue-600 mb-4">Protected Document</h1>
          <p className="text-gray-600 mb-6">
            This document is protected with a PIN code. Please enter the PIN to view it.
          </p>
          
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">Document: {documentTitle}</p>
            <p className="text-sm text-gray-500 mb-4">Shared by: {createdByName}</p>
            
            <label htmlFor="pin-code" className="block text-sm font-medium text-gray-700 mb-1">
              PIN Code
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                name="pin-code"
                id="pin-code"
                className={`block w-full pr-10 focus:outline-none sm:text-sm rounded-md ${
                  pinError ? 'border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500' : 
                  'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
                }`}
                placeholder="Enter 4-digit PIN"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    submitPinCode();
                  }
                }}
              />
            </div>
            {pinError && (
              <p className="mt-2 text-sm text-red-600" id="pin-error">
                {pinError}
              </p>
            )}
          </div>
          
          <button
            type="button"
            className="w-full inline-flex justify-center items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            onClick={submitPinCode}
            disabled={!pinCode || pinCode.length !== 4}
          >
            Submit PIN
          </button>
        </div>
      </div>
    );
  }

  // Show document not found
  if (!document) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Document Not Found</h1>
          <p className="text-gray-600 mb-6">
            The document you're looking for doesn't exist or you don't have permission to view it.
          </p>
          <p className="text-gray-500 text-sm">
            The shared link may have expired or been removed.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Load html2pdf.js via script tag */}
      <Script 
        src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
        onLoad={() => setHtml2pdfLoaded(true)}
      />
      
      {/* Add global styles to ensure text is readable */}
      <style jsx global>{`
        /* Ensure all text in the document content has sufficient contrast */
        .prose * {
          color: #000000 !important;
        }
        
        /* Ensure links are still distinguishable */
        .prose a {
          color: #2563eb !important;
          text-decoration: underline;
        }
        
        /* Ensure headings stand out */
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: #111827 !important;
          font-weight: bold;
        }
        
        /* Ensure list items are visible */
        .prose li {
          color: #000000 !important;
        }
        
        /* Ensure table text is visible */
        .prose table td, .prose table th {
          color: #000000 !important;
        }
      `}</style>
      
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <WandPencilIcon className="w-8 h-8 mr-2 text-primary-500" />
              <span className="text-xl font-bold text-primary-600 mr-6">echodraft</span>
              <h1 className="text-2xl font-bold text-gray-800">{document.title}</h1>
            </div>
            <button
              onClick={generatePDF}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-black bg-secondary-600 hover:bg-secondary-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              disabled={!html2pdfLoaded}
            >
              <Download className="h-4 w-4 mr-2" />
              PDF
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Document Information</h3>
              <p className="mt-1 max-w-2xl text-sm text-gray-500">Shared document details.</p>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Created by</dt>
                  <dd className="mt-1 text-sm text-gray-900">{document.created_by_name}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">{document.version}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(document.created_at).toLocaleDateString()}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Last updated</dt>
                  <dd className="mt-1 text-sm text-gray-900">{new Date(document.updated_at).toLocaleDateString()}</dd>
                </div>
                
                
              </dl>
            </div>
            <div className="px-4 py-5 sm:px-6 border-t border-gray-200">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Document Content</h3>
            </div>
            <div className="px-4 py-5 sm:p-6 prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center text-sm text-primary-100">
            <p>This is a shared document from echodraft. &copy; {new Date().getFullYear()} echodraft.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
