import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import { Download, Printer } from "lucide-react";
import { printDocument } from "@/utils/htmlExport";
import WandPencilIcon from "@/components/icons/WandPencilIcon";

export default function SharedHtmlView() {
  const [docData, setDocData] = useState<any>(null);
  const [htmlContent, setHtmlContent] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");
  const [isExpired, setIsExpired] = useState(false);
  const [isPinProtected, setIsPinProtected] = useState(false);
  const [documentTitle, setDocumentTitle] = useState("");
  const [createdByName, setCreatedByName] = useState("");
  const [pinCode, setPinCode] = useState("");
  const [pinError, setPinError] = useState("");
  const router = useRouter();
  const { uuid } = router.query;

  // Fetch shared document
  useEffect(() => {
    const fetchSharedDocument = async () => {
      if (!uuid) return;

      try {
        setIsLoading(true);
        console.log("Fetching shared document with UUID:", uuid);

        // Try to access the document directly from the backend API
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "http://192.168.86.33:8000";
        const fullUrl = `${apiUrl}/api/v1/shared-pdf/${uuid}`;
        console.log("Full URL:", fullUrl);

        // Use direct axios call without authentication headers for public access
        // Using the PDF endpoint since it's already set up and working
        const response = await axios.get(fullUrl, {
          headers: { "Content-Type": "application/json" },
        });
        console.log("Shared document fetched successfully:", response.data);

        // Check if the document is PIN protected
        if (response.data.pin_protected) {
          setIsPinProtected(true);
          setDocumentTitle(response.data.document_title);
          setCreatedByName(response.data.created_by_name);
          setIsLoading(false);
          return;
        }

        if (response.data.document) {
          setDocData(response.data.document);
          setHtmlContent(response.data.html_content || "");
        }

        setIsLoading(false);
      } catch (err: any) {
        console.error("Failed to load shared document:", err);

        // Check if the error is due to an expired link
        if (err.response?.status === 410) {
          setIsExpired(true);
        } else {
          setError("Failed to load shared document");
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
      setPinError("");
      setIsLoading(true);

      // Send PIN code to the server
      // Using the PDF endpoint since it's already set up and working
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "http://192.168.86.33:8000";
      const fullUrl = `${apiUrl}/api/v1/shared-pdf/${uuid}/`;
      console.log("Full URL for PIN verification:", fullUrl);

      const response = await axios.post(
        fullUrl,
        {
          pin_code: pinCode,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("PIN verification successful:", response.data);

      if (response.data.document) {
        setDocData(response.data.document);
        setHtmlContent(response.data.html_content || "");
        setIsPinProtected(false);
      }

      setIsLoading(false);
    } catch (err: any) {
      console.error("PIN verification failed:", err);

      if (err.response?.status === 403) {
        setPinError("Invalid PIN code. Please try again.");
      } else {
        setError("Failed to verify PIN code");
      }

      setIsLoading(false);
    }
  };

  // Download document as HTML
  const downloadDocument = () => {
    if (!docData) return;

    try {
      // Create a Blob from the HTML content
      const blob = new Blob(
        [
          `<!DOCTYPE html>
              <html lang="en">
              <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>${docData.title}</title>
                <style>
                  /* Logo styles */
                  .logo-container {
                    display: flex;
                    align-items: center;
                    margin-bottom: 1em;
                  }
                  .logo-text {
                    font-size: 1.5em;
                    font-weight: bold;
                    margin-left: 0.5em;
                    color: #333;
                  }
            /* Base styles */
            body {
              font-family: Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 800px;
              margin: 0 auto;
              padding: 20px;
            }
            
            /* Typography */
            h1, h2, h3, h4, h5, h6 {
              margin-top: 1.5em;
              margin-bottom: 0.5em;
              color: #111;
            }
            
            h1 { font-size: 2em; }
            h2 { font-size: 1.5em; }
            h3 { font-size: 1.3em; }
            
            p { margin-bottom: 1em; }
            
            /* Tables */
            table {
              border-collapse: collapse;
              width: 100%;
              margin: 1em 0;
            }
            
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            
            th {
              background-color: #f2f2f2;
            }
            
            /* Images */
            img {
              max-width: 100%;
              height: auto;
            }
            
            /* Lists */
            ul, ol {
              padding-left: 2em;
              margin-bottom: 1em;
            }
            
            /* Document metadata */
            .document-metadata {
              color: #666;
              font-size: 0.9em;
              margin-bottom: 2em;
              padding-bottom: 1em;
              border-bottom: 1px solid #eee;
            }
            
            /* Footer */
            .document-footer {
              margin-top: 3em;
              padding-top: 1em;
              border-top: 1px solid #eee;
              font-size: 0.8em;
              color: #666;
            }
            
            /* Print-specific styles */
            @media print {
              body {
                padding: 0;
                margin: 0;
              }
              
              /* Ensure page breaks don't occur in the middle of elements */
              h1, h2, h3, h4, h5, h6, img, table {
                page-break-inside: avoid;
                page-break-after: auto;
              }
              
              /* Ensure tables have borders when printed */
              table {
                border-collapse: collapse;
                width: 100%;
              }
              
              th, td {
                border: 1px solid #000;
                padding: 8px;
                text-align: left;
              }
            }
          </style>
        </head>
        <body>
              <!-- Logo -->
              <div class="logo-container">
                <svg width="40" height="40" viewBox="0 0 312 312" xmlns="http://www.w3.org/2000/svg">
                  <g transform="translate(0.000000,312.000000) scale(0.100000,-0.100000)" fill="#4F46E5" stroke="none">
                    <path d="M1385 2949 c-602 -81 -1082 -534 -1202 -1136 -24 -122 -24 -394 0
                    -516 58 -288 185 -526 391 -733 207 -206 445 -333 733 -391 122 -24 394 -24
                    516 0 288 58 526 185 733 391 165 166 274 342 344 556 51 155 64 247 64 435 0
                    188 -13 280 -64 435 -70 214 -179 390 -344 556 -206 205 -447 334 -728 389
                    -99 20 -345 28 -443 14z m887 -467 c131 -44 218 -128 261 -252 22 -65 22 -70
                    25 -797 l3 -733 -1001 0 -1001 0 3 732 c3 677 5 737 22 788 50 154 167 250
                    339 279 29 5 329 8 667 7 608 -1 616 -2 682 -24z" />
                    <path d="M930 2172 c-19 -9 -45 -32 -57 -51 -21 -30 -23 -46 -23 -147 l0 -114
                    710 0 710 0 0 114 c0 101 -2 117 -23 147 -47 71 -24 69 -687 69 -547 0 -598
                    -1 -630 -18z" />
                    <path d="M850 1280 l0 -260 275 0 275 0 0 215 0 215 145 0 145 0 0 -215 0
                    -215 290 0 290 0 0 260 0 260 -710 0 -710 0 0 -260z" />
                  </g>
                </svg>
                <span class="logo-text">echodraft</span>
              </div>

              <h1>${docData.title}</h1>
              
              <div class="document-metadata">
            <p><strong>Created by:</strong> ${docData.created_by_name}</p>
            <p><strong>Created:</strong> ${new Date(
              docData.created_at
            ).toLocaleDateString()}</p>
            <p><strong>Last updated:</strong> ${new Date(
              docData.updated_at
            ).toLocaleDateString()}</p>
            <p><strong>Version:</strong> ${docData.version}</p>
            ${
              docData.status
                ? `<p><strong>Status:</strong> ${docData.status}</p>`
                : ""
            }
          </div>
          
          <div class="document-content">
            ${htmlContent}
          </div>
          
              <div class="document-footer">
                <p>This document was exported from echodraft. &copy; ${new Date().getFullYear()} echodraft.</p>
          </div>
        </body>
        </html>`,
        ],
        { type: "text/html" }
      );

      // Create a URL for the Blob
      const url = URL.createObjectURL(blob);

      // Create a link element
      const link = document.createElement("a");
      link.href = url;
      link.download = `${docData.title}.html`;

      // Append the link to the body
      document.body.appendChild(link);

      // Click the link
      link.click();

      // Clean up
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading document:", error);
      setError("Failed to download document. Please try again.");
      setTimeout(() => setError(""), 3000);
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
          <div className="flex items-center mb-4">
            <WandPencilIcon className="w-8 h-8 mr-2 text-primary-500" />
            <span className="text-xl font-bold text-primary-500">
              echodraft
            </span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Link Expired</h1>
          <p className="text-gray-600 mb-6">
            This shared document link has expired and is no longer available.
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
          <div className="flex items-center mb-4">
            <WandPencilIcon className="w-8 h-8 mr-2 text-primary-500" />
            <span className="text-xl font-bold text-primary-500">
              echodraft
            </span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <p className="text-gray-500 text-sm">
            The shared document may have been deleted or is no longer
            accessible.
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
          <div className="flex items-center mb-4">
            <WandPencilIcon className="w-8 h-8 mr-2 text-primary-500" />
            <span className="text-xl font-bold text-primary-500">
              echodraft
            </span>
          </div>
          <h1 className="text-2xl font-bold text-blue-600 mb-4">
            Protected Document
          </h1>
          <p className="text-gray-600 mb-6">
            This document is protected with a PIN code. Please enter the PIN to
            view it.
          </p>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-1">
              Document: {documentTitle}
            </p>
            <p className="text-sm text-gray-500 mb-4">
              Shared by: {createdByName}
            </p>

            <label
              htmlFor="pin-code"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              PIN Code
            </label>
            <div className="mt-1 relative rounded-md shadow-sm">
              <input
                type="text"
                name="pin-code"
                id="pin-code"
                className={`block w-full pr-10 focus:outline-none text-black font-bold sm:text-sm rounded-md ${
                  pinError
                    ? "border-red-300 text-red-900 placeholder-red-300 focus:ring-red-500 focus:border-red-500"
                    : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                }`}
                placeholder="Enter 4-digit PIN"
                value={pinCode}
                onChange={(e) => setPinCode(e.target.value)}
                maxLength={4}
                pattern="[0-9]*"
                inputMode="numeric"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
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
  if (!docData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="max-w-md p-8 bg-white rounded-lg shadow-md">
          <div className="flex items-center mb-4">
            <WandPencilIcon className="w-8 h-8 mr-2 text-primary-500" />
            <span className="text-xl font-bold text-primary-500">
              echodraft
            </span>
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Document Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The document you're looking for doesn't exist or you don't have
            permission to view it.
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
      {/* Add global styles to ensure text is readable */}
      <style jsx global>{`
        /* Ensure all text in the document content has sufficient contrast */
        .prose * {
          color: #000000 !important;
        }

        /* Ensure links are still distinguishable */
        .prose a {
          color: rgb(16, 116, 124) !important;
          text-decoration: underline;
        }

        /* Ensure headings stand out */
        .prose h1,
        .prose h2,
        .prose h3,
        .prose h4,
        .prose h5,
        .prose h6 {
          color: #111827 !important;
          font-weight: bold;
        }

        /* Ensure list items are visible */
        .prose li {
          color: #000000 !important;
        }

        /* Ensure table text is visible */
        .prose table td,
        .prose table th {
          color: #000000 !important;
        }

        /* Print styles */
        @media print {
          /* Hide elements that shouldn't be printed */
          button,
          .no-print {
            display: none !important;
          }

          /* Ensure the content takes up the full page */
          body {
            margin: 0;
            padding: 0;
            background: white !important;
          }

          /* Remove max-width constraints for printing */
          .prose {
            max-width: none !important;
          }
        }
      `}</style>

      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center">
              <WandPencilIcon className="w-8 h-8 mr-2 text-primary-500" />
              <span className="text-xl font-bold text-primary-500">
                echodraft
              </span>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={printDocument}
                className="inline-flex items-center justify-center p-3 border border-transparent rounded-full shadow-sm text-white bg-primary-500 hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <Printer className="h-5 w-5" />
              </button>

              <button
                onClick={downloadDocument}
                className="inline-flex items-center justify-center p-3 border border-transparent rounded-full shadow-sm text-white bg-primary-500 hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Download className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
              <h1 className="text-2xl font-bold text-gray-900">
                {docData.title}
              </h1>
            </div>
            <div
              className="border-t border-gray-200 px-4 py-5 sm:p-6 hidden"
              id="document-info"
            >
              <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Created by
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {docData.created_by_name}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Version</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {docData.version}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Created</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(docData.created_at).toLocaleDateString()}
                  </dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">
                    Last updated
                  </dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(docData.updated_at).toLocaleDateString()}
                  </dd>
                </div>
              </dl>
            </div>
            <div
              className="px-4 py-5 sm:p-6 prose max-w-none"
              dangerouslySetInnerHTML={{ __html: htmlContent }}
            ></div>
          </div>
        </div>
      </main>

      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="text-sm text-primary-300">
              This is a shared document from{" "}
              <a
                href="https://echodraft.app"
                target="_blank"
                rel="noopener noreferrer"
                className="underline hover:text-primary-400"
              >
                echodraft
              </a>
              . &copy; {new Date().getFullYear()} echodraft.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
