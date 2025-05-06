/**
 * HTML Export Utility
 * 
 * This utility provides functions for exporting documents as HTML files.
 * It handles the conversion of document content to downloadable HTML with proper styling.
 */

/**
 * Generate a downloadable HTML document from document data
 * 
 * @param documentData The document data containing title, content, metadata, etc.
 * @param htmlContent The HTML content of the document
 * @returns void - Triggers a download of the HTML file
 */
export const generateHtmlDocument = (
  documentData: {
    title: string;
    created_by_name: string;
    created_at: string;
    updated_at: string;
    version: string | number;
    status?: string;
    tags?: string[];
  },
  htmlContent: string
): void => {
  try {
    // Create a Blob from the HTML content
    const blob = new Blob([
      `<!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${documentData.title}</title>
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

        <h1>${documentData.title}</h1>
        
        <div class="document-metadata">
          <p><strong>Created by:</strong> ${documentData.created_by_name}</p>
          <p><strong>Created:</strong> ${new Date(documentData.created_at).toLocaleDateString()}</p>
          <p><strong>Last updated:</strong> ${new Date(documentData.updated_at).toLocaleDateString()}</p>
          <p><strong>Version:</strong> ${documentData.version}</p>
          ${documentData.status ? `<p><strong>Status:</strong> ${documentData.status}</p>` : ''}
          ${documentData.tags && documentData.tags.length > 0 
            ? `<p><strong>Tags:</strong> ${documentData.tags.join(', ')}</p>` 
            : ''}
        </div>
        
        <div class="document-content">
          ${htmlContent}
        </div>
        
        <div class="document-footer">
          <p>This document was exported from echodraft. &copy; ${new Date().getFullYear()} echodraft.</p>
        </div>
      </body>
      </html>`
    ], { type: 'text/html' });
    
    // Create a URL for the Blob
    const url = URL.createObjectURL(blob);
    
    // Create a link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `${documentData.title}.html`;
    
    // Append the link to the body
    document.body.appendChild(link);
    
    // Click the link
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  } catch (error) {
    console.error('Error generating HTML document:', error);
    throw error;
  }
};

/**
 * Process HTML content to ensure text is readable
 * This is useful for ensuring consistent styling in the exported HTML
 * 
 * @param html The HTML content to process
 * @returns The processed HTML content
 */
export const processHtmlForDisplay = (html: string): string => {
  // This is a simplified version that doesn't force black text
  // You can customize this function if you need specific styling
  return html;
};

/**
 * Print the current document
 * This is a simple wrapper around window.print() with error handling
 */
export const printDocument = (): void => {
  try {
    window.print();
  } catch (error) {
    console.error('Error printing document:', error);
    throw error;
  }
};
