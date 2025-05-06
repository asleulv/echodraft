import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { categoriesAPI } from '@/utils/api';
import type { Category } from '@/types/api';
import Layout from '@/components/Layout';
import { ArrowLeft, Palette } from 'lucide-react';

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

export default function EditCategory() {
  const [category, setCategory] = useState<Category | null>(null);
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryColor, setCategoryColor] = useState('#3B82F6'); // Default to a blue color
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const { slug } = router.query;

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

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch category
  useEffect(() => {
    const fetchCategory = async () => {
      if (!isAuthenticated || !slug || typeof slug !== 'string') return;
      
      try {
        setIsLoading(true);
        const response = await categoriesAPI.getCategory(slug);
        const categoryData = response.data;
        
        setCategory(categoryData);
        setCategoryName(categoryData.name);
        setCategoryDescription(categoryData.description || '');
        setCategoryColor(categoryData.color || '#3B82F6');
      } catch (err: any) {
        console.error('Failed to load category:', err);
        setError('Failed to load category');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCategory();
  }, [isAuthenticated, slug]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!category) return;
    if (!categoryName.trim()) {
      setError('Category name is required');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      const response = await categoriesAPI.updateCategory(category.slug, {
        name: categoryName.trim(),
        description: categoryDescription.trim() || null,
        color: categoryColor,
      });
      
      console.log('Category updated:', response.data);
      
      // Show success message before redirecting
      setSuccessMessage('Category updated successfully! Redirecting...');
      
      // Redirect to categories index page with success message after a short delay
      setTimeout(() => {
        router.push({
          pathname: '/categories',
          query: { success: 'Category updated successfully!' }
        });
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update category:', err);
      
      if (err.response?.data) {
        // Format API validation errors
        const apiErrors = err.response.data;
        const errorMessages = [];
        
        for (const field in apiErrors) {
          if (Array.isArray(apiErrors[field])) {
            errorMessages.push(`${field}: ${apiErrors[field].join(', ')}`);
          } else if (typeof apiErrors[field] === 'string') {
            errorMessages.push(`${field}: ${apiErrors[field]}`);
          }
        }
        
        if (errorMessages.length > 0) {
          setError(errorMessages.join('\n'));
        } else {
          setError('Failed to update category. Please try again.');
        }
      } else {
        setError('Failed to update category. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
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

  // Show error state
  if (error && !category) {
    return (
      <Layout title="Error">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
              {error}
            </div>
            <div className="mt-4">
              <button
                onClick={() => router.push('/categories')}
                className="btn-primary"
              >
                Back to Categories
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show category not found
  if (!category) {
    return (
      <Layout title="Category Not Found">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Category Not Found</h2>
              <p className="text-secondary-500 dark:text-primary-600 mb-4">
                The category you're looking for doesn't exist or you don't have permission to view it.
              </p>
              <button
                onClick={() => router.push('/categories')}
                className="btn-primary"
              >
                Back to Categories
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Edit Category: ${category.name}`}>
      <header className="bg-primary-100">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
              <button
                onClick={() => router.push('/categories')}
                className="mr-3 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                aria-label="Back to Categories"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-500">Edit Category</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-primary-200 rounded-lg p-4 mb-6">
            {successMessage && (
              <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6">
                {successMessage}
              </div>
            )}
            
            {error && (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            )}
            
            <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md p-4">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="name" className="form-label">
                    Name <span className="text-danger-600 dark:text-danger-400">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    className="form-input"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                    required
                  />
                </div>
                
                <div>
                  <label htmlFor="description" className="form-label">
                    Description
                  </label>
                  <textarea
                    id="description"
                    className="form-input"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label htmlFor="color" className="form-label">
                    Color
                  </label>
                  
                  {/* Color picker with preview */}
                  <div className="mt-2 space-y-3">
                    {/* Color preview - entire area is clickable */}
                    <div className="relative group">
                      <input
                        id="color"
                        type="color"
                        value={categoryColor}
                        onChange={(e) => setCategoryColor(e.target.value)}
                        className="absolute inset-0 opacity-0 w-full h-full cursor-pointer z-10"
                      />
                      <div className="flex items-center p-3 border border-primary-200 dark:border-primary-300 rounded-lg hover:border-primary-400 dark:hover:border-primary-500 transition-colors cursor-pointer">
                        <div 
                          className="w-12 h-12 rounded-lg shadow-inner border border-primary-200 dark:border-primary-700 flex-shrink-0"
                          style={{ backgroundColor: categoryColor }}
                        >
                          <div className="w-full h-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <Palette className="h-6 w-6 text-white drop-shadow-md" />
                          </div>
                        </div>
                        <div className="flex flex-col ml-3">
                          <span className="text-sm font-medium text-primary-700 dark:text-primary-500">
                            {categoryColor}
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
                            className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform ${
                              categoryColor === color 
                                ? 'border-2 border-primary-600 dark:border-primary-700 shadow-md' 
                                : 'border-primary-200 dark:border-primary-200'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setCategoryColor(color)}
                            title={color}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row sm:justify-end space-y-2 sm:space-y-0 sm:space-x-4">
                  <button
                    type="button"
                    className="btn-danger"
                    onClick={() => router.push('/categories')}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
