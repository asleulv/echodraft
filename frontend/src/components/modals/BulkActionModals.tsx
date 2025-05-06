import React, { useState, useEffect } from 'react';
import { documentsAPI, categoriesAPI } from '@/utils/api';
import type { Category } from '@/types/api';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  documentIds: number[];
}

export const BulkCategoryModal: React.FC<ModalProps & { categories: Category[] }> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  documentIds,
  categories 
}) => {
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call the bulk update API
      await documentsAPI.bulkUpdateCategory(documentIds, selectedCategory);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update categories:', err);
      setError(err.response?.data?.detail || 'Failed to update categories');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary-100 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Change Category</h2>
        
        {error && (
          <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Category
            </label>
            <div className="relative">
              {/* Hidden select for form submission */}
              <select
                className="sr-only"
                value={selectedCategory === null ? '' : selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value ? Number(e.target.value) : null)}
                required
                aria-hidden="true"
              >
                <option value="">Uncategorized</option>
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
                  className="form-input w-full text-left flex items-center"
                  onClick={() => document.getElementById('bulk-category-dropdown')?.classList.toggle('hidden')}
                >
                  {selectedCategory === null ? (
                    <>
                      <span 
                        className="inline-block w-3 h-3 rounded-full mr-2"
                        style={{ backgroundColor: '#9CA3AF' }}
                      />
                      Uncategorized
                    </>
                  ) : (
                    <>
                      {(() => {
                        const category = categories.find(c => c.id === selectedCategory);
                        if (category) {
                          return (
                            <>
                              {category.color && (
                                <span 
                                  className="inline-block w-3 h-3 rounded-full mr-2"
                                  style={{ backgroundColor: category.color }}
                                />
                              )}
                              {category.name}
                            </>
                          );
                        }
                        return 'Select Category';
                      })()}
                    </>
                  )}
                  
                  <svg className="ml-auto h-4 w-4 fill-current text-gray-700 dark:text-gray-300" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
                  </svg>
                </button>
                
                {/* Dropdown menu */}
                <div 
                  id="bulk-category-dropdown" 
                  className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg hidden"
                >
                  <ul className="py-1 max-h-60 overflow-auto">
                    <li>
                      <button
                        type="button"
                        className="w-full px-4 py-2 text-left hover:bg-primary-100 dark:hover:bg-gray-700 flex items-center"
                        onClick={() => {
                          setSelectedCategory(null);
                          document.getElementById('bulk-category-dropdown')?.classList.add('hidden');
                        }}
                      >
                        <span 
                          className="inline-block w-3 h-3 rounded-full mr-2"
                          style={{ backgroundColor: '#9CA3AF' }}
                        />
                        Uncategorized
                      </button>
                    </li>
                    {categories.map(category => (
                      <li key={category.id}>
                        <button
                          type="button"
                          className="w-full px-4 py-2 text-left hover:bg-primary-100 dark:hover:bg-gray-700 flex items-center"
                          onClick={() => {
                            setSelectedCategory(category.id);
                            document.getElementById('bulk-category-dropdown')?.classList.add('hidden');
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
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BulkTagModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  documentIds 
}) => {
  const [tagInput, setTagInput] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setTagInput(value);
    
    // If the input ends with a comma, add the tag to the selected tags
    if (value.endsWith(',')) {
      const newTag = value.slice(0, -1).trim();
      if (newTag && !selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
        setTagInput('');
      } else {
        setTagInput('');
      }
    }
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Add tag on Enter key
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      const newTag = tagInput.trim();
      if (!selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
        setTagInput('');
      }
    }
    
    // Remove the last tag on Backspace if input is empty
    if (e.key === 'Backspace' && !tagInput && selectedTags.length > 0) {
      const newTags = [...selectedTags];
      newTags.pop();
      setSelectedTags(newTags);
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter(tag => tag !== tagToRemove));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Add the current input as a tag if it's not empty
    if (tagInput.trim()) {
      const newTag = tagInput.trim();
      if (!selectedTags.includes(newTag)) {
        setSelectedTags([...selectedTags, newTag]);
      }
      setTagInput('');
    }
    
    // Don't proceed if no tags are selected
    if (selectedTags.length === 0) {
      setError('Please add at least one tag');
      return;
    }
    
    setIsLoading(true);
    setError('');

    try {
      // Call the bulk update API
      await documentsAPI.bulkAddTags(documentIds, selectedTags);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to add tags:', err);
      setError(err.response?.data?.detail || 'Failed to add tags');
    } finally {
      setIsLoading(false);
    }
  };

  // Reset state when modal is opened
  useEffect(() => {
    if (isOpen) {
      setTagInput('');
      setSelectedTags([]);
      setError('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary-100 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Add Tags</h2>
        
        {error && (
          <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Tags
            </label>
            
            <div className="form-input w-full flex flex-wrap items-center gap-2 min-h-[38px] p-2">
              {/* Selected tags */}
              {selectedTags.map((tag, index) => (
                <span 
                  key={index} 
                  className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900 dark:text-primary-300"
                >
                  {tag}
                  <button
                    type="button"
                    className="ml-1.5 h-4 w-4 rounded-full inline-flex items-center justify-center text-primary-400 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-100 focus:outline-none"
                    onClick={() => removeTag(tag)}
                  >
                    <span className="sr-only">Remove tag</span>
                    <svg className="h-2 w-2" stroke="currentColor" fill="none" viewBox="0 0 8 8">
                      <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                    </svg>
                  </button>
                </span>
              ))}
              
              {/* Tag input */}
              <input
                type="text"
                className="flex-grow outline-none bg-transparent"
                value={tagInput}
                onChange={handleTagInputChange}
                onKeyDown={handleTagInputKeyDown}
                placeholder={selectedTags.length > 0 ? "Add more tags..." : "Type and press comma or Enter to add tags"}
              />
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Press comma or Enter to add a tag, Backspace to remove the last tag
            </p>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading || (selectedTags.length === 0 && !tagInput.trim())}
            >
              {isLoading ? 'Adding...' : 'Add Tags'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BulkStatusModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  documentIds 
}) => {
  const [selectedStatus, setSelectedStatus] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Call the bulk update API
      await documentsAPI.bulkUpdateStatus(documentIds, selectedStatus);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to update status:', err);
      setError(err.response?.data?.detail || 'Failed to update status');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary-100 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Change Status</h2>
        
        {error && (
          <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Status
            </label>
            <select
              className="form-input w-full"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              required
            >
              <option value="" disabled>Select a status</option>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="archived">Archived</option>
            </select>
          </div>
          
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export const BulkDeleteModal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  documentIds 
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDelete = async () => {
    setIsLoading(true);
    setError('');

    try {
      // Call the bulk delete API (now performs soft delete)
      await documentsAPI.bulkDelete(documentIds);
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to move documents to trash:', err);
      setError(err.response?.data?.detail || 'Failed to move documents to trash');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-primary-100 rounded-lg shadow-xl max-w-md w-full p-6">
        <h2 className="text-xl font-semibold mb-4">Move to Trash</h2>
        
        {error && (
          <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        <p className="text-gray-700 dark:text-gray-300 mb-6">
          Are you sure you want to move {documentIds.length} document{documentIds.length !== 1 ? 's' : ''} to trash? You can restore them later from the Trash page.
        </p>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn-danger"
            onClick={handleDelete}
            disabled={isLoading}
          >
            {isLoading ? 'Moving to trash...' : 'Move to Trash'}
          </button>
        </div>
      </div>
    </div>
  );
};
