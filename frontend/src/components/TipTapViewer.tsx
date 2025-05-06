import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Table from '@tiptap/extension-table';
import TableRow from '@tiptap/extension-table-row';
import TableCell from '@tiptap/extension-table-cell';
import TableHeader from '@tiptap/extension-table-header';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';


interface TipTapViewerProps {
  content: string;
  title?: string;
}

const TipTapViewer: React.FC<TipTapViewerProps> = ({ content, title }) => {
  // Initialize the editor in read-only mode
  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({
        resizable: false,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: true,
      }),
      Image.configure({
        inline: false,
      }),
    ],
    content,
    editable: false,
  });

  // Handle empty content
  if (!content || content.trim() === '') {
    return <p className="text-gray-500 dark:text-gray-400">No content</p>;
  }

  return (
    <div className="tiptap-viewer">
      {title && (
        <div className="tiptap-viewer-title">
          <h1>{title}</h1>
        </div>
      )}
      <div className="tiptap-viewer-content">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default TipTapViewer;
