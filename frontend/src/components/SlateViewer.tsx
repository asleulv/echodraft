import React from 'react';
import { Descendant } from 'slate';

interface SlateViewerProps {
  content: Descendant[];
}

// Helper function to render a Slate node
const renderNode = (node: any, index: number): React.ReactNode => {
  // Get alignment style
  const getAlignmentClass = () => {
    const align = node.align;
    switch (align) {
      case 'center':
        return 'text-center';
      case 'right':
        return 'text-right';
      case 'justify':
        return 'extreme-justify';
      case 'left':
      default:
        return 'text-left';
    }
  };

  // Get list alignment class
  const getListAlignmentClass = () => {
    const align = node.align;
    switch (align) {
      case 'center':
        return 'list-align-center';
      case 'right':
        return 'list-align-right';
      case 'justify':
        return 'list-align-justify';
      case 'left':
      default:
        return 'list-align-left';
    }
  };

  const alignClass = getAlignmentClass();
  const listAlignClass = getListAlignmentClass();

  // Text node
  if ('text' in node) {
    // Special case for empty text nodes - these are often used for line breaks
    if (node.text === '') {
      return <br key={index} />;
    }
    
    // Split text by newlines to preserve line breaks
    const lines = node.text.split('\n');
    
    // If there are no line breaks, just return the formatted text
    if (lines.length === 1) {
      let text = node.text;
      
      // Apply formatting
      if (node.bold) {
        text = <strong key={index}>{text}</strong>;
      }
      if (node.italic) {
        text = <em key={index}>{text}</em>;
      }
      if (node.underline) {
        text = <u key={index}>{text}</u>;
      }
      
      return text;
    }
    
    // If there are line breaks, create an array of elements with <br /> tags
    return lines.map((line: string, lineIndex: number) => {
      // For empty lines (consecutive newlines), add a single line break
      if (line === '') {
        return <br key={`${index}-${lineIndex}`} />;
      }
      
      // Create a React fragment for each line with appropriate formatting
      let formattedLine = <React.Fragment>{line}</React.Fragment>;
      
      // Apply formatting to each line
      if (node.bold) {
        formattedLine = <strong key={`${index}-${lineIndex}-bold`}>{line}</strong>;
      }
      if (node.italic) {
        formattedLine = <em key={`${index}-${lineIndex}-italic`}>{line}</em>;
      }
      if (node.underline) {
        formattedLine = <u key={`${index}-${lineIndex}-underline`}>{line}</u>;
      }
      
      // Add a <br /> after each line except the last one
      return (
        <React.Fragment key={`${index}-${lineIndex}`}>
          {formattedLine}
          {lineIndex < lines.length - 1 && <br />}
        </React.Fragment>
      );
    });
  }
  
  // Element node
  const children = node.children.map(renderNode);
  
  // For justified text, we need to wrap it in a container with a fixed width
  const renderJustifiedContent = (element: JSX.Element) => {
    if (alignClass === 'extreme-justify') {
      return (
        <div key={`justify-container-${index}`} className="w-full justify-container">
          {element}
        </div>
      );
    }
    return element;
  };

  let elementToRender;
  switch (node.type) {
    case 'paragraph':
      elementToRender = <p key={index} className={`my-1 whitespace-pre-wrap break-words ${alignClass}`}>{children}</p>;
      break;
    case 'heading-one':
      elementToRender = <h1 key={index} className={`text-2xl font-bold my-2 break-words ${alignClass}`}>{children}</h1>;
      break;
    case 'heading-two':
      elementToRender = <h2 key={index} className={`text-xl font-bold my-2 break-words ${alignClass}`}>{children}</h2>;
      break;
    case 'block-quote':
      elementToRender = (
        <blockquote key={index} className={`border-l-4 border-solid border-gray-300 dark:border-gray-600 pl-4 py-1 italic text-gray-700 dark:text-gray-300 break-words ${alignClass}`}>
          {children}
        </blockquote>
      );
      break;
    case 'bulleted-list':
      elementToRender = <ul key={index} className={`list-disc ${listAlignClass}`}>{children}</ul>;
      break;
    case 'numbered-list':
      elementToRender = <ol key={index} className={`list-decimal ${listAlignClass}`}>{children}</ol>;
      break;
    case 'list-item':
      elementToRender = <li key={index} className="break-words">{children}</li>;
      break;
    default:
      elementToRender = <div key={index} className={alignClass}>{children}</div>;
      break;
  }

  return renderJustifiedContent(elementToRender);
};

const SlateViewer: React.FC<SlateViewerProps> = ({ content }) => {
  // Handle empty content
  if (!content || content.length === 0) {
    return <p className="text-gray-500 dark:text-gray-400">No content</p>;
  }
  
  return (
    <div className="slate-viewer prose dark:prose-invert max-w-none overflow-x-auto break-words">
      {content.map((node, index) => renderNode(node, index))}
    </div>
  );
};

export default SlateViewer;
