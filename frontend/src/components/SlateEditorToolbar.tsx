import React, { useState } from 'react';
import { useSlate } from 'slate-react';
import { CustomEditor } from './SlateEditor';
import { Wand2, Download } from "lucide-react";
import { documentsAPI } from '@/utils/api';
import { Editor, Transforms } from 'slate';

// Define types for our formats
type BlockFormat = 'paragraph' | 'heading-one' | 'heading-two' | 'block-quote' | 'bulleted-list' | 'numbered-list' | 'list-item';
type MarkFormat = 'bold' | 'italic' | 'underline';
type AlignmentFormat = 'left' | 'center' | 'right' | 'justify';
type Format = BlockFormat | MarkFormat;

interface ToolbarButtonProps {
  format: Format;
  icon: React.ReactNode;
  isBlock?: boolean;
}

interface AlignmentButtonProps {
  alignment: AlignmentFormat;
  icon: React.ReactNode;
}

// Format Button Component (uses local formatting)
const FormatButton: React.FC = () => {
  const editor = useSlate();
  const [isFormatting, setIsFormatting] = useState(false);
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation to prevent form submission
    
    setIsFormatting(true);
    
    try {
      // Use the built-in magic format function
      CustomEditor.magicFormat(editor);
      console.log("Document formatted successfully");
    } catch (err: any) {
      console.error('Failed to format document:', err);
      alert(`Error: ${err.message || 'Failed to format document'}`);
    } finally {
      setIsFormatting(false);
    }
  };
  
  return (
    <button
      className="p-2 rounded-md text-primary-500 hover:bg-primary-200 relative"
      onMouseDown={handleClick}
      title="Format Document"
      disabled={isFormatting}
    >
      {isFormatting ? (
        <div className="animate-spin">
          <svg className="w-5 h-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      ) : (
        <Wand2 className="w-5 h-5" />
      )}
    </button>
  );
};

const AlignmentButton: React.FC<AlignmentButtonProps> = ({ alignment, icon }) => {
  const editor = useSlate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation to prevent form submission
    CustomEditor.toggleAlignment(editor, alignment);
  };
  
  const isActive = CustomEditor.isAlignmentActive(editor, alignment);
  
  return (
    <button
      className={`p-2 rounded-md ${
        isActive
          ? 'bg-primary-300 text-primary-600'
          : 'text-primary-500 hover:bg-primary-200'
      }`}
      onMouseDown={handleClick}
      title={`Align ${alignment}`}
    >
      {icon}
    </button>
  );
};

const ToolbarButton: React.FC<ToolbarButtonProps> = ({ format, icon, isBlock = false }) => {
  const editor = useSlate();
  
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Stop event propagation to prevent form submission
    
    if (isBlock) {
      CustomEditor.toggleBlock(editor, format);
    } else if (format === 'bold') {
      CustomEditor.toggleBold(editor);
    } else if (format === 'italic') {
      CustomEditor.toggleItalic(editor);
    } else if (format === 'underline') {
      CustomEditor.toggleUnderline(editor);
    }
  };
  
  let isActive = false;
  if (isBlock) {
    isActive = CustomEditor.isBlockActive(editor, format);
  } else if (format === 'bold') {
    isActive = CustomEditor.isBoldActive(editor);
  } else if (format === 'italic') {
    isActive = CustomEditor.isItalicActive(editor);
  } else if (format === 'underline') {
    isActive = CustomEditor.isUnderlineActive(editor);
  }
  
  return (
    <button
      className={`p-2 rounded-md ${
        isActive
          ? 'bg-primary-300 text-primary-600'
          : 'text-primary-500 hover:bg-primary-200'
      }`}
      onMouseDown={handleClick}
      title={format.charAt(0).toUpperCase() + format.slice(1)}
    >
      {icon}
    </button>
  );
};

const SlateEditorToolbar: React.FC = () => {
  return (
    <div className="flex flex-wrap gap-1 p-2 mb-2 border border-primary-200 rounded-md bg-primary-100 sticky top-0 z-10">
      <ToolbarButton
        format="bold"
        icon={
          <span className="font-bold text-lg">B</span>
        }
      />
      <ToolbarButton
        format="italic"
        icon={
          <span className="italic text-lg">I</span>
        }
      />
      <ToolbarButton
        format="underline"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M6.75 4.5v7.5a5.25 5.25 0 1010.5 0v-7.5h-2.25v7.5a3 3 0 01-6 0v-7.5H6.75zM5.25 18h13.5v1.5H5.25V18z" />
          </svg>
        }
      />
      <div className="mx-2 border-r border-primary-200"></div>
      <ToolbarButton
        format="heading-one"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M6 4.5V18h3v-6h6v6h3V4.5h-3v4.5H9V4.5H6z" />
          </svg>
        }
        isBlock
      />
      <ToolbarButton
        format="heading-two"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M6 4.5V18h3v-6h6v6h3V4.5h-3v4.5H9V4.5H6z" />
            <path d="M19.5 22.5h-15v-3h15v3z" />
          </svg>
        }
        isBlock
      />
      <div className="mx-2 border-r border-primary-200"></div>
      <ToolbarButton
        format="bulleted-list"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M4 4a1 1 0 100 2 1 1 0 000-2zM7 5h13a1 1 0 100-2H7a1 1 0 000 2zM4 10a1 1 0 100 2 1 1 0 000-2zM7 11h13a1 1 0 100-2H7a1 1 0 000 2zM4 16a1 1 0 100 2 1 1 0 000-2zM7 17h13a1 1 0 100-2H7a1 1 0 000 2z" />
          </svg>
        }
        isBlock
      />
      <ToolbarButton
        format="numbered-list"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M3.5 5h13a1 1 0 100-2h-13a1 1 0 000 2zM3.5 11h13a1 1 0 100-2h-13a1 1 0 000 2zM3.5 17h13a1 1 0 100-2h-13a1 1 0 000 2zM20 4h-1v4h-1V5h-1V4h2V3h1v1zM18 11.5v-.25h2v-.75h-1v-1h2v3h-3v-1zM20 17v-1h-2v-1h3v3h-3v-1z" />
          </svg>
        }
        isBlock
      />
      <ToolbarButton
        format="block-quote"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
          </svg>
        }
        isBlock
      />
      <div className="mx-2 border-r border-primary-200"></div>
      {/* Alignment buttons */}
      <AlignmentButton
        alignment="left"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h10a1 1 0 110 2H4a1 1 0 01-1-1zm0 6a1 1 0 011-1h14a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        }
      />
      <AlignmentButton
        alignment="center"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm3 6a1 1 0 011-1h10a1 1 0 110 2H7a1 1 0 01-1-1zm-1 6a1 1 0 011-1h14a1 1 0 110 2H6a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        }
      />
      <AlignmentButton
        alignment="right"
        icon={
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
            <path fillRule="evenodd" d="M3 6a1 1 0 011-1h16a1 1 0 110 2H4a1 1 0 01-1-1zm6 6a1 1 0 011-1h10a1 1 0 110 2H10a1 1 0 01-1-1zm3 6a1 1 0 011-1h7a1 1 0 110 2h-7a1 1 0 01-1-1z" clipRule="evenodd" />
          </svg>
        }
      />
      {/* Removed align justify button */}
      {/* Removed format document button */}
      <div className="mx-2 border-r border-primary-200"></div>
      {/* Export PDF button - only shown when document slug is available */}
      {window.location.pathname.includes('/documents/') && 
        window.location.pathname.includes('/edit') && (
        <button
          className="p-2 rounded-md text-primary-500 hover:bg-primary-200"
              onClick={async () => {
                try {
                  // Extract slug from URL
                  const slug = window.location.pathname.split('/documents/')[1].split('/edit')[0];
                  if (!slug) return;
                  
                  // Show loading indicator
                  const button = window.document.activeElement as HTMLButtonElement;
                  const originalContent = button.innerHTML;
                  button.innerHTML = '<div class="animate-spin h-4 w-4 border-2 border-primary-500 border-t-transparent rounded-full"></div>';
                  button.disabled = true;
                  
                  // Get document data for PDF generation
                  const response = await documentsAPI.exportPDF(slug);
                  const { document: docData, html_content } = response.data;
                  
                  // Create HTML template for PDF with CSS to ensure numbered lists display correctly
                  const htmlTemplate = `
                    <div style="font-family: Arial, sans-serif; margin: 40px;">
                      <style>
                        /* Ensure numbered lists display correctly */
                        ol {
                          list-style-type: decimal;
                          margin-left: 20px;
                          padding-left: 20px;
                        }
                        ol li {
                          display: list-item;
                          margin-bottom: 8px;
                        }
                        ul {
                          list-style-type: disc;
                          margin-left: 20px;
                          padding-left: 20px;
                        }
                        ul li {
                          display: list-item;
                          margin-bottom: 8px;
                        }
                      </style>
                      <h1 style="color: #333;">${docData.title}</h1>
                      <div style="color: #666; margin-bottom: 20px; font-size: 0.9em;">
                        <p>Created by: ${docData.created_by_name}</p>
                        <p>Created: ${new Date(docData.created_at).toLocaleDateString()}</p>
                        <p>Last updated: ${new Date(docData.updated_at).toLocaleDateString()}</p>
                        <p>Version: ${docData.version}</p>
                        <p>Status: ${docData.status}</p>
                        ${docData.category_name ? `<p>Category: ${docData.category_name}</p>` : ''}
                        ${docData.tags && docData.tags.length > 0 ? `<p>Tags: ${docData.tags.join(', ')}</p>` : ''}
                      </div>
                      <div style="line-height: 1.5;">
                        ${html_content}
                      </div>
                    </div>
                  `;
                  
                  // Generate PDF
                  const element = window.document.createElement('div');
                  element.innerHTML = htmlTemplate;
                  window.document.body.appendChild(element);
                  
                  const options = {
                    margin: 10,
                    filename: `${docData.title}.pdf`,
                    image: { type: 'jpeg', quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' as const }
                  };
                  
                  await import('html2pdf.js').then(html2pdf => {
                    return html2pdf.default().from(element).set(options).save();
                  });
                  
                  // Clean up
                  window.document.body.removeChild(element);
                  button.innerHTML = originalContent;
                  button.disabled = false;
                } catch (error) {
                  console.error('Error generating PDF:', error);
                  alert('Failed to generate PDF. Please try again.');
                }
              }}
          title="Export as PDF"
        >
          <Download className="w-5 h-5" />
        </button>
      )}
    </div>
  );
};

export default SlateEditorToolbar;
