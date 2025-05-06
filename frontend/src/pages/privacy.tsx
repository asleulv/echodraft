import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { legalAPI } from '@/utils/api';
import { AlertCircle } from 'lucide-react';

export default function PrivacyPolicy() {
  const [privacyDocument, setPrivacyDocument] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchPrivacyPolicy = async () => {
      try {
        setIsLoading(true);
        const response = await legalAPI.getLegalDocument('privacy');
        setPrivacyDocument(response.data);
      } catch (err: any) {
        console.error('Failed to load Privacy Policy:', err);
        setError('Failed to load Privacy Policy. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchPrivacyPolicy();
  }, []);

  return (
    <Layout title="Privacy Policy">
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="border-4 border-dashed border-primary-200 rounded-lg p-4 sm:p-6">
            <h1 className="text-2xl font-bold text-primary-700 dark:text-primary-500 mb-6">
              Privacy Policy
            </h1>

            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary-500"></div>
              </div>
            ) : error ? (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6 flex items-start">
                <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>{error}</div>
              </div>
            ) : privacyDocument ? (
              <div>
                <div className="mb-4 text-sm text-primary-500">
                  <p>Version: {privacyDocument.version}</p>
                  <p>Effective Date: {new Date(privacyDocument.effective_date).toLocaleDateString()}</p>
                </div>
                <div 
                  className="prose dark:prose-invert max-w-none"
                  dangerouslySetInnerHTML={{ __html: privacyDocument.content }}
                />
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-primary-500">No Privacy Policy document found.</p>
                <p className="text-primary-400 text-sm mt-2">
                  Please contact the administrator to set up the Privacy Policy.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
