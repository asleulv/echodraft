import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkBreaks from 'remark-breaks';

interface MarkdownViewerProps {
  content: string;
  title?: string;
}

const MarkdownViewer: React.FC<MarkdownViewerProps> = ({ content, title }) => {
  // Handle empty content
  if (!content || content.trim() === '') {
    return <p className="text-gray-500 dark:text-gray-400">No content</p>;
  }
  
  // Handle the case where content might still be in Slate.js JSON format
  // during the transition period
  if (content.startsWith('[') || content.startsWith('{')) {
    try {
      const parsedContent = JSON.parse(content);
      // If it's valid JSON, it's likely Slate.js content
      // Display a message about the format conversion
      return (
        <div className="slate-viewer prose dark:prose-invert max-w-none overflow-x-auto break-words">
          <p className="text-amber-600 dark:text-amber-400 mb-4">
            This document is in the old format. Please edit and save it to convert to Markdown.
          </p>
          <pre className="text-xs text-gray-500 dark:text-gray-400 overflow-auto max-h-40">
            {JSON.stringify(parsedContent, null, 2)}
          </pre>
        </div>
      );
    } catch (e) {
      // If it's not valid JSON, treat it as Markdown
      // This handles the case where the content might start with [ or { but is actually Markdown
    }
  }
  
  // Check if content contains page break indicators
  const hasPageBreaks = content.includes('<div class="page-break-indicator"></div>');
  
  // If content has page breaks, we need to handle them specially
  if (hasPageBreaks) {
    // Split content by page breaks
    const parts = content.split('<div class="page-break-indicator"></div>');
    
    return (
      <div className="markdown-viewer prose dark:prose-invert max-w-none overflow-x-auto break-words">
        {title && (
          <h1 className="text-3xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            {title}
          </h1>
        )}
        {parts.map((part, index) => (
          <React.Fragment key={index}>
            {index > 0 && (
              <div className="page-break-indicator flex items-center my-4">
                <div className="flex-grow h-0.5 bg-red-300 dark:bg-red-700"></div>
                <span className="px-2 text-xs text-red-500 dark:text-red-400 bg-white dark:bg-gray-800 font-medium">
                  PAGE BREAK
                </span>
                <div className="flex-grow h-0.5 bg-red-300 dark:bg-red-700"></div>
              </div>
            )}
            <ReactMarkdown 
              remarkPlugins={[remarkGfm, remarkBreaks]} 
              components={{
                // Add custom components to apply Tailwind classes
                p: ({node, ...props}) => <p className="my-2" {...props} />,
                h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-3" {...props} />,
                h2: ({node, ...props}) => <h2 className="text-xl font-bold my-2" {...props} />,
                h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-5 my-2" {...props} />,
                ol: ({node, ...props}) => <ol className="list-decimal ml-5 my-2" {...props} />,
                li: ({node, ...props}) => <li className="my-1" {...props} />,
                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 italic text-gray-700 dark:text-gray-300" {...props} />,
                code: ({node, inline, className, ...props}: any) => 
                  inline 
                    ? <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props} />
                    : <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto my-4"><code {...props} /></pre>,
                table: ({node, ...props}) => <table className="border-collapse border border-gray-300 dark:border-gray-600 my-4" {...props} />,
                th: ({node, ...props}) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800" {...props} />,
                td: ({node, ...props}) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props} />,
              }}
            >
              {part}
            </ReactMarkdown>
          </React.Fragment>
        ))}
      </div>
    );
  }
  
  // Regular rendering without page breaks
  return (
    <div className="markdown-viewer-container">
      <div className="markdown-viewer prose dark:prose-invert max-w-none overflow-x-auto break-words relative">
        <div className="absolute right-0 top-0 text-xs text-red-500 dark:text-red-400 bg-white dark:bg-gray-800 px-2 py-1 rounded-bl border border-red-200 dark:border-red-800">
          A4 Page Guides
        </div>
        {title && (
          <h1 className="text-3xl font-bold mb-6 pb-4 border-b border-gray-200 dark:border-gray-700">
            {title}
          </h1>
        )}
        <ReactMarkdown 
          remarkPlugins={[remarkGfm, remarkBreaks]} 
          components={{
            // Add custom components to apply Tailwind classes
            p: ({node, ...props}) => <p className="my-2" {...props} />,
            h1: ({node, ...props}) => <h1 className="text-2xl font-bold my-3" {...props} />,
            h2: ({node, ...props}) => <h2 className="text-xl font-bold my-2" {...props} />,
            h3: ({node, ...props}) => <h3 className="text-lg font-bold my-2" {...props} />,
            ul: ({node, ...props}) => <ul className="list-disc ml-5 my-2" {...props} />,
            ol: ({node, ...props}) => <ol className="list-decimal ml-5 my-2" {...props} />,
            li: ({node, ...props}) => <li className="my-1" {...props} />,
            blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 italic text-gray-700 dark:text-gray-300" {...props} />,
            code: ({node, inline, className, ...props}: any) => 
              inline 
                ? <code className="bg-gray-100 dark:bg-gray-800 px-1 py-0.5 rounded" {...props} />
                : <pre className="bg-gray-100 dark:bg-gray-800 p-4 rounded overflow-auto my-4"><code {...props} /></pre>,
            table: ({node, ...props}) => <table className="border-collapse border border-gray-300 dark:border-gray-600 my-4" {...props} />,
            th: ({node, ...props}) => <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 bg-gray-100 dark:bg-gray-800" {...props} />,
            td: ({node, ...props}) => <td className="border border-gray-300 dark:border-gray-600 px-4 py-2" {...props} />,
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    </div>
  );
};

export default MarkdownViewer;
