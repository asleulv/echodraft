import React, { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { categoriesAPI } from '@/utils/api';
import { Category, DocumentCreateData, DocumentDetail, DocumentUpdateData } from '@/types/api';
import TipTapEditor from '@/components/TipTapEditor';
import { X, Check, FolderTree, Plus } from "lucide-react";

// Helper function to determine text color based on background color
const getContrastColor = (hexColor: string): string => {
  // Remove the # if it exists
  const color = hexColor.startsWith('#') ? hexColor.slice(1) : hexColor;
  
  // Convert to RGB
  const r = parseInt(color.substr(0, 2), 16);
  const g = parseInt(color.substr(2, 2), 16);
  const b = parseInt(color.substr(4, 2), 16);
  
  // Calculate luminance - using the formula for relative luminance in the sRGB color space
  // See: https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  
  // Return black for light colors and white for dark colors
  return luminance > 0.5 ? '#000000' : '#FFFFFF';
};

interface DocumentFormProps {
  onSubmit: (data: DocumentCreateData | DocumentUpdateData) => Promise<void>;
  isSubmitting: boolean;
  error?: string;
  initialData?: DocumentDetail;
}

const DocumentForm: React.FC<DocumentFormProps> = ({ onSubmit, isSubmitting, error, initialData }) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const router = useRouter();
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  
  // Use string for Markdown content instead of Slate.js JSON
  const [editorContent, setEditorContent] = useState<string>(
    typeof initialData?.content === 'string' 
      ? initialData.content 
      : initialData?.content ? JSON.stringify(initialData.content) : ''
  );

  // State for the title input
  const [title, setTitle] = useState<string>(initialData?.title || '');

  // Initialize content for new documents
  useEffect(() => {
    if (!initialData && editorContent === '') {
      // For new documents, set up an empty editor with just a paragraph
      setEditorContent('<p></p>');
    }
  }, [initialData, editorContent]);
  
  const [tags, setTags] = useState<string[]>(initialData?.tags || []);
  const [tagInput, setTagInput] = useState('');
  const [createNewVersion, setCreateNewVersion] = useState(false);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | undefined>(
    initialData?.category ? initialData.category.toString() : undefined
  );
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const categoryDropdownRef = useRef<HTMLDivElement>(null);
  const dropdownButtonRef = useRef<HTMLButtonElement>(null);
  
  // Log the initial category for debugging
  useEffect(() => {
    if (initialData?.category) {
      console.log('Initial category:', initialData.category);
    }
  }, [initialData]);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<DocumentCreateData>({
    defaultValues: {
      title: initialData?.title || '',
      status: initialData?.status || 'draft',
      category: initialData?.category || undefined,
    }
  });
  
  // Ensure the category select shows the correct value when categories are loaded
  useEffect(() => {
    if (!isLoadingCategories && initialData?.category) {
      setValue('category', initialData.category);
    }
  }, [isLoadingCategories, initialData, setValue]);
  
  // Add click outside handler for category dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const dropdown = document.getElementById('category-dropdown');
      const dropdownButton = document.querySelector('button[aria-controls="category-dropdown"]');
      
      if (dropdown && 
          !dropdown.contains(event.target as Node) && 
          dropdownButton !== event.target && 
          !dropdownButton?.contains(event.target as Node)) {
        dropdown.classList.add('hidden');
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        console.error('Failed to fetch categories:', err);
        // Don't show an error to the user, just log it and continue
        // This allows the form to work even if categories are not available
      } finally {
        setIsLoadingCategories(false);
      }
    };
    
    fetchCategories();
  }, []);
  
  // Handle tag input
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };
  
  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };
  
  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput('');
    }
  };
  
  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };
  
  // Handle form submission
  const handleFormSubmit = async (data: Omit<DocumentCreateData, 'content' | 'tags' | 'organization'>, event?: React.BaseSyntheticEvent) => {
    // Ensure this is a deliberate form submission, not an accidental one from editor interactions
    if (event && event.target && event.target.tagName !== 'FORM' && 
        !event.target.closest('button[type="submit"]')) {
      console.log('Preventing accidental form submission from editor interaction');
      return;
    }
    
    if (!user) return;
    
    // Validate content - check if it's empty
    const isEmpty = !editorContent || editorContent.trim() === '';
    
    if (isEmpty) {
      return; // Don't submit if content is empty
    }
    
    if (initialData) {
      // Update existing document
      const documentData: DocumentUpdateData = {
        ...data,
        content: editorContent,
        tags,
      };
      
      console.log('Updating document:', documentData);
      await onSubmit(documentData);
    } else {
      // Create new document
      const documentData: DocumentCreateData = {
        ...data,
        content: editorContent,
        tags,
        organization: user.organization,
      };
      
      console.log('Creating document:', documentData);
      await onSubmit(documentData);
    }
  };
  
  // Extract title from the content - first try H1, then first paragraph, limiting to 5 words
  const extractTitleFromContent = (content: string): string => {
    // First try to match H1 tag with or without class attribute (keeping existing functionality)
    const h1Match = content.match(/<h1(?:\s+class="[^"]*")?>([^<]*)<\/h1>/);
    if (h1Match && h1Match[1]) {
      const words = h1Match[1].trim().split(/\s+/).slice(0, 5);
      return words.join(' ');
    }
    
    // If no H1, try to find the first paragraph or any text content
    const textMatch = content.match(/<(?:p|h[1-6])(?:\s+[^>]*)?>(.*?)<\/(?:p|h[1-6])>/);
    if (textMatch && textMatch[1]) {
      // Get the first 5 words or fewer
      const words = textMatch[1].trim().split(/\s+/).slice(0, 5);
      return words.join(' ');
    }
    
    return 'Untitled Document';
  };

  // Custom submit handler that will only be called when the submit button is clicked
  const onFormSubmit = () => {
    const categoryElement = document.getElementById('category') as HTMLSelectElement;
    const categoryValue = categoryElement ? categoryElement.value : '';
    
    // If title is empty, extract it from content
    let documentTitle = title;
    if (!documentTitle || documentTitle.trim() === '') {
      documentTitle = extractTitleFromContent(editorContent);
    }
    
    // Use the title from the input field or extracted from content
    const formData = {
      title: documentTitle,
      status: document.getElementById('status') as HTMLSelectElement ? (document.getElementById('status') as HTMLSelectElement).value : 'draft',
      // Only change category if a value is selected, otherwise keep the original category
      category: categoryValue !== '' ? categoryValue : initialData?.category,
      // Include create_new_version field if this is an update
      ...(initialData && { create_new_version: createNewVersion }),
    };
    
    console.log('Form data:', formData);
    handleFormSubmit(formData as any);
  };
  
  return (
    <div className="space-y-6">
      {error && (
        <div className={`px-4 py-3 rounded ${
          error.includes('successfully') 
            ? 'bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400'
            : 'bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400'
        }`}>
          {error}
        </div>
      )}
      
      <div>
        <label htmlFor="title" className="form-label">
          Title
        </label>
        <input
          id="title"
          type="text"
          className="form-input"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter document title (optional)"
        />
        <p className="text-xs text-primary-500 mt-1">
          If left empty, title will be generated from content
        </p>
      </div>
      
      <div>
        <label htmlFor="content" className="form-label">
          Content <span className="text-danger-600 dark:text-danger-400">*</span>
        </label>
        <TipTapEditor
          value={editorContent}
          onChange={setEditorContent}
          placeholder="Write your document content here..."
          height="400px"
        />
        {(!editorContent || editorContent.trim() === '') && (
          <p className="form-error">Content is required</p>
        )}
      </div>
      
      <div>
        <label htmlFor="category" className="form-label">
          Category
        </label>
        <div className="flex items-center space-x-2">
          <div className="relative w-full">
            {/* Hidden select for form submission */}
            <select
              id="category"
              className="sr-only"
              {...register('category')}
              disabled={isLoadingCategories}
              defaultValue={initialData?.category?.toString() || ''}
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
            >
              <option value="">-- Select Category --</option>
              {categories.map(category => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            
            {/* Custom dropdown UI */}
            <div className="relative">
              <button
                type="button"
                className="form-input flex-grow w-full text-left flex items-center border-color-gray-300 dark:border-color-gray-700"
                onClick={() => document.getElementById('category-dropdown')?.classList.toggle('hidden')}
                disabled={isLoadingCategories}
                ref={dropdownButtonRef}
                aria-controls="category-dropdown"
              >
                {isLoadingCategories ? (
                  <span>Loading categories...</span>
                ) : selectedCategoryId ? (
                  <>
                    {(() => {
                      const selectedCategory = categories.find(c => c.id.toString() === selectedCategoryId);
                      if (selectedCategory) {
                        return (
                          <>
                            {selectedCategory.color && (
                              <span 
                                className="inline-block w-3 h-3 rounded-full mr-2"
                                style={{ backgroundColor: selectedCategory.color }}
                              />
                            )}
                            {selectedCategory.name}
                          </>
                        );
                      }
                      return '-- Select Category --';
                    })()}
                  </>
                ) : (
                  <span>-- Select Category --</span>
                )}
                
                <svg className="ml-auto h-4 w-4 fill-current text-gray-700 dark:text-primary-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                  <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                </svg>
              </button>
              
              {/* Dropdown menu */}
              <div 
                id="category-dropdown" 
                className="absolute z-10 w-full mt-1 border border-gray-300 dark:border-primary-300 rounded-md shadow-lg hidden"
                ref={categoryDropdownRef}
              >
                <ul className="py-1 max-h-60 overflow-auto">
                  <li>
                    <button
                      type="button"
                      className="w-full px-4 py-2 bg-primary-200 text-left hover:bg-primary-100 dark:hover:bg-primary-700"
                      onClick={() => {
                        setSelectedCategoryId('');
                        setValue('category', undefined);
                        document.getElementById('category-dropdown')?.classList.add('hidden');
                      }}
                    >
                      -- Select Category --
                    </button>
                  </li>
                  {categories.map(category => (
                    <li key={category.id}>
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left bg-primary-100 hover:bg-primary-100 dark:hover:bg-primary-700 flex items-center"
                        onClick={() => {
                          setSelectedCategoryId(category.id.toString());
                          setValue('category', Number(category.id));
                          document.getElementById('category-dropdown')?.classList.add('hidden');
                        }}
                      >
                        {category.color && (
                          <span 
                            className="inline-block w-3 h-3 rounded-full mr-2"
                            style={{ backgroundColor: category.color }}
                          />
                        )}
                        {category.name}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <button
            type="button"
            className="btn-primary"
            onClick={() => setShowConfirmDialog(true)}
            title="Manage Categories"
          >
            <FolderTree className="h-5 w-5" />
          </button>
        </div>
        {categories.length === 0 && !isLoadingCategories && (
          <div className="mt-1">
            <p className="text-sm text-primary-500 dark:text-primary-400">
              No categories found. <a href="/categories" target="_blank" className="text-primary-600 dark:text-primary-400 hover:underline">Create a category</a>
            </p>
            <p className="text-xs text-primary-500 dark:text-primary-400 mt-1">
              Note: You can still create documents without selecting a category.
            </p>
          </div>
        )}
      </div>
      
      <div>
        <label htmlFor="tags" className="form-label">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map(tag => (
            <span
              key={tag}
              className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/70 dark:text-primary-400"
            >
              {tag}
              <button
                type="button"
                className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary-400 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-100"
                onClick={() => removeTag(tag)}
              >
                <span className="sr-only">Remove tag</span>
                <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                  <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                </svg>
              </button>
            </span>
          ))}
        </div>
        <div className="flex">
          <input
            id="tags"
            type="text"
            className="form-input"
            value={tagInput}
            onChange={handleTagInputChange}
            onKeyDown={handleTagInputKeyDown}
            placeholder="Add tags (press Enter or comma to add)"
          />
          <button
            type="button"
            className="ml-2 btn-primary flex items-center"
            onClick={addTag}
          >
            <Plus className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div>
        <label htmlFor="status" className="form-label">
          Status
        </label>
        <select
          id="status"
          className="form-input"
          {...register('status')}
        >
          <option value="draft">Draft</option>
          <option value="published">Published</option>
          <option value="archived">Archived</option>
        </select>
      </div>
      
      {/* Only show version checkbox when editing an existing document */}
      {initialData && (
        <div className="flex items-center">
          <input
            id="create_new_version"
            type="checkbox"
            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-primary-300 rounded"
            checked={createNewVersion}
            onChange={(e) => setCreateNewVersion(e.target.checked)}
          />
          <label htmlFor="create_new_version" className="ml-2 block text-sm text-primary-700 dark:text-primary-300">
            Create new version (v{initialData.version + 1})
          </label>
          <div className="ml-2 text-xs text-primary-500 dark:text-primary-400">
            Current: v{initialData.version}
          </div>
        </div>
      )}
      
      <div className="flex flex-col space-y-4">
        {isSubmitting && (
          <div className="bg-primary-50 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 text-primary-700 dark:text-primary-400 px-4 py-3 rounded">
            <div className="flex items-center">
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-primary-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Saving your document...</span>
            </div>
          </div>
        )}
        
        <div className="fixed bottom-2 left-1/2 -translate-x-1/2 flex space-x-2 bg-black/10 dark:bg-white/10 backdrop-blur-md shadow-lg rounded-full px-2 py-1 md:bottom-4 md:space-x-3 md:px-3 md:py-2">
          {/* Cancel Button */}
          <button
            type="button"
            className="w-12 h-12 rounded-full p-3 flex items-center justify-center bg-danger-400 hover:bg-danger-400 text-white dark:text-black disabled:opacity-50"
            onClick={() => router.back()}
            disabled={isSubmitting}
            title="Cancel"
            aria-label="Cancel editing"
          >
            <X size={20} />
          </button>

          {/* Save/Update Button */}
          <button
            type="button"
            className="w-12 h-12 rounded-full p-3 flex items-center justify-center bg-primary-600 hover:bg-primary-500 text-white dark:text-black disabled:opacity-50"
            onClick={onFormSubmit}
            disabled={isSubmitting}
            title={isSubmitting ? "Saving..." : initialData ? "Update Document" : "Save Document"}
            aria-label={isSubmitting ? "Saving..." : initialData ? "Update Document" : "Save Document"}
          >
            <Check size={20} />
          </button>
        </div>

      </div>

      {/* Confirmation Dialog for Manage Categories */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-primary-100 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-primary-200 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-950 sm:mx-0 sm:h-10 sm:w-10">
                    <FolderTree className="h-6 w-6 text-primary-200" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary-800">
                      Navigate to Categories
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-primary-600">
                        You are about to leave this page to manage categories. Any unsaved changes to your document will be lost.
                      </p>
                      <p className="text-sm text-primary-600 mt-2">
                        Would you like to save your document first?
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-primary-600 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-secondary-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    onFormSubmit();
                    window.open(`/categories?theme=${theme}`, '_blank');
                    setShowConfirmDialog(false);
                  }}
                >
                  Save & Continue
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-500 text-base font-medium text-white hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => {
                    window.open(`/categories?theme=${theme}`, '_blank');
                    setShowConfirmDialog(false);
                  }}
                >
                  Continue Without Saving
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={() => setShowConfirmDialog(false)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentForm;
