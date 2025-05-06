import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import WandPencilIcon from "@/components/icons/WandPencilIcon";
import { authAPI } from '@/utils/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      // Call the password reset request API
      await authAPI.requestPasswordReset(email);
      
      // Show success message
      setSuccess('If an account with that email exists, we have sent password reset instructions.');
      
      // Clear the form
      setEmail('');
    } catch (err: any) {
      // Show error message, but don't reveal if the email exists or not
      setError('There was a problem processing your request. Please try again.');
      console.error('Password reset request error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Forgot Password">
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-secondary-400 to-secondary-800 bg-clip-text text-transparent dark:from-secondary-700 dark:to-secondary-500">
            <WandPencilIcon className="w-24 h-24 mx-auto text-secondary-800 dark:text-secondary-500" />
          </h1>

          <h2 className="mt-6 text-center text-2xl font-bold text-primary-600">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-primary-500">
            Enter your email address and we'll send you a link to reset your password.
          </p>
        </div>

        <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-primary-200 py-8 px-4 shadow sm:rounded-lg sm:px-10">
            {success && (
              <div className="mb-4 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded">
                {success}
              </div>
            )}
            
            {error && (
              <div className="mb-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="email" className="form-label">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="form-input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-primary w-full flex justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? 'Sending...' : 'Send reset link'}
                </button>
              </div>
            </form>

            <div className="mt-6 text-center">
              <Link href="/login" className="font-medium text-primary-700 hover:text-secondary-500">
                Back to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
