import React, { useEffect, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Bold, Italic, Strikethrough, Heading1, Heading2, Heading3, List, ListOrdered, MessageSquareQuote, Code, Table2, Link2, Image as ImageIcon, Expand, Shrink } from 'lucide-react';

interface TipTapEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  height?: string | number;
  title?: string;
}

const TipTapEditor: React.FC<TipTapEditorProps> = ({
  value,
  onChange,
  placeholder = 'Enter your text here...',
  height = '800px',
  title,
}) => {
  // State for link
  const [linkUrl, setLinkUrl] = useState<string>('');
  const [linkText, setLinkText] = useState<string>('');
  const [showLinkInput, setShowLinkInput] = useState<boolean>(false);

  // State for image
  const [imageUrl, setImageUrl] = useState<string>('');
  const [showImageInput, setShowImageInput] = useState<boolean>(false);
  
  // State for fullscreen mode
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);

// Initialize the editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: true,
        linkOnPaste: true,
      }),
      Image.configure({
        allowBase64: true,
        inline: false,
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    autofocus: false, // Automatically focus the editor when it's mounted
    editable: true, // Ensure the editor is editable
  });
  
  // Handle clicks on the editor content area to ensure focus
  const handleEditorClick = () => {
    if (editor && !editor.isFocused) {
      editor.commands.focus();
    }
  };

  // Function to add a table
  const addTable = () => {
    editor?.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  // Function to add a link
  const addLink = () => {
    if (linkUrl && editor) {
      // Check if text is selected
      if (editor.state.selection.empty) {
        // If no text is selected, use the link text or URL as the link text
        const displayText = linkText || linkUrl;
        editor.chain().focus().insertContent(`<a href="${linkUrl}" target="_blank">${displayText}</a>`).run();
      } else {
        // If text is selected, convert it to a link
        editor.chain().focus().setLink({ href: linkUrl }).run();
      }
      setLinkUrl('');
      setLinkText('');
      setShowLinkInput(false);
    }
  };

  // Function to add an image
  const addImage = () => {
    if (imageUrl && editor) {
      editor.chain().focus().setImage({ src: imageUrl }).run();
      setImageUrl('');
      setShowImageInput(false);
    }
  };

  // Function to remove a link
  const removeLink = () => {
    if (editor) {
      editor.chain().focus().unsetLink().run();
    }
  };

  // Table control functions
  const addColumnBefore = () => {
    editor?.chain().focus().addColumnBefore().run();
  };

  const addColumnAfter = () => {
    editor?.chain().focus().addColumnAfter().run();
  };

  const deleteColumn = () => {
    editor?.chain().focus().deleteColumn().run();
  };

  const addRowBefore = () => {
    editor?.chain().focus().addRowBefore().run();
  };

  const addRowAfter = () => {
    editor?.chain().focus().addRowAfter().run();
  };

  const deleteRow = () => {
    editor?.chain().focus().deleteRow().run();
  };

  const deleteTable = () => {
    editor?.chain().focus().deleteTable().run();
  };

  // Check if cursor is in a table
  const isInTable = editor?.isActive('table');

  // Update content when value changes externally
  useEffect(() => {
    if (editor && value !== editor.getHTML()) {
      editor.commands.setContent(value);
    }
  }, [editor, value]);

  // Convert Markdown to HTML if needed
  useEffect(() => {
    if (editor && value && !value.startsWith('<') && !editor.isActive) {
      // This is a simple check to see if the content might be Markdown
      // In a real implementation, you'd want to use a proper Markdown parser
      const simpleMarkdownToHtml = (markdown: string) => {
        return markdown
          .replace(/^# (.*$)/gm, '<h1>$1</h1>')
          .replace(/^## (.*$)/gm, '<h2>$1</h2>')
          .replace(/^### (.*$)/gm, '<h3>$1</h3>')
          .replace(/\*\*(.*)\*\*/gm, '<strong>$1</strong>')
          .replace(/\*(.*)\*/gm, '<em>$1</em>')
          .replace(/~~(.*)~~/gm, '<s>$1</s>')
          .replace(/`([^`]+)`/gm, '<code>$1</code>')
          .replace(/```([^`]+)```/gm, '<pre><code>$1</code></pre>')
          .replace(/^\> (.*$)/gm, '<blockquote>$1</blockquote>')
          .replace(/^\- (.*$)/gm, '<ul><li>$1</li></ul>')
          .replace(/^\d\. (.*$)/gm, '<ol><li>$1</li></ol>')
          .replace(/\n/gm, '<br />');
      };

      try {
        const html = simpleMarkdownToHtml(value);
        editor.commands.setContent(html);
      } catch (error) {
        console.error('Error converting Markdown to HTML:', error);
      }
    }
  }, [editor, value]);

  // Render the editor toolbar and content
  return (
    <div className={`tiptap-editor ${isFullscreen ? 'tiptap-editor-fullscreen' : ''}`} style={{ height: isFullscreen ? '100vh' : height }}>
      <div className="tiptap-editor-toolbar">
        <button
          onClick={() => editor?.chain().focus().toggleBold().run()}
          className={editor?.isActive('bold') ? 'is-active' : ''}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleItalic().run()}
          className={editor?.isActive('italic') ? 'is-active' : ''}
        >
          <Italic className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleStrike().run()}
          className={editor?.isActive('strike') ? 'is-active' : ''}
        >
          <Strikethrough className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
          className={editor?.isActive('heading', { level: 1 }) ? 'is-active' : ''}
        >
          <Heading1 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
          className={editor?.isActive('heading', { level: 2 }) ? 'is-active' : ''}
        >
          <Heading2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
          className={editor?.isActive('heading', { level: 3 }) ? 'is-active' : ''}
        >
          <Heading3 className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
          className={editor?.isActive('bulletList') ? 'is-active' : ''}
        >
          <List className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
          className={editor?.isActive('orderedList') ? 'is-active' : ''}
        >
          <ListOrdered className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleBlockquote().run()}
          className={editor?.isActive('blockquote') ? 'is-active' : ''}
        >
          <MessageSquareQuote className="w-4 h-4" />
        </button>
        <button
          onClick={() => editor?.chain().focus().toggleCodeBlock().run()}
          className={editor?.isActive('codeBlock') ? 'is-active' : ''}
        >
          <Code className="w-4 h-4" />
        </button>
        <button
          onClick={addTable}
          className={editor?.isActive('table') ? 'is-active' : ''}
        >
          <Table2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowLinkInput(!showLinkInput)}
          className={editor?.isActive('link') ? 'is-active' : ''}
        >
          <Link2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => setShowImageInput(!showImageInput)}
          className={editor?.isActive('image') ? 'is-active' : ''}
        >
          <ImageIcon className="w-4 h-4" />
        </button>
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className={`fullscreen-btn ${isFullscreen ? 'is-active' : ''} hidden md:block`}
        >
          {isFullscreen ? <Shrink className="w-4 h-4"/> : <Expand className="w-4 h-4"/>}
        </button>
        
        {showLinkInput && (
          <div className="tiptap-editor-link-input">
            <div className="tiptap-editor-link-input-fields">
              <input
                type="text"
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="Enter URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
              <input
                type="text"
                value={linkText}
                onChange={(e) => setLinkText(e.target.value)}
                placeholder="Link Text (optional)"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addLink();
                  }
                }}
              />
            </div>
            <div className="tiptap-editor-link-input-buttons">
              <button onClick={addLink}>Add</button>
              <button onClick={() => setShowLinkInput(false)}>Cancel</button>
              {editor?.isActive('link') && (
                <button onClick={removeLink}>Remove Link</button>
              )}
            </div>
          </div>
        )}
        
        {showImageInput && (
          <div className="tiptap-editor-image-input">
            <div className="tiptap-editor-image-input-fields">
              <input
                type="text"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Enter Image URL"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    addImage();
                  }
                }}
              />
            </div>
            <div className="tiptap-editor-image-input-buttons">
              <button onClick={addImage}>Add</button>
              <button onClick={() => setShowImageInput(false)}>Cancel</button>
            </div>
          </div>
        )}
      </div>
      {isInTable && (
        <div className="tiptap-editor-table-controls-container">
        <div className="tiptap-editor-table-controls">
        <div className="tiptap-editor-table-controls-group">
          <span className="tiptap-editor-table-controls-label">Columns:</span>
          <button onClick={addColumnBefore}>+ Before</button>
          <button onClick={addColumnAfter}>+ After</button>
          <button onClick={deleteColumn}>Delete</button>
        </div>
        <div className="tiptap-editor-table-controls-group">
          <span className="tiptap-editor-table-controls-label">Rows:</span>
          <button onClick={addRowBefore}>+ Before</button>
          <button onClick={addRowAfter}>+ After</button>
          <button onClick={deleteRow}>Delete</button>
        </div>
        <div className="tiptap-editor-table-controls-group">
          <button onClick={deleteTable}>Delete Table</button>
        </div>
        </div>
      </div>

      )}
      <div 
        className="tiptap-editor-content" 
        style={{ 
          height: isFullscreen 
            ? 'calc(100vh - 150px)' // Adjust based on toolbar and footer height
            : (typeof height === 'number' ? `${height}px` : height) 
        }}
        onClick={handleEditorClick} // Add click handler to focus the editor
      >
        <EditorContent editor={editor} />
      </div>
      <div className="tiptap-editor-footer"></div>
    </div>
  );
};

export default TipTapEditor;
