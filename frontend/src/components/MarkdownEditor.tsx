import React from 'react';
import MarkdownIt from 'markdown-it';
import MdEditor from 'react-markdown-editor-lite';
import 'react-markdown-editor-lite/lib/index.css';

// Initialize a markdown parser
const mdParser = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  // Enable line breaks
  breaks: true,
});

// Add table support to markdown-it
mdParser.enable(['table']);

// Import additional plugins for markdown-it if needed
try {
  // These are optional enhancements that might not be available
  // but can improve the table rendering
  const markdownItTable = require('markdown-it-table');
  mdParser.use(markdownItTable);
} catch (e) {
  console.warn('markdown-it-table plugin not available, using built-in table support');
}

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  title?: string;
}

// Helper function to convert Slate.js JSON to Markdown
const slateToMarkdown = (slateContent: any): string => {
  if (!slateContent || !Array.isArray(slateContent)) {
    return '';
  }

  let markdown = '';

  const processNode = (node: any): string => {
    if (typeof node === 'string') {
      return node;
    }

    if (!node) {
      return '';
    }

    // Handle text nodes with formatting
    if (node.text !== undefined) {
      let text = node.text;
      if (node.bold) {
        text = `**${text}**`;
      }
      if (node.italic) {
        text = `*${text}*`;
      }
      if (node.underline) {
        text = `<u>${text}</u>`;
      }
      return text;
    }

    // Handle element nodes
    if (node.children) {
      const childrenText = node.children.map(processNode).join('');
      
      switch (node.type) {
        case 'paragraph':
          return childrenText + '\n\n';
        case 'heading-one':
          return `# ${childrenText}\n\n`;
        case 'heading-two':
          return `## ${childrenText}\n\n`;
        case 'block-quote':
          return `> ${childrenText}\n\n`;
        case 'bulleted-list':
          return childrenText;
        case 'numbered-list':
          return childrenText;
        case 'list-item':
          // For list items, we need to determine if they're in a bulleted or numbered list
          // This is a simplification - in a real implementation, you'd need to track the parent
          if (node._parent && node._parent.type === 'numbered-list') {
            return `1. ${childrenText}\n`;
          }
          return `- ${childrenText}\n`;
        default:
          return childrenText;
      }
    }

    return '';
  };

  slateContent.forEach((node: any) => {
    markdown += processNode(node);
  });

  return markdown;
};

const MarkdownEditor: React.FC<MarkdownEditorProps> = ({ 
  value, 
  onChange, 
  placeholder = 'Enter your text here...',
  height = '400px',
  title
}) => {
  // Process the value to ensure it's in Markdown format
  const processValue = (inputValue: any): string => {
    // Check if value is a string (already Markdown) or an object (Slate.js JSON)
    if (typeof inputValue === 'string') {
      return inputValue;
    } else {
      try {
        // Try to parse as JSON if it's a string representation of JSON
        const parsedValue = typeof inputValue === 'string' ? JSON.parse(inputValue) : inputValue;
        return slateToMarkdown(parsedValue);
      } catch (error) {
        console.error('Error converting Slate.js content to Markdown:', error);
        return '';
      }
    }
  };

  // Process the initial value
  const initialMarkdown = processValue(value);

  // Handle editor change
  const handleEditorChange = ({ text }: { text: string }) => {
    onChange(text);
  };

  return (
    <div className="markdown-editor">
      {title && (
        <div className="editor-title bg-white dark:bg-primary-100 border-b border-gray-200 dark:border-gray-700 p-4">
          <h1 className="text-3xl font-bold text-primary-800 dark:text-primary-200">
            {title}
          </h1>
        </div>
      )}
      <MdEditor
        value={initialMarkdown}
        style={{ height }}
        renderHTML={(text) => mdParser.render(text)}
        onChange={handleEditorChange}
        placeholder={placeholder}
        plugins={[
          'header',
          'font-bold',
          'font-italic',
          'font-underline',
          'list-unordered',
          'list-ordered',
          'block-quote',
          'block-wrap',
          'table'
        ]}
        config={{
          view: {
            menu: true,
            md: true, // Show markdown source by default
            html: false, // Hide HTML preview by default
          },
          canView: {
            menu: true,
            md: true, // Allow toggling markdown source
            html: true, // Allow toggling HTML preview
            fullScreen: true,
          },
          table: {
            maxRow: 10,
            maxCol: 10,
            // Make sure the table plugin is properly initialized
            enabled: true
          },
          syncScrollMode: ['leftFollowRight', 'rightFollowLeft'],
          // Add a custom handler for table insertion
          onTableInsert: (rowNum: number, colNum: number) => {
            console.log(`Inserting table with ${rowNum} rows and ${colNum} columns`);
            // Generate table markdown
            let tableMarkdown = '\n';
            // Header row
            tableMarkdown += '| ' + Array(colNum).fill('Header').map((h, i) => `${h} ${i+1}`).join(' | ') + ' |\n';
            // Separator row
            tableMarkdown += '| ' + Array(colNum).fill('---').join(' | ') + ' |\n';
            // Data rows
            for (let i = 0; i < rowNum; i++) {
              tableMarkdown += '| ' + Array(colNum).fill(`Cell ${i+1}`).join(' | ') + ' |\n';
            }
            tableMarkdown += '\n';
            return tableMarkdown;
          },
          // Add page break indicator
          shortcuts: {
            'Ctrl-Enter': (editor: any) => {
              // Insert a page break indicator
              const pageBreakMarkdown = '\n<div class="page-break-indicator"></div>\n';
              editor.insertText(pageBreakMarkdown);
              return true;
            }
          }
        }}
      />
    </div>
  );
};

export default MarkdownEditor;
