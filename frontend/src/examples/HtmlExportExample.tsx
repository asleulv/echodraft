import { useState } from 'react';
import { useRouter } from 'next/router';
import { Printer, Download, Share2 } from 'lucide-react';
import { generateHtmlDocument, printDocument } from '@/utils/htmlExport';

/**
 * This is an example component that demonstrates how to use the HTML export utility.
 * It shows how to replace the PDF export functionality with HTML export.
 * 
 * NOTE: This is just a reference implementation. You should adapt this to your actual components.
 */
export default function HtmlExportExample() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();
  
  // Example document data
  const documentData = {
    id: 1,
    slug: 'example-document',
    title: 'Example Document',
    content: '<p>This is an example document content.</p>',
    created_by_name: 'John Doe',
    created_at: '2025-03-25T09:00:00Z',
    updated_at: '2025-03-25T10:00:00Z',
    version: '1.0',
    status: 'published',
    tags: ['example', 'documentation']
  };
  
  // Example HTML content
  const htmlContent = `
    <h2>Introduction</h2>
    <p>This is an example document that demonstrates HTML export functionality.</p>
    
    <h3>Benefits of HTML Export</h3>
    <ul>
      <li>Better handling of page breaks when printing</li>
      <li>Consistent styling across different devices</li>
      <li>Easier to view on mobile devices</li>
      <li>Can be saved locally and viewed offline</li>
      <li>Users can still print to PDF if needed</li>
    </ul>
    
    <h3>Example Table</h3>
    <table>
      <thead>
        <tr>
          <th>Name</th>
          <th>Position</th>
          <th>Department</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>John Smith</td>
          <td>Manager</td>
          <td>Sales</td>
        </tr>
        <tr>
          <td>Jane Doe</td>
          <td>Developer</td>
          <td>Engineering</td>
        </tr>
      </tbody>
    </table>
  `;
  
  // Download document as HTML
  const downloadDocument = async () => {
    try {
      setIsLoading(true);
      
      // In a real implementation, you might fetch the document data from an API
      // const response = await documentsAPI.exportHTML(documentData.slug);
      // const { document: htmlDocData, html_content } = response.data;
      
      // For this example, we'll use the example data
      generateHtmlDocument(documentData, htmlContent);
      
      setIsLoading(false);
    } catch (error) {
      console.error('Error downloading document:', error);
      setError('Failed to download document. Please try again.');
      setTimeout(() => setError(''), 3000);
      setIsLoading(false);
    }
  };
  
  // Print the current document
  const handlePrint = () => {
    try {
      printDocument();
    } catch (error) {
      console.error('Error printing document:', error);
      setError('Failed to print document. Please try again.');
      setTimeout(() => setError(''), 3000);
    }
  };
  
  // Share document
  const shareDocument = () => {
    // In a real implementation, this would open a share modal
    console.log('Share document');
  };
  
  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">{documentData.title}</h1>
      
      {/* Error message */}
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* Action buttons */}
      <div className="flex space-x-4 mb-6">
        <button
          onClick={handlePrint}
          className="flex items-center px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          disabled={isLoading}
        >
          <Printer className="w-5 h-5 mr-2" />
          Print
        </button>
        
        <button
          onClick={downloadDocument}
          className="flex items-center px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          disabled={isLoading}
        >
          <Download className="w-5 h-5 mr-2" />
          Download HTML
        </button>
        
        <button
          onClick={shareDocument}
          className="flex items-center px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          disabled={isLoading}
        >
          <Share2 className="w-5 h-5 mr-2" />
          Share
        </button>
      </div>
      
      {/* Document content */}
      <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: htmlContent }}></div>
      
      {/* Print styles */}
      <style jsx global>{`
        @media print {
          /* Hide elements that shouldn't be printed */
          button, .no-print {
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
      `}</style>
    </div>
  );
}
