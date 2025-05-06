import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { documentsAPI } from '@/utils/api';
import { DocumentCreateData, DocumentUpdateData } from '@/types/api';
import Layout from '@/components/Layout';
import DocumentForm from '@/components/forms/DocumentForm';
import { ArrowLeft } from 'lucide-react';

export default function NewDocument() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const [isMobile, setIsMobile] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();
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

  // Handle form submission
  const handleSubmit = async (data: DocumentCreateData | DocumentUpdateData) => {
    // Since we're creating a new document, we need to ensure it has the organization property
    if (!('organization' in data)) {
      console.error('Missing organization in document data');
      setError('Failed to create document: Missing organization data');
      setIsSubmitting(false);
      return;
    }
    
    // Now we can safely treat it as DocumentCreateData
    const createData = data as DocumentCreateData;
    
    setIsSubmitting(true);
    setError(undefined);
    
    try {
      console.log('Creating document with data:', createData);
      
      // Make sure organization is a number
      if (typeof createData.organization === 'string') {
        createData.organization = parseInt(createData.organization, 10);
      }
      
      // Make sure category is a number if provided
      if (createData.category && typeof createData.category === 'string') {
        createData.category = parseInt(createData.category, 10);
      }
      
      const response = await documentsAPI.createDocument(createData);
      console.log('Document created successfully:', response.data);
      
      console.log('Full response from document creation:', response);
      
      // Document created successfully, redirect to documents list with success flag
      setError('Document created successfully! Redirecting to documents list...');
      setTimeout(() => {
        router.push({
          pathname: '/documents',
          query: { created: 'true' }
        });
      }, 1500);
    } catch (err: any) {
      console.error('Failed to create document:', err);
      
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
          setError('Failed to create document. Please try again.');
        }
      } else {
        setError('Failed to create document. Please try again.');
      }
      
      setIsSubmitting(false);
    }
  };

  // Show loading state while checking authentication
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    if (typeof window !== 'undefined') {
      router.push('/login');
    }
    return null;
  }

  return (
    <Layout title="New Document">
      <header className="bg-primary-100">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
              <button
                onClick={() => router.push('/documents')}
                className="mr-3 text-primary-500 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                aria-label="Back to Documents"
              >
                <ArrowLeft className="h-5 w-5" />
              </button>
              <h1 className="text-2xl sm:text-3xl font-bold text-primary-500">Create New Document</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-1 sm:px-0">
          <div className="p-4 mb-6">
            {error && error.includes('successfully') ? (
              <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            ) : error ? (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6">
                {error}
              </div>
            ) : null}
            
            <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md p-4">
              <DocumentForm
                onSubmit={handleSubmit}
                isSubmitting={isSubmitting}
                error={undefined} // We're handling the error display above
              />
            </div>
          </div>
        </div>
      </main>

    </Layout>
  );
}
