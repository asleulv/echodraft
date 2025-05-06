import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { categoriesAPI, documentsAPI } from '@/utils/api';
import type { Category } from '@/types/api';
import Layout from '@/components/Layout';
import { Settings, Trash, CirclePlus, Box, AlertTriangle, Trash2 } from "lucide-react";

// Predefined colors for quick selection
const predefinedColors = [
  '#EF4444', // Red
  '#F97316', // Orange
  '#F59E0B', // Amber
  '#EAB308', // Yellow
  '#84CC16', // Lime
  '#22C55E', // Green
  '#10B981', // Emerald
  '#14B8A6', // Teal
  '#06B6D4', // Cyan
  '#0EA5E9', // Light Blue
  '#3B82F6', // Blue
  '#6366F1', // Indigo
  '#8B5CF6', // Violet
  '#A855F7', // Purple
  '#D946EF', // Fuchsia
  '#EC4899', // Pink
  '#6B7280', // Gray
];

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDescription, setNewCategoryDescription] = useState('');
  const [newCategoryColor, setNewCategoryColor] = useState('#3B82F6'); // Default to a blue color
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDocuments, setDeleteDocuments] = useState(false);
  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const { theme: currentTheme, toggleTheme } = useTheme();
  const router = useRouter();

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Cleanup
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Check if redirected with success message
  useEffect(() => {
    const { success } = router.query;
    if (success) {
      setSuccessMessage(String(success));
      
      // Remove the query parameter
      const { pathname } = router;
      router.replace(pathname, undefined, { shallow: true });
      
      // Clear the success message after 5 seconds
      const timer = setTimeout(() => {
        setSuccessMessage('');
      }, 5000);
      
      return () => clearTimeout(timer);
    }
  }, [router]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);
  
  // Handle theme from query parameter
  useEffect(() => {
    const { theme: themeParam } = router.query;
    if (themeParam && (themeParam === 'dark' || themeParam === 'light')) {
      // Only toggle if the current theme doesn't match the requested theme
      if (currentTheme !== themeParam) {
        toggleTheme();
      }
      
      // Remove the theme parameter from the URL to avoid toggling on page refresh
      const { pathname } = router;
      const query = { ...router.query };
      delete query.theme;
      router.replace({ pathname, query }, undefined, { shallow: true });
    }
  }, [router.query, currentTheme, toggleTheme, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isAuthenticated) return;
      
      try {
        setIsLoading(true);
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.results || []);
      } catch (err: any) {
        console.error('Failed to load categories:', err);
        
        // Handle 500 Internal Server Error specifically
        if (err.response?.status === 500) {
          setError(
            'Server error: The categories feature is currently unavailable due to a backend issue. ' +
            'This might be due to a configuration problem on the server. ' +
            'You can still use other features of the application.'
          );
        } else {
          setError('Failed to load categories. Please try again later.');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategories();
  }, [isAuthenticated, successMessage]);

  // Handle category creation
  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newCategoryName.trim()) {
      setError('Category name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // Create the category data
      const categoryData = {
        name: newCategoryName.trim(),
        description: newCategoryDescription.trim() || null,
        organization: user?.organization,
        color: newCategoryColor,
      };
      
      console.log('Attempting to create category with data:', categoryData);
      
      // Try to create the category
      const response = await categoriesAPI.createCategory(categoryData);
      
      console.log('Category created successfully:', response.data);
      
      // Reset form
      setNewCategoryName('');
      setNewCategoryDescription('');
      setNewCategoryColor('#3B82F6'); // Reset to default color
      
      // Show success message
      setSuccessMessage('Category created successfully!');
      
      // Add the new category to the list without refetching
      const newCategory = response.data;
      setCategories(prevCategories => [...prevCategories, newCategory]);
      
    } catch (err: any) {
      console.error('Failed to create category:', err);
      
      // Handle 500 Internal Server Error specifically
      if (err.response?.status === 500) {
        setError('Server error occurred. This might be due to a backend issue. Please try again later or contact support.');
        console.error('Server error details:', err.response?.data);
      } else if (err.response?.data) {
        // Format API validation errors
        const apiErrors = err.response.data;
        const errorMessages = [];
        
        if (typeof apiErrors === 'object') {
          for (const field in apiErrors) {
            if (Array.isArray(apiErrors[field])) {
              errorMessages.push(`${field}: ${apiErrors[field].join(', ')}`);
            } else if (typeof apiErrors[field] === 'string') {
              errorMessages.push(`${field}: ${apiErrors[field]}`);
            }
          }
        } else if (typeof apiErrors === 'string') {
          errorMessages.push(apiErrors);
        }
        
        if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
        } else {
          setError('Failed to create category. Please try again.');
        }
      } else {
        setError('Failed to create category. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle category deletion
  const handleDeleteCategory = async () => {
    if (!selectedCategory) return;
    
    try {
      setIsDeleting(true);
      
      // If deleteDocuments is checked and there are documents in the category
      // We need to get the documents BEFORE deleting the category
      let documentIds: number[] = [];
      
      if (deleteDocuments && selectedCategory.document_count > 0) {
        try {
          // Get documents in this category - make sure to get all documents
          console.log(`Getting documents for category ${selectedCategory.name} (ID: ${selectedCategory.id})`);
          const response = await documentsAPI.getDocuments({ 
            category: selectedCategory.id,
            limit: 1000, // Set a high limit to get all documents
            include_deleted: false // Make sure we don't include already deleted documents
          });
          
          const documents = response.data.results || [];
          console.log(`Found ${documents.length} documents in category ${selectedCategory.name}`);
          
          if (documents.length > 0) {
            // Get document IDs
            documentIds = documents.map((doc: any) => doc.id);
            console.log(`Documents to move to trash: ${documentIds.join(', ')}`);
          }
        } catch (docErr) {
          console.error('Failed to get category documents:', docErr);
        }
      }
      
      // Delete the category
      await categoriesAPI.deleteCategory(selectedCategory.slug);
      
      // Now move the documents to trash if we found any
      if (deleteDocuments && documentIds.length > 0) {
        try {
          console.log(`Moving ${documentIds.length} documents to trash`);
          // Move documents to trash
          await documentsAPI.bulkDelete(documentIds);
          console.log(`Successfully moved ${documentIds.length} documents to trash`);
        } catch (docErr) {
          console.error('Failed to move documents to trash:', docErr);
        }
      }
      
      // Show success message
      const successMsg = deleteDocuments && selectedCategory.document_count > 0
        ? 'Category deleted successfully! Documents moved to trash.'
        : 'Category deleted successfully!';
      
      setSuccessMessage(successMsg);
      
      // Close the modal
      setShowDeleteModal(false);
      
      // Refresh categories list
      const response = await categoriesAPI.getCategories();
      setCategories(response.data.results || []);
      
      // Reset selected category and checkbox
      setTimeout(() => {
        setSelectedCategory(null);
        setDeleteDocuments(false);
        setIsDeleting(false);
      }, 300); // Delay to allow animation
    } catch (err: any) {
      console.error('Failed to delete category:', err);
      setError('Failed to delete category. Please try again.');
      setIsDeleting(false);
    }
  };
  
  // Close delete modal
  const closeDeleteModal = () => {
    setShowDeleteModal(false);
    setDeleteDocuments(false);
    setTimeout(() => setSelectedCategory(null), 300); // Delay to allow animation
  };

  // Show loading state
  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Categories">
      {/* Delete Confirmation Modal */}
      {showDeleteModal && selectedCategory && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 transition-opacity" aria-hidden="true">
              <div className="absolute inset-0 bg-gray-500 opacity-75"></div>
            </div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

            <div className="inline-block align-bottom bg-primary-100 rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-primary-200 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                <div className="sm:flex sm:items-start">
                  <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                  </div>
                  <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                    <h3 className="text-lg leading-6 font-medium text-primary-800">
                      Delete Category
                    </h3>
                    <div className="mt-2">
                      <p className="text-sm text-primary-600">
                        Are you sure you want to delete the category "{selectedCategory.name}"?  This action cannot be undone.
                      </p>
                      {selectedCategory.document_count > 0 && (
                        <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-md">
                          <p className="text-sm text-yellow-700 dark:text-yellow-300">
                            <strong>Warning:</strong> This category contains {selectedCategory.document_count} {selectedCategory.document_count === 1 ? 'document' : 'documents'}.
                          </p>
                          <div className="flex items-center mt-2">
                            <input
                              type="checkbox"
                              id="delete-documents"
                              checked={deleteDocuments}
                              onChange={(e) => setDeleteDocuments(e.target.checked)}
                              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                            />
                            <label htmlFor="delete-documents" className="ml-2 text-sm text-yellow-700 dark:text-yellow-300">
                              Delete category documents as well
                            </label>
                          </div>
                          <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-1">
                            {deleteDocuments 
                              ? "Documents will be moved to trash and can be restored later." 
                              : "Documents will remain in your library but will no longer be categorized."}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="bg-primary-100 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
                <button
                  type="button"
                  className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={handleDeleteCategory}
                  disabled={isDeleting}
                >
                  {isDeleting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </>
                  )}
                </button>
                <button
                  type="button"
                  className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm"
                  onClick={closeDeleteModal}
                  disabled={isDeleting}
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {successMessage && (
            <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6">
              {successMessage}
            </div>
          )}
          
          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6">
              <div className="font-medium">{error}</div>
              {error.includes('Server error') && (
                <div className="mt-2 text-sm">
                  <p>The backend server returned an error: <code>AttributeError: can't set attribute</code></p>
                  <p className="mt-1">This is a backend issue that needs to be fixed by a developer.</p>
                  <p className="mt-1">You can still use the document creation feature without categories.</p>
                  <p className="mt-2">
                    <button
                      onClick={() => router.push('/documents/new')}
                      className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 underline"
                    >
                      Go to Document Creation
                    </button>
                  </p>
                </div>
              )}
            </div>
          )}
          
          {!error && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Categories List */}
              <div className="md:col-span-2">
                <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-light text-primary-500 text-center sm:text-left mb-4">All Categories</h2>
                  
                  {categories.length === 0 ? (
                    <p className="text-secondary-500 dark:text-primary-600 text-center py-8">No categories found</p>
                  ) : (
                    <>
                      {/* Mobile view - Cards */}
                      <div className="md:hidden space-y-2">
                        {categories.map((category) => (
                          <div 
                            key={category.id}
                            className="border border-primary-200 dark:border-primary-200 rounded-lg p-3 hover:shadow-md dark:hover:shadow-white/10 transition-shadow bg-white dark:bg-primary-100"
                            style={{ 
                              borderLeftWidth: '4px',
                              borderLeftColor: category.color || '#9CA3AF'
                            }}
                          >
                            <div className="flex items-center justify-between mb-2">
                              <Link 
                                href={`/documents?category=${category.id}`}
                                className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex cursor-pointer hover:opacity-80"
                                style={{ 
                                  backgroundColor: `${category.color}20` || '#9CA3AF20',
                                  color: category.color || '#9CA3AF'
                                }}
                              >
                                
                                {category.name}
                              </Link>
                              <span 
                                className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex-shrink-0 flex items-center"
                                style={{ 
                                  backgroundColor: `${category.color}20` || '#9CA3AF20',
                                  color: category.color || '#9CA3AF'
                                }}
                              >
                                {category.document_count || 0} {(category.document_count || 0) === 1 ? 'doc' : 'docs'}
                              </span>
                            </div>
                            
                            {category.description && (
                              <p className="text-sm text-primary-500 dark:text-primary-400 mb-2">
                                {category.description}
                              </p>
                            )}
                            
                            <div className="flex justify-end mt-2 space-x-2">
                              <button
                                onClick={() => router.push(`/categories/${category.slug}/edit`)}
                                className="p-1 text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                              >
                                <Settings className="w-6 h-6" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedCategory(category);
                                  setShowDeleteModal(true);
                                }}
                                className="p-1 text-danger-600 hover:text-danger-900 dark:text-danger-400 dark:hover:text-danger-300"
                              >
                                <Trash className="w-6 h-6" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                      
                      {/* Desktop view - Table */}
                      <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                        <table className="min-w-full divide-y divide-primary-200">
                          <thead className="bg-primary-100">
                            <tr>
                              <th scope="col" className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500 sm:pl-6">Name</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500 lg:table-cell hidden">Description</th>
                              <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500 xl:table-cell hidden">Documents</th>
                              <th scope="col" className="px-3 py-3.5 text-right text-sm font-semibold text-primary-500">Actions</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-primary-200 bg-primary-50">
                            {categories.map((category) => (
                              <tr key={category.id} className="hover:bg-primary-100">
                                <td className="document-title whitespace-nowrap py-3.5 pl-4 pr-3 text-primary-700 sm:pl-6">
                                  <Link 
                                    href={`/documents?category=${category.id}`}
                                    className="px-2 py-0.5 rounded-md text-sm whitespace-nowrap flex items-center inline-flex cursor-pointer hover:opacity-80"
                                    style={{ 
                                      backgroundColor: `${category.color}20` || '#9CA3AF20',
                                      color: category.color || '#9CA3AF'
                                    }}
                                  >
                                    {category.name}
                                  </Link>
                                </td>
                                <td 
                                  className="whitespace-nowrap px-3 py-3.5 text-sm text-primary-500 lg:table-cell hidden"
                                  title={category.description}
                                >
                                  {category.description?.length > 35 
                                    ? `${category.description.slice(0, 35)}...` 
                                    : category.description || '-'}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2.5 text-sm text-primary-500 xl:table-cell hidden">
                                  {category.document_count || 0}
                                </td>
                                <td className="whitespace-nowrap px-3 py-2text-right text-sm font-medium">
                                  <div className="flex justify-end space-x-2">
                                    <button
                                      onClick={() => router.push(`/categories/${category.slug}/edit`)}
                                      className="w-10 h-10 flex items-center justify-center rounded-full 
                                                bg-primary-400 dark:bg-primary-200 
                                                text-primary-200 dark:text-primary-500 
                                                hover:bg-primary-500 dark:hover:bg-primary-300 
                                                focus:outline-none focus:ring-2 focus:ring-primary-400"
                                    >
                                      <Settings className="w-5 h-5" />
                                    </button>

                                    <button
                                      onClick={() => {
                                        setSelectedCategory(category);
                                        setShowDeleteModal(true);
                                      }}
                                      className="w-10 h-10 flex items-center justify-center rounded-full 
                                                bg-danger-400 dark:bg-danger-200 
                                                text-primary-200 
                                                hover:bg-red-600 dark:hover:bg-red-700 
                                                focus:outline-none focus:ring-2 focus:ring-red-400"
                                    >
                                      <Trash className="w-5 h-5" />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              {/* Create Category Form */}
              <div className="md:col-span-1">
                <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg p-4 mb-6">
                  <h2 className="text-xl font-semibold text-primary-500 text-center sm:text-left mb-4">Create Category</h2>
                  
                  <form onSubmit={handleCreateCategory} className="space-y-4">
                    <div>
                      <label htmlFor="name" className="form-label text-primary-600">
                        Name <span className="text-danger-600 dark:text-danger-300">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        className="form-input"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="description" className="form-label text-primary-600">
                        Description
                      </label>
                      <textarea
                        id="description"
                        className="form-input"
                        value={newCategoryDescription}
                        onChange={(e) => setNewCategoryDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="color" className="form-label text-primary-600">
                        Color
                      </label>
                      
                      {/* Color picker with preview */}
                      <div className="mt-2 space-y-3">
                        {/* Color preview - entire area is clickable */}
                        <div className="relative group">
                          <input
                            id="color"
                            type="color"
                            value={newCategoryColor}
                            onChange={(e) => setNewCategoryColor(e.target.value)}
                            className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                          />
                          <div className="flex items-center p-3 border border-primary-200 dark:border-primary-200 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
                            <div 
                              className="w-12 h-12 rounded-lg shadow-inner border border-primary-200 dark:border-primary-600 flex-shrink-0"
                              style={{ backgroundColor: newCategoryColor }}
                            >
                              <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                
                              </div>
                            </div>
                            <div className="flex flex-col ml-3">
                              <span className="text-sm font-medium text-primary-600 dark:text-primary-600">
                                {newCategoryColor}
                              </span>
                              <span className="text-xs text-primary-500 dark:text-primary-400">
                                Click to select a custom color
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Predefined colors */}
                        <div>
                          <p className="text-xs text-primary-500 dark:text-primary-400 mb-2">
                            Or choose from predefined colors:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {predefinedColors.map((color) => (
                              <button
                                key={color}
                                type="button"
                                className={`w-6 h-6 rounded-md border hover:scale-110 transition-transform ${
                                  newCategoryColor === color 
                                    ? 'border-2 border-primary-600 dark:border-primary-700 shadow-md' 
                                    : 'border-primary-200 dark:border-primary-200'
                                }`}
                                style={{ backgroundColor: color }}
                                onClick={() => setNewCategoryColor(color)}
                                title={color}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="submit"
                        className="btn-primary w-full flex items-center justify-center space-x-2 dark:text-primary-700"
                        disabled={isSubmitting}
                      >
                        <CirclePlus className="w-5 h-5 text-gray-200 dark:text-gray-300" />
                        <span>{isSubmitting ? 'Creating...' : 'Create Category'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
          
          {error && (
            <div className="mt-6">
              <div className="border-4 border-dashed border-primary-200 rounded-lg p-4">
                <h2 className="text-xl font-semibold text-primary-500 text-center sm:text-left mb-4">What to do next?</h2>
                <div className="space-y-4">
                  <p className="text-primary-600 dark:text-primary-400">
                    While the categories feature is unavailable, you can still:
                  </p>
                  <ul className="list-disc pl-5 space-y-2 text-primary-600 dark:text-primary-400">
                    <li>Create documents without categories</li>
                    <li>Use tags to organize your documents</li>
                    <li>Search and filter documents by other criteria</li>
                  </ul>
                  <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 mt-4">
                    <button
                      onClick={() => router.push('/documents/new')}
                      className="btn-primary"
                    >
                      Create Document
                    </button>
                    <button
                      onClick={() => router.push('/documents')}
                      className="btn-secondary"
                    >
                      View Documents
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </Layout>
  );
}
