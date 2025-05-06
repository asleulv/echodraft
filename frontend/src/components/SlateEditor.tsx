import React, { useCallback, useMemo, useState } from 'react';
import { createEditor, Descendant, BaseEditor, Element as SlateElement, Editor, Transforms, Text, Node, Path } from 'slate';
import { Slate, Editable, withReact, RenderElementProps, RenderLeafProps, ReactEditor } from 'slate-react';
import { withHistory, HistoryEditor } from 'slate-history';
import { jsx } from 'slate-hyperscript';
import SlateEditorToolbar from './SlateEditorToolbar';

// Helper functions for magic formatting
const isHeadingCandidate = (text: string): boolean => {
  // Check if the text is likely to be a heading
  if (!text.trim()) return false;
  
  // Check for common heading patterns
  const isShortLine = text.length < 100;
  const isAllCaps = text === text.toUpperCase() && text.length > 3;
  const endsWithColon = text.trim().endsWith(':');
  const startsWithNumber = /^\d+[\.\)]\s+[A-Z]/.test(text); // Numbered section
  const startsWithHashtag = /^#+\s+/.test(text); // Markdown style heading
  
  return (
    startsWithHashtag || 
    (isShortLine && isAllCaps) || 
    (isShortLine && endsWithColon) || 
    startsWithNumber
  );
};

const determineHeadingLevel = (text: string, nodeIndex: number): 1 | 2 => {
  // Determine if this should be a heading-one or heading-two
  // First node or very short, all caps text is likely a main heading
  if (
    nodeIndex === 0 || 
    text.startsWith('# ') || 
    (text === text.toUpperCase() && text.length < 50)
  ) {
    return 1;
  }
  
  // Otherwise, it's probably a subheading
  return 2;
};

const isBulletListCandidate = (text: string): boolean => {
  // Check if the text is likely to be a bullet list item
  const bulletPatterns = [
    /^[-•●■◦○◆◇▪▫*]\s+/,  // Common bullet characters
    /^\s*[-•●■◦○◆◇▪▫*]\s+/, // Bullets with leading whitespace
  ];
  
  return bulletPatterns.some(pattern => pattern.test(text));
};

const isNumberedListCandidate = (text: string): boolean => {
  // Check if the text is likely to be a numbered list item
  return /^\d+[\.\)]\s+/.test(text);
};

const isBlockQuoteCandidate = (text: string): boolean => {
  // Check if the text is likely to be a block quote
  if (text.startsWith('>') || text.startsWith('"')) return true;
  
  // Check for indented text (common in PDFs)
  if (text.startsWith('\t') || text.startsWith('    ')) return true;
  
  // Check for quoted text
  if ((text.startsWith('"') && text.endsWith('"')) || 
      (text.startsWith("'") && text.endsWith("'"))) {
    return true;
  }
  
  return false;
};

const groupListItems = (editor: BaseEditor & ReactEditor & HistoryEditor): void => {
  // Get all list item nodes
  const listItemNodes = Array.from(
    Editor.nodes(editor, {
      at: [],
      match: n => SlateElement.isElement(n) && n.type === 'list-item',
    })
  );
  
  // Skip if no list items found
  if (listItemNodes.length === 0) return;
  
  // Group adjacent list items by type (bulleted or numbered)
  let currentType: 'bulleted-list' | 'numbered-list' = 'bulleted-list'; // Default value
  let currentItems: Path[] = [];
  
  // Process each list item
  for (let i = 0; i < listItemNodes.length; i++) {
    const [node, path] = listItemNodes[i];
    
    // Determine the list type for this item
    let listType: 'bulleted-list' | 'numbered-list';
    
    // Check if this item is already in a list
    const [parent] = Editor.parent(editor, path);
    if (SlateElement.isElement(parent) && 
        (parent.type === 'bulleted-list' || parent.type === 'numbered-list')) {
      // Already in a list, skip
      continue;
    }
    
    // Determine list type based on content
    const text = Node.string(node);
    if (isNumberedListCandidate(text)) {
      listType = 'numbered-list';
    } else {
      listType = 'bulleted-list';
    }
    
    // If this is a new list type or the first item, start a new group
    if (currentType !== listType || currentItems.length === 0) {
      // Wrap any existing items
      if (currentItems.length > 0) {
        Transforms.wrapNodes(
          editor,
          { type: currentType, children: [] },
          { at: currentItems[0], match: n => SlateElement.isElement(n) && n.type === 'list-item' }
        );
      }
      
      // Start a new group
      currentType = listType;
      currentItems = [path];
    } else {
      // Add to current group
      currentItems.push(path);
    }
    
    // If this is the last item, wrap the group
    if (i === listItemNodes.length - 1 && currentItems.length > 0) {
      Transforms.wrapNodes(
        editor,
        { type: currentType, children: [] },
        { at: currentItems[0], match: n => SlateElement.isElement(n) && n.type === 'list-item' }
      );
    }
  }
};

// Define custom types for our Slate editor
type CustomEditor = BaseEditor & ReactEditor & HistoryEditor;

// Define custom commands for the editor
export const CustomEditor = {
  isBoldActive(editor: CustomEditor) {
    const marks = Editor.marks(editor);
    return marks ? marks.bold === true : false;
  },

  magicFormat(editor: CustomEditor) {
    try {
      // Store the current selection to restore it later
      const savedSelection = editor.selection;
      
      // Get all nodes in the document
      const nodes = Array.from(
        Editor.nodes(editor, {
          at: [],
          match: n => !Editor.isEditor(n),
        })
      );
      
      // Process each node to apply smart formatting
      for (const [node, path] of nodes) {
        try {
          if (!SlateElement.isElement(node)) continue;
          
          // Skip nodes that are already formatted as headings or other special blocks
          if (node.type !== 'paragraph') continue;
          
          // Get the text content of this node
          const textContent = Node.string(node);
          
          // Skip empty nodes
          if (!textContent.trim()) continue;
          
          // Check for heading patterns
          if (isHeadingCandidate(textContent)) {
            const headingLevel = determineHeadingLevel(textContent, path[0]);
            
            // Apply heading formatting
            Transforms.setNodes(
              editor,
              { type: headingLevel === 1 ? 'heading-one' : 'heading-two' },
              { at: path }
            );
            
            // If the text starts with a number or symbol that indicates a heading, remove it
            if (/^[\d.#]+\s+/.test(textContent)) {
              const cleanedText = textContent.replace(/^[\d.#]+\s+/, '');
              
              try {
                // For non-leaf nodes, we need to modify the text in the first child
                // Get the first child directly from the node's children array
                if (node.children && node.children.length > 0) {
                  const firstChildNode = node.children[0];
                  const firstChildPath = [...path, 0];
                  
                  if (Text.isText(firstChildNode)) {
                    // If the first child is a text node, we can update it directly
                    Transforms.delete(editor, {
                      at: {
                        anchor: { path: firstChildPath, offset: 0 },
                        focus: { path: firstChildPath, offset: textContent.length }
                      }
                    });
                    Transforms.insertText(editor, cleanedText, { at: firstChildPath });
                  } else {
                    // If the first child is not a text node, we need to replace the entire node
                    Transforms.removeNodes(editor, { at: path });
                    Transforms.insertNodes(
                      editor,
                      { 
                        type: headingLevel === 1 ? 'heading-one' : 'heading-two',
                        children: [{ text: cleanedText }]
                      },
                      { at: path }
                    );
                  }
                } else {
                  // Fallback: replace the entire node
                  Transforms.removeNodes(editor, { at: path });
                  Transforms.insertNodes(
                    editor,
                    { 
                      type: headingLevel === 1 ? 'heading-one' : 'heading-two',
                      children: [{ text: cleanedText }]
                    },
                    { at: path }
                  );
                }
              } catch (err) {
                console.error('Error updating heading text:', err);
                // Fallback: just set the node type without modifying text
              }
            }
            
            continue;
          }
          
          // Check for list patterns
          if (isBulletListCandidate(textContent)) {
            try {
              // Convert to bulleted list item
              Transforms.setNodes(editor, { type: 'list-item' }, { at: path });
              
              // Remove the bullet character
              const cleanedText = textContent.replace(/^[-•●■◦○◆◇▪▫*]\s+/, '');
              
              // Find the first text node within this element
              const textNodes = Array.from(
                Editor.nodes(editor, {
                  at: path,
                  match: n => Text.isText(n),
                })
              );
              
              if (textNodes.length > 0) {
                const [, textPath] = textNodes[0];
                // Delete the current text and insert the cleaned text
                Transforms.delete(editor, {
                  at: {
                    anchor: { path: textPath, offset: 0 },
                    focus: { path: textPath, offset: textContent.length }
                  }
                });
                Transforms.insertText(editor, cleanedText, { at: textPath });
              }
              
              // Wrap in a bulleted list if not already in one
              const [parentNode] = Editor.parent(editor, path);
              if (!SlateElement.isElement(parentNode) || parentNode.type !== 'bulleted-list') {
                Transforms.wrapNodes(
                  editor,
                  { type: 'bulleted-list', children: [] },
                  { at: path }
                );
              }
            } catch (err) {
              console.error('Error formatting bulleted list:', err);
              // Continue with next node
            }
            
            continue;
          }
          
          if (isNumberedListCandidate(textContent)) {
            try {
              // Convert to numbered list item
              Transforms.setNodes(editor, { type: 'list-item' }, { at: path });
              
              // Remove the number and period/parenthesis
              const cleanedText = textContent.replace(/^\d+[\.\)]\s+/, '');
              
              // Find the first text node within this element
              const textNodes = Array.from(
                Editor.nodes(editor, {
                  at: path,
                  match: n => Text.isText(n),
                })
              );
              
              if (textNodes.length > 0) {
                const [, textPath] = textNodes[0];
                // Delete the current text and insert the cleaned text
                Transforms.delete(editor, {
                  at: {
                    anchor: { path: textPath, offset: 0 },
                    focus: { path: textPath, offset: textContent.length }
                  }
                });
                Transforms.insertText(editor, cleanedText, { at: textPath });
              }
              
              // Wrap in a numbered list if not already in one
              const [parentNode] = Editor.parent(editor, path);
              if (!SlateElement.isElement(parentNode) || parentNode.type !== 'numbered-list') {
                Transforms.wrapNodes(
                  editor,
                  { type: 'numbered-list', children: [] },
                  { at: path }
                );
              }
            } catch (err) {
              console.error('Error formatting numbered list:', err);
              // Continue with next node
            }
            
            continue;
          }
          
          // Check for block quote patterns
          if (isBlockQuoteCandidate(textContent)) {
            try {
              // Convert to block quote
              Transforms.setNodes(editor, { type: 'block-quote' }, { at: path });
              
              // Remove quote markers if present
              if (textContent.startsWith('>') || textContent.startsWith('"')) {
                const cleanedText = textContent.replace(/^[>"]?\s+/, '');
                
                // Find the first text node within this element
                const textNodes = Array.from(
                  Editor.nodes(editor, {
                    at: path,
                    match: n => Text.isText(n),
                  })
                );
                
                if (textNodes.length > 0) {
                  const [, textPath] = textNodes[0];
                  // Delete the current text and insert the cleaned text
                  Transforms.delete(editor, {
                    at: {
                      anchor: { path: textPath, offset: 0 },
                      focus: { path: textPath, offset: textContent.length }
                    }
                  });
                  Transforms.insertText(editor, cleanedText, { at: textPath });
                }
              }
            } catch (err) {
              console.error('Error formatting block quote:', err);
              // Continue with next node
            }
            
            continue;
          }
        } catch (nodeError) {
          console.error('Error processing node:', nodeError);
          // Continue with next node
        }
      }
      
      try {
        // Group adjacent list items of the same type
        groupListItems(editor);
      } catch (listError) {
        console.error('Error grouping list items:', listError);
      }
      
      // Restore the original selection
      if (savedSelection) {
        try {
          Transforms.select(editor, savedSelection);
        } catch (selectionError) {
          console.error('Error restoring selection:', selectionError);
        }
      }
    } catch (error: any) {
      console.error('Error in magic format:', error);
      throw new Error(`Magic formatting failed: ${error.message || 'Unknown error'}`);
    }
  },

  isItalicActive(editor: CustomEditor) {
    const marks = Editor.marks(editor);
    return marks ? marks.italic === true : false;
  },

  isUnderlineActive(editor: CustomEditor) {
    const marks = Editor.marks(editor);
    return marks ? marks.underline === true : false;
  },

  isBlockActive(editor: CustomEditor, format: string) {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === format,
      })
    );

    return !!match;
  },

  isAlignmentActive(editor: CustomEditor, alignment: Alignment) {
    const { selection } = editor;
    if (!selection) return false;

    const [match] = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n =>
          !Editor.isEditor(n) && 
          SlateElement.isElement(n) && 
          (n as any).align === alignment,
      })
    );

    return !!match;
  },

  toggleBold(editor: CustomEditor) {
    const isActive = CustomEditor.isBoldActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'bold');
    } else {
      Editor.addMark(editor, 'bold', true);
    }
  },

  toggleItalic(editor: CustomEditor) {
    const isActive = CustomEditor.isItalicActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'italic');
    } else {
      Editor.addMark(editor, 'italic', true);
    }
  },

  toggleUnderline(editor: CustomEditor) {
    const isActive = CustomEditor.isUnderlineActive(editor);
    if (isActive) {
      Editor.removeMark(editor, 'underline');
    } else {
      Editor.addMark(editor, 'underline', true);
    }
  },

  toggleAlignment(editor: CustomEditor, alignment: Alignment) {
    const isActive = CustomEditor.isAlignmentActive(editor, alignment);
    
    // First, normalize the selection to ensure we're working with a valid range
    const { selection } = editor;
    if (!selection) {
      return;
    }
    
    // Get all nodes at the current selection
    const nodes = Array.from(
      Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n),
      })
    );
    
    // Check if any of the nodes are list items
    const listItemNode = nodes.find(([node]) => SlateElement.isElement(node) && node.type === 'list-item');
    
    if (listItemNode) {
      // We're in a list, so we need to find the parent list
      const listNode = nodes.find(([node]) => 
        SlateElement.isElement(node) && 
        (node.type === 'bulleted-list' || node.type === 'numbered-list')
      );
      
      if (listNode) {
        // Apply alignment to the list node
        const newAlign = isActive ? 'left' : alignment;
        
        // Use Transforms.setNodes with a specific path to the list node
        Transforms.setNodes(
          editor,
          { align: newAlign },
          { at: listNode[1] }
        );
        
        // Also apply to all list items to ensure consistency
        Transforms.setNodes(
          editor,
          { align: newAlign },
          { 
            match: n => !Editor.isEditor(n) && SlateElement.isElement(n) && n.type === 'list-item',
            mode: 'all'
          }
        );
        
        return;
      }
    }
    
    // For non-list elements
    const newAlign = isActive ? 'left' : alignment;
    
    Transforms.setNodes(
      editor,
      { align: newAlign },
      { 
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n),
        split: true
      }
    );
  },

  toggleBlock(editor: CustomEditor, format: string) {
    const isActive = CustomEditor.isBlockActive(editor, format);
    const isList = format === 'bulleted-list' || format === 'numbered-list';
    
    // First, normalize the selection to ensure we're working with a valid range
    const { selection } = editor;
    if (!selection) {
      return;
    }
    
    // Get the current alignment before changing the block type
    let currentAlign: Alignment | undefined;
    try {
      const nodes = Array.from(Editor.nodes(editor, {
        at: Editor.unhangRange(editor, selection),
        match: n => !Editor.isEditor(n) && SlateElement.isElement(n),
      }));
      
      if (nodes.length > 0) {
        const [node] = nodes;
        currentAlign = (node[0] as any).align;
      }
    } catch (error) {
      console.error('Error getting current alignment:', error);
    }
    
    // Unwrap any existing list nodes
    Transforms.unwrapNodes(editor, {
      match: n =>
        !Editor.isEditor(n) &&
        SlateElement.isElement(n) &&
        ['bulleted-list', 'numbered-list'].includes(n.type as string),
      split: true,
    });
    
    // If we're toggling off an active format, convert to paragraph
    if (isActive) {
      Transforms.setNodes<SlateElement>(editor, {
        type: 'paragraph',
        align: currentAlign, // Preserve alignment
      });
      return;
    }
    
    // If we're toggling on a list format
    if (isList) {
      // First convert the current block to a list item
      Transforms.setNodes<SlateElement>(editor, {
        type: 'list-item',
        align: currentAlign, // Preserve alignment for list items
      });
      
      // Then wrap it in the appropriate list type
      const block = { 
        type: format, 
        children: [],
        align: currentAlign, // Preserve alignment for the list
      } as any;
      Transforms.wrapNodes(editor, block);
    } 
    // For non-list formats (like block-quote, heading-one, etc.)
    else {
      Transforms.setNodes<SlateElement>(editor, {
        type: format as any,
        align: currentAlign, // Preserve alignment
      });
    }
  },
};

// Define alignment type
type Alignment = 'left' | 'center' | 'right' | 'justify';

// Base element type with optional alignment
interface BaseElement {
  align?: Alignment;
  children: CustomText[];
}

type ParagraphElement = BaseElement & {
  type: 'paragraph';
};

type HeadingOneElement = BaseElement & {
  type: 'heading-one';
};

type HeadingTwoElement = BaseElement & {
  type: 'heading-two';
};

type BlockQuoteElement = BaseElement & {
  type: 'block-quote';
};

type BulletedListElement = BaseElement & {
  type: 'bulleted-list';
};

type NumberedListElement = BaseElement & {
  type: 'numbered-list';
};

type ListItemElement = BaseElement & {
  type: 'list-item';
};

type CustomElement = 
  | ParagraphElement
  | HeadingOneElement
  | HeadingTwoElement
  | BlockQuoteElement
  | BulletedListElement
  | NumberedListElement
  | ListItemElement;

type FormattedText = {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
};

type CustomText = FormattedText;

// Extend the Slate types
declare module 'slate' {
  interface CustomTypes {
    Editor: CustomEditor;
    Element: CustomElement;
    Text: CustomText;
  }
}

// Define the props for the SlateEditor component
interface SlateEditorProps {
  value: Descendant[];
  onChange: (value: Descendant[]) => void;
  placeholder?: string;
}

// Default initial value for the editor
export const initialValue: CustomElement[] = [
  {
    type: 'paragraph',
    children: [{ text: '' }],
  },
];

// Custom element renderer
const Element = ({ attributes, children, element }: RenderElementProps) => {
  // Get alignment style
  const getAlignmentClass = () => {
    const align = (element as any).align;
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
    const align = (element as any).align;
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

  // For justified text, we need to wrap it in a container with a fixed width
  const renderJustifiedContent = (element: JSX.Element) => {
    if (alignClass === 'extreme-justify') {
      return (
        <div className="w-full justify-container">
          {element}
        </div>
      );
    }
    return element;
  };

  let elementToRender;
  switch (element.type) {
    case 'block-quote':
      elementToRender = (
        <blockquote 
          {...attributes} 
          className={`border-l-4 border-gray-300 dark:border-gray-600 pl-4 py-1 italic text-gray-700 dark:text-gray-300 ${alignClass}`}
        >
          {children}
        </blockquote>
      );
      break;
    case 'bulleted-list':
      elementToRender = <ul {...attributes} className={`list-disc ${listAlignClass}`}>{children}</ul>;
      break;
    case 'heading-one':
      elementToRender = <h1 {...attributes} className={`text-2xl font-bold my-2 ${alignClass}`}>{children}</h1>;
      break;
    case 'heading-two':
      elementToRender = <h2 {...attributes} className={`text-xl font-bold my-2 ${alignClass}`}>{children}</h2>;
      break;
    case 'list-item':
      elementToRender = <li {...attributes}>{children}</li>;
      break;
    case 'numbered-list':
      elementToRender = <ol {...attributes} className={`list-decimal ${listAlignClass}`}>{children}</ol>;
      break;
    default:
      elementToRender = <p {...attributes} className={`my-1 ${alignClass}`}>{children}</p>;
      break;
  }

  return renderJustifiedContent(elementToRender);
};

// Custom leaf renderer
const Leaf = ({ attributes, children, leaf }: RenderLeafProps) => {
  let el = <>{children}</>;
  
  if (leaf.bold) {
    el = <strong>{el}</strong>;
  }
  
  if (leaf.italic) {
    el = <em>{el}</em>;
  }
  
  if (leaf.underline) {
    el = <u>{el}</u>;
  }
  
  return <span {...attributes}>{el}</span>;
};

// Helper function to deserialize HTML to Slate nodes
const deserializeHtml = (el: HTMLElement): any => {
  // Handle different node types
  if (el.nodeType === 3) {
    // Text node
    return { text: el.textContent || '' };
  } else if (el.nodeType !== 1) {
    // Not an element node
    return null;
  } else if (el.nodeName === 'BR') {
    return { text: '\n' };
  }

  // Handle element nodes
  const { nodeName } = el;
  let type: string;
  let children: any[] = [];

  // Special handling for Google Docs content
  if (nodeName === 'META' || nodeName === 'STYLE' || nodeName === 'LINK') {
    return null;
  }

  // Handle different element types
  if (nodeName === 'BODY') {
    // For body, we'll process children but not create a node
    for (const child of Array.from(el.childNodes)) {
      const childNode = deserializeHtml(child as HTMLElement);
      if (childNode) {
        if (Array.isArray(childNode)) {
          children.push(...childNode);
        } else {
          children.push(childNode);
        }
      }
    }
    return children;
  } else if (nodeName === 'P') {
    type = 'paragraph';
  } else if (nodeName === 'H1') {
    type = 'heading-one';
  } else if (nodeName === 'H2') {
    type = 'heading-two';
  } else if (nodeName === 'BLOCKQUOTE') {
    type = 'block-quote';
  } else if (nodeName === 'UL') {
    type = 'bulleted-list';
  } else if (nodeName === 'OL') {
    type = 'numbered-list';
  } else if (nodeName === 'LI') {
    type = 'list-item';
  } else if (nodeName === 'DIV') {
    // Check if this div contains a list
    if (el.querySelector('ul, ol')) {
      // Process children directly
      for (const child of Array.from(el.childNodes)) {
        const childNode = deserializeHtml(child as HTMLElement);
        if (childNode) {
          if (Array.isArray(childNode)) {
            children.push(...childNode);
          } else {
            children.push(childNode);
          }
        }
      }
      return children;
    } else {
      type = 'paragraph';
    }
  } else if (nodeName === 'SPAN') {
    // For spans, we'll just extract the text with formatting
    const text = el.textContent || '';
    const result: FormattedText = { text };
    
    // Check for formatting
    const style = el.getAttribute('style') || '';
    const fontWeight = el.style.fontWeight || '';
    const fontStyle = el.style.fontStyle || '';
    const textDecoration = el.style.textDecoration || '';
    
    if (fontWeight === 'bold' || fontWeight === '700' || style.includes('font-weight:700') || style.includes('font-weight: 700')) {
      result.bold = true;
    }
    
    if (fontStyle === 'italic' || style.includes('font-style:italic') || style.includes('font-style: italic')) {
      result.italic = true;
    }
    
    if (textDecoration === 'underline' || style.includes('text-decoration:underline') || style.includes('text-decoration: underline')) {
      result.underline = true;
    }
    
    return result;
  } else {
    type = 'paragraph';
  }

  // Handle children for block elements
  if (type !== 'span') {
    for (const child of Array.from(el.childNodes)) {
      const childNode = deserializeHtml(child as HTMLElement);
      if (childNode) {
        if (Array.isArray(childNode)) {
          children.push(...childNode);
        } else {
          children.push(childNode);
        }
      }
    }
  }

  // Handle empty nodes
  if (children.length === 0) {
    children = [{ text: el.textContent || '' }];
  }

  // Apply text formatting from element attributes
  const style = el.getAttribute('style') || '';
  
  if (el.style.fontWeight === 'bold' || el.style.fontWeight === '700' || 
      style.includes('font-weight:700') || style.includes('font-weight: 700') || 
      nodeName === 'B' || nodeName === 'STRONG') {
    for (const child of children) {
      if (typeof child.text === 'string') {
        child.bold = true;
      }
    }
  }

  if (el.style.fontStyle === 'italic' || style.includes('font-style:italic') || 
      style.includes('font-style: italic') || nodeName === 'I' || nodeName === 'EM') {
    for (const child of children) {
      if (typeof child.text === 'string') {
        child.italic = true;
      }
    }
  }

  if (el.style.textDecoration === 'underline' || style.includes('text-decoration:underline') || 
      style.includes('text-decoration: underline') || nodeName === 'U') {
    for (const child of children) {
      if (typeof child.text === 'string') {
        child.underline = true;
      }
    }
  }

  // Create the properly typed node
  switch (type) {
    case 'paragraph':
      return { type: 'paragraph' as const, children };
    case 'heading-one':
      return { type: 'heading-one' as const, children };
    case 'heading-two':
      return { type: 'heading-two' as const, children };
    case 'block-quote':
      return { type: 'block-quote' as const, children };
    case 'bulleted-list':
      return { type: 'bulleted-list' as const, children };
    case 'numbered-list':
      return { type: 'numbered-list' as const, children };
    case 'list-item':
      return { type: 'list-item' as const, children };
    default:
      return { type: 'paragraph' as const, children };
  }
};

// Custom plugin to handle pasted content
const withHtml = (editor: CustomEditor) => {
  const { insertData } = editor;

  editor.insertData = (data: DataTransfer) => {
    // Try HTML content first to preserve formatting
    const html = data.getData('text/html');
    
    if (html) {
      console.log('Pasting HTML content:', html);
      
      try {
        // Create a temporary DOM element to parse the HTML
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        
        // Extract all paragraphs, headings, lists, etc.
        const elements = doc.querySelectorAll('p, h1, h2, h3, h4, h5, h6, ul, ol, li, blockquote');
        
        if (elements.length > 0) {
          console.log('Found HTML elements:', elements);
          
          // Convert HTML elements to Slate nodes
          const nodes: CustomElement[] = [];
          
          elements.forEach(el => {
            // Skip empty elements
            if (!el.textContent || el.textContent.trim() === '') {
              return;
            }
            
            // Determine element type
            let type: string;
            let text = el.textContent || '';
            let isBold = false;
            let isItalic = false;
            let isUnderline = false;
            
            // Check element type
            switch (el.tagName.toLowerCase()) {
              case 'h1':
                type = 'heading-one';
                break;
              case 'h2':
              case 'h3':
                type = 'heading-two';
                break;
              case 'blockquote':
                type = 'block-quote';
                break;
              case 'li':
                // Skip list items, they'll be handled with their parent list
                return;
              case 'ul':
                // Create a bulleted list with items
                const ulItems = Array.from(el.querySelectorAll('li')).map(li => ({
                  type: 'list-item' as const,
                  children: [{ text: li.textContent || '' }] as FormattedText[]
                }));
                
                if (ulItems.length > 0) {
                  nodes.push({
                    type: 'bulleted-list',
                    children: ulItems as any
                  });
                }
                return;
              case 'ol':
                // Create a numbered list with items
                const olItems = Array.from(el.querySelectorAll('li')).map(li => ({
                  type: 'list-item' as const,
                  children: [{ text: li.textContent || '' }] as FormattedText[]
                }));
                
                if (olItems.length > 0) {
                  nodes.push({
                    type: 'numbered-list',
                    children: olItems as any
                  });
                }
                return;
              default:
                type = 'paragraph';
            }
            
            // Check for text formatting
            if (el.querySelector('strong, b')) {
              isBold = true;
            }
            
            if (el.querySelector('em, i')) {
              isItalic = true;
            }
            
            if (el.querySelector('u')) {
              isUnderline = true;
            }
            
            // Check for inline styles if available
            const style = el.getAttribute('style');
            if (style) {
              if (style.includes('font-weight:700') || style.includes('font-weight: 700') || style.includes('font-weight:bold') || style.includes('font-weight: bold')) {
                isBold = true;
              }
              
              if (style.includes('font-style:italic') || style.includes('font-style: italic')) {
                isItalic = true;
              }
              
              if (style.includes('text-decoration:underline') || style.includes('text-decoration: underline')) {
                isUnderline = true;
              }
            }
            
            // Create the node with formatting
            nodes.push({
              type: type as any,
              children: [{ 
                text,
                ...(isBold ? { bold: true } : {}),
                ...(isItalic ? { italic: true } : {}),
                ...(isUnderline ? { underline: true } : {})
              }]
            });
          });
          
          // Filter out any empty nodes
          const validNodes = nodes.filter(node => 
            node.children.length > 0 && 
            node.children.some(child => child.text && child.text.trim().length > 0)
          );
          
          if (validNodes.length > 0) {
            console.log('Inserting HTML nodes:', validNodes);
            Transforms.insertNodes(editor, validNodes);
            return;
          }
        }
      } catch (error) {
        console.error('Error parsing HTML:', error);
      }
    }
    
    // Try to get PDF content or fall back to plain text
    const text = data.getData('text/plain');
    
    if (text) {
      console.log('Processing plain text/PDF content:', text);
      
      // Split text by double newlines to identify paragraphs
      const paragraphs = text.split(/\n\s*\n/);
      console.log('Paragraphs:', paragraphs);
      
      if (paragraphs.length > 0) {
        // Process each paragraph
        const nodes: CustomElement[] = [];
        
        // Track if we're in a list section
        let inBulletedList = false;
        let currentBulletedList: any[] = [];
        let inNumberedList = false;
        let currentNumberedList: any[] = [];
        
        for (const paragraph of paragraphs) {
          // Skip empty paragraphs
          if (paragraph.trim() === '') {
            // If we were in a list, add it to nodes and reset
            if (inBulletedList && currentBulletedList.length > 0) {
              nodes.push({
                type: 'bulleted-list',
                children: currentBulletedList as any
              });
              inBulletedList = false;
              currentBulletedList = [];
            }
            
            if (inNumberedList && currentNumberedList.length > 0) {
              nodes.push({
                type: 'numbered-list',
                children: currentNumberedList as any
              });
              inNumberedList = false;
              currentNumberedList = [];
            }
            continue;
          }
          
          // Split paragraph into lines
          const lines = paragraph.split(/\r?\n/);
          
          // Enhanced list detection for PDFs
          // Check for various bullet patterns that might come from PDFs
          const bulletPatterns = [
            /^[-•●■◦○◆◇▪▫]\s+/,  // Common bullet characters
            /^\s*[-•●■◦○◆◇▪▫]\s+/, // Bullets with leading whitespace
            /^[\s\t]+[-•●■◦○◆◇▪▫]\s+/, // Bullets with tab indentation
            /^[\s\t]+/, // Just indentation (might be a list in PDFs)
          ];
          
          const isListItem = (line: string) => {
            return bulletPatterns.some(pattern => pattern.test(line)) || 
                  /^\d+[\.\)]\s+/.test(line); // Number followed by period or parenthesis
          };
          
          // Check if this paragraph looks like a list from a PDF
          if (lines.every(line => isListItem(line))) {
            // Determine if it's a bulleted or numbered list
            if (lines[0].match(/^\d+[\.\)]\s+/)) {
              // Numbered list
              const listItems = lines.map(line => {
                // Extract the text after the number
                const text = line.replace(/^\d+[\.\)]\s+/, '');
                return {
                  type: 'list-item' as const,
                  children: [{ text }] as FormattedText[]
                };
              });
              
              nodes.push({
                type: 'numbered-list',
                children: listItems as any
              });
            } else {
              // Bulleted list - extract text after the bullet
              const listItems = lines.map(line => {
                // Remove the bullet and any leading whitespace
                const text = line.replace(/^[\s\t]*[-•●■◦○◆◇▪▫]\s+/, '');
                return {
                  type: 'list-item' as const,
                  children: [{ text }] as FormattedText[]
                };
              });
              
              nodes.push({
                type: 'bulleted-list',
                children: listItems as any
              });
            }
          } else {
            // Regular paragraph - preserve line breaks within paragraphs
            let content = '';
            for (let i = 0; i < lines.length; i++) {
              content += lines[i];
              // Add a line break between lines, but not after the last line
              if (i < lines.length - 1) {
                content += '\n';
              }
            }
            
            // Enhanced heading detection for PDFs
            // Check for headings based on length, capitalization, and formatting
            const isShortLine = content.length < 100;
            const isAllCaps = content === content.toUpperCase() && content.length > 3;
            const endsWithColon = content.trim().endsWith(':');
            const startsWithNumber = /^\d+\.\s+[A-Z]/.test(content); // Numbered section
            
            if (content.startsWith('# ') || (isShortLine && isAllCaps)) {
              // Heading 1 - either markdown style or ALL CAPS short line
              const headingText = content.startsWith('# ') ? content.substring(2) : content;
              nodes.push({
                type: 'heading-one',
                children: [{ text: headingText }]
              });
            } else if (content.startsWith('## ') || (isShortLine && endsWithColon) || startsWithNumber) {
              // Heading 2 - markdown style, short line ending with colon, or numbered section
              let headingText = content;
              if (content.startsWith('## ')) {
                headingText = content.substring(3);
              }
              nodes.push({
                type: 'heading-two',
                children: [{ text: headingText }]
              });
            } else if (content.startsWith('> ') || content.startsWith('\t')) {
              // Block quote - markdown style or indented (common in PDFs)
              const quoteText = content.startsWith('> ') ? content.substring(2) : content.substring(1);
              nodes.push({
                type: 'block-quote',
                children: [{ text: quoteText }]
              });
            } else {
              // Regular paragraph
              nodes.push({
                type: 'paragraph',
                children: [{ text: content }]
              });
            }
          }
        }
        
        if (nodes.length > 0) {
          Transforms.insertNodes(editor, nodes);
          return;
        }
      } else {
        // If no paragraphs, just insert as a single paragraph
        const paragraph: ParagraphElement = {
          type: 'paragraph',
          children: [{ text }]
        };
        
        Transforms.insertNodes(editor, paragraph);
        return;
      }
    }
    
    // Fall back to the original insertData as a last resort
    console.log('Falling back to default paste handler');
    insertData(data);
  };

  return editor;
};

const SlateEditor: React.FC<SlateEditorProps> = ({ value, onChange, placeholder }) => {
  // Create a Slate editor object that won't change across renders
  const editor = useMemo(() => withHtml(withHistory(withReact(createEditor()))), []);
  
  // Use internal state to track content
  const [editorValue, setEditorValue] = useState<Descendant[]>(value);
  
  // Handle content changes
  const handleChange = (newValue: Descendant[]) => {
    setEditorValue(newValue);
    onChange(newValue);
  };
  
  // Define a rendering function for elements
  const renderElement = useCallback((props: RenderElementProps) => <Element {...props} />, []);
  
  // Define a rendering function for leaves
  const renderLeaf = useCallback((props: RenderLeafProps) => <Leaf {...props} />, []);
  
  return (
    <div className="slate-editor">

      <Slate editor={editor} initialValue={editorValue} onChange={handleChange}>
        <SlateEditorToolbar />
        <div className="border border-primary-200 rounded-md p-3 min-h-[200px] bg-primary-50">
          <Editable
            renderElement={renderElement}
            renderLeaf={renderLeaf}
            placeholder={placeholder || "Enter your text here..."}
            className="min-h-[180px] focus:outline-none dark:text-white"
            onKeyDown={event => {
              // Handle keyboard shortcuts
              // Only handle keyboard shortcuts with Ctrl/Cmd key
              if (!event.ctrlKey && !event.metaKey) {
                return;
              }

              // Handle keyboard shortcuts for formatting
              switch (event.key) {
                case 'b': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleBold(editor);
                  break;
                }
                case 'i': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleItalic(editor);
                  break;
                }
                case 'u': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleUnderline(editor);
                  break;
                }
                case '1': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleBlock(editor, 'heading-one');
                  break;
                }
                case '2': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleBlock(editor, 'heading-two');
                  break;
                }
                case '.': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleBlock(editor, 'bulleted-list');
                  break;
                }
                case ',': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleBlock(editor, 'numbered-list');
                  break;
                }
                case '`': {
                  event.preventDefault();
                  event.stopPropagation(); // Stop event propagation to prevent form submission
                  CustomEditor.toggleBlock(editor, 'block-quote');
                  break;
                }
              }
            }}
          />
        </div>
      </Slate>
    </div>
  );
};

export default SlateEditor;
