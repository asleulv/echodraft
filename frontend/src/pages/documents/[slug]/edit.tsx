import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/utils/api';
import { DocumentDetail, DocumentUpdateData } from '@/types/api';
import Layout from '@/components/Layout';
import DocumentForm from '@/components/forms/DocumentForm';

export default function EditDocument() {
  const [document, setDocument] = useState<DocumentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
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

  // Fetch document
  useEffect(() => {
    const fetchDocument = async () => {
      if (!isAuthenticated || !slug || typeof slug !== 'string') return;
      
      try {
        console.log('Fetching document for editing with slug:', slug);
        setIsLoading(true);
        
        const response = await documentsAPI.getDocument(slug);
        console.log('Document fetched successfully for editing:', response.data);
        setDocument(response.data);
      } catch (err: any) {
        console.error('Failed to load document for editing:', err);
        setError('Failed to load document. Please try again.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocument();
  }, [isAuthenticated, slug]);

  // Handle form submission
  const handleSubmit = async (data: DocumentUpdateData) => {
    if (!document || !slug || typeof slug !== 'string') return;
    
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      console.log('Updating document with data:', data);
      
      // Make sure category is a number if provided
      if (data.category && typeof data.category === 'string') {
        data.category = parseInt(data.category, 10);
      }
      
      const response = await documentsAPI.updateDocument(slug, data);
      console.log('Document updated successfully:', response.data);
      
      // Document updated successfully, redirect to document detail page
      setError('Document updated successfully! Redirecting...');
      setTimeout(() => {
        router.push(`/documents/${slug}`);
      }, 1500);
    } catch (err: any) {
      console.error('Failed to update document:', err);
      
      // Handle API error
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
          setError('Failed to update document. Please try again.');
        }
      } else {
        setError('Failed to update document. Please try again.');
      }
      
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

  // Show error state if document couldn't be loaded
  if (error && !document) {
    return (
      <Layout title="Error">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
              {error}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  // Show document not found
  if (!document) {
    return (
      <Layout title="Document Not Found">
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="text-center py-8">
              <h2 className="text-2xl font-bold mb-4">Document Not Found</h2>
              <p className="text-primary-500 dark:text-primary-600 mb-4">
                The document you're trying to edit doesn't exist or you don't have permission to edit it.
              </p>
              <button
                onClick={() => router.push('/dashboard')}
                className="btn-primary"
              >
                Back to Dashboard
              </button>
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title={`Edit: ${document.title}`}>
     

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className={`${isMobile ? 'px-0 py-2' : 'px-4 py-6'} sm:px-0`}>
          <div className={`${isMobile ? 'border-0 p-1' : 'border-4 border-dashed border-primary-200 rounded-lg p-4'} mb-6`}>
            {error && error.includes('successfully') ? (
              <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            ) : error ? (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            ) : null}
            
            <div className="bg-white dark:bg-primary-100 border border-primary-200 rounded-md p-4">
              <DocumentForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={undefined} // We're handling the error display above
                initialData={document}
              />
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
