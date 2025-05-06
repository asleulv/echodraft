import { useEffect } from 'react';
import { GetServerSideProps } from 'next';
import Layout from '@/components/Layout';
import Link from 'next/link';

// Define the props type
interface VerifyEmailProps {
  token: string;
}

// Server-side function to handle the verification
export const getServerSideProps: GetServerSideProps = async (context) => {
  const { token } = context.query;
  
  if (!token || typeof token !== 'string') {
    return {
      redirect: {
        destination: '/login?verified=false',
        permanent: false,
      },
    };
  }
  
  // Redirect directly to the backend verification endpoint
  // This will be handled by the backend and redirected back to the login page
  const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
  
  return {
    redirect: {
      destination: `${backendUrl}/api/v1/verify-email/${token}/`,
      permanent: false,
    },
  };
};

// Client-side component (will only be shown briefly before redirect)
export default function VerifyEmail({ token }: VerifyEmailProps) {
  return (
    <Layout title="Verify Email">
      <div className="min-h-[80vh] flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900 dark:text-white">
            Email Verification
          </h2>
          
          <div className="mt-4">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-500 mx-auto"></div>
            <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">Verifying your email...</p>
            <p className="mt-4">
              <Link href="/login" className="text-primary-600 hover:text-primary-500">
                Click here if you're not redirected automatically
              </Link>
            </p>
          </div>
        </div>
      </div>
    </Layout>
  );
}
