import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';

export default function Custom404() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <Layout title="Page Not Found">
      <div className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full text-center animate-fadeIn">
          <div className="mb-6">
            <h1 className="text-9xl font-bold text-primary-600">404</h1>
            <h2 className="mt-2 text-3xl font-bold text-primary-800 dark:text-primary-600">
              Page Not Found
            </h2>
            <p className="mt-4 text-lg text-primary-600 dark:text-primary-500">
              The page you're looking for doesn't exist or has been moved.
            </p>
          </div>

          <div className="mt-8 flex flex-col space-y-4">
            <Link
              href="/"
              className="w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go to Home
            </Link>
            
            <button
              onClick={() => router.back()}
              className="w-full flex items-center justify-center px-4 py-3 border border-primary-300 text-base font-medium rounded-md text-primary-700 bg-white hover:bg-primary-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
            >
              Go Back
            </button>
          </div>

          <div className="mt-12">
            <p className="text-sm text-primary-500 dark:text-primary-400">
              If you believe this is an error, please{" "}
              <Link href="/contact" className="text-primary-600 hover:text-primary-800 dark:text-primary-500 dark:hover:text-primary-400 underline">
                contact support
              </Link>
              .
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
