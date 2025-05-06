# HTML Export Implementation Guide

This guide provides step-by-step instructions for replacing the PDF export functionality with HTML export in your TextVault application. The HTML export approach offers several advantages:

- Better handling of page breaks when printing
- Consistent styling across different devices
- Easier to view on mobile devices
- Can be saved locally and viewed offline
- Users can still print to PDF if needed
- Simpler code with fewer dependencies

## Prerequisites

Before starting, make sure you have:
- A backup of your current code (just in case)
- Basic understanding of React and Next.js
- Familiarity with your TextVault codebase

## Implementation Steps

### Step 1: Add HTML Export Utility

We've already created a standalone HTML export utility at `frontend/src/utils/htmlExport.ts`. This utility provides functions for exporting documents as HTML files.

### Step 2: Update API Utilities

Add HTML export functionality to your API utilities by modifying `frontend/src/utils/api.ts`:

1. Open `frontend/src/utils/api.ts`
2. Find the `documentsAPI` object
3. Add a new `exportHTML` method after the existing `exportPDF` method:

```typescript
exportHTML: (slug: string) => {
  console.log('API: Exporting document as HTML with slug:', slug);
  return api.get(`documents/${slug}/export_pdf`)
  .then(response => {
    console.log('API: Document data for HTML export fetched successfully:', response.data);
    return response;
  })
  .catch(error => {
    console.error('API: Error fetching document data for HTML export:', error);
    if (error.response) {
      console.error('API: Error response data:', error.response.data);
      console.error('API: Error response status:', error.response.status);
    }
    throw error;
  });
},
```

Note: We're still using the `export_pdf` endpoint for now, as the backend doesn't need to change. The HTML generation happens entirely on the frontend.

4. Add a new `createHTMLShare` method after the existing `createPDFShare` method:

```typescript
createHTMLShare: (slug: string, options?: { expiration_type?: string, pin_protected?: boolean }) => {
  console.log('API: Creating shareable HTML link for document with slug:', slug, 'options:', options);
  return api.post(`documents/${slug}/create_pdf_share`, options)
  .then(response => {
    console.log('API: Shareable HTML link created successfully:', response.data);
    return response;
  })
  .catch(error => {
    console.error('API: Error creating shareable HTML link:', error);
    if (error.response) {
      console.error('API: Error response data:', error.response.data);
      console.error('API: Error response status:', error.response.status);
    }
    throw error;
  });
},
```

Again, we're reusing the existing backend endpoint for now.

### Step 3: Update Document Detail Page

Now, let's update the document detail page to use HTML export instead of PDF:

1. Open `frontend/src/pages/documents/[slug].tsx`
2. Import the HTML export utility at the top of the file:

```typescript
import { generateHtmlDocument, printDocument } from '@/utils/htmlExport';
```

3. Remove the `html2pdfLoaded` state and the Script import for html2pdf.js:

```typescript
// Remove this line
import Script from 'next/script';

// And remove this state
const [html2pdfLoaded, setHtml2pdfLoaded] = useState(false);
```

4. Replace the `generatePDF` function with a `downloadDocument` function:

```typescript
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
```

5. Replace the `printDocument` function with the one from the HTML export utility:

```typescript
// Print document function
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
```

6. Remove the Script tag for html2pdf.js from the return statement:

```typescript
// Remove these lines
<Script 
  src="https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js"
  onLoad={() => setHtml2pdfLoaded(true)}
/>
```

7. Update the share modal title from "Share Document as PDF" to "Share Document":

```typescript
<h3 className="text-lg leading-6 font-medium text-primary-800 mb-4">
  Share Document
</h3>
```

8. Update the share modal text to remove references to PDF:

```typescript
<p className="text-sm text-gray-500 dark:text-primary-500">
  Anyone with this link can view the document
  {expirationOption !== 'never' && ' until it expires'}.
</p>
```

9. Update the button in the header to use the new functions:

```typescript
<button
  onClick={handlePrint}
  className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary-400 dark:bg-secondary-200 text-primary-200 hover:bg-secondary-600 dark:hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-secondary-400"
  title="Print document"
>
  <Printer size={18} />
</button>
<button
  onClick={downloadDocument}
  className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary-400 dark:bg-secondary-200 text-primary-200 hover:bg-secondary-600 dark:hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-secondary-400"
  title="Download as HTML"
>
  <Download size={18} />
</button>
```

10. Update the share button title:

```typescript
<button
  onClick={createShareableLink}
  className="w-10 h-10 flex items-center justify-center rounded-full bg-secondary-400 dark:bg-secondary-200 text-primary-200 hover:bg-secondary-600 dark:hover:bg-secondary-300 focus:outline-none focus:ring-2 focus:ring-secondary-400"
  title="Share document"
>
  <Share2 size={18} />
</button>
```

### Step 4: Update Shared Document Viewer

Now, let's update the shared document viewer to use HTML instead of PDF:

1. Create a new file at `frontend/src/pages/shared/html/[uuid].tsx` based on the example in `frontend/src/examples/SharedHtmlViewer.tsx`
2. Modify the API endpoints to match your backend:
   - Change `/api/v1/shared-html/${uuid}` to `/api/v1/shared-pdf/${uuid}` (reusing the existing endpoint)
3. Import the HTML export utility:

```typescript
import { printDocument } from '@/utils/htmlExport';
```

4. Update any references to PDF to HTML in the UI text

### Step 5: Update Backend Routes (Optional)

If you want to update the backend routes to use HTML terminology instead of PDF:

1. Create new endpoints in your Django backend:
   - `documents/${slug}/export_html`
   - `documents/${slug}/create_html_share`
   - `shared-html/${uuid}`
2. These can simply be aliases to the existing PDF endpoints for now

### Step 6: Remove PDF Dependencies

Once everything is working with HTML export, you can remove the PDF-specific dependencies:

1. Remove html2pdf.js from your package.json
2. Remove the html2pdf.d.ts type definition file if you have one
3. Remove any other PDF-specific code or dependencies

## Testing Your Implementation

After implementing the changes, test the following functionality:

1. Viewing a document
2. Downloading a document as HTML
3. Printing a document
4. Sharing a document
5. Viewing a shared document
6. Downloading a shared document
7. Printing a shared document

## Troubleshooting

If you encounter issues:

1. Check the browser console for errors
2. Verify that the API endpoints are being called correctly
3. Ensure that the HTML content is being properly generated
4. Test the print functionality in different browsers

## Next Steps

Once the HTML export functionality is working, you may want to:

1. Improve the styling of the exported HTML
2. Add more customization options for the export
3. Update the backend to have dedicated HTML export endpoints
4. Add analytics to track how often documents are exported or shared

## Conclusion

By replacing PDF export with HTML export, you've simplified your codebase and improved the user experience. HTML export provides better compatibility across devices and browsers, and gives users more flexibility in how they use and share their documents.
