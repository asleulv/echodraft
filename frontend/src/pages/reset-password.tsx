import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import WandPencilIcon from "@/components/icons/WandPencilIcon";
import { authAPI } from '@/utils/api';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isValidToken, setIsValidToken] = useState(true);
  const router = useRouter();
  const { uid, token } = router.query;

  // Validate that we have a token and uid
  useEffect(() => {
    if (router.isReady && (!token || !uid)) {
      setIsValidToken(false);
      setError('Invalid password reset link. Please request a new one.');
    }
  }, [router.isReady, token, uid]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    
    // Validate passwords match
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    
    // Validate password length
    if (newPassword.length < 8) {
      setError('Password must be at least 8 characters long.');
      return;
    }
    
    setIsLoading(true);

    try {
      // Call the password reset confirm API
      await authAPI.confirmPasswordReset(uid as string, token as string, newPassword);
      
      // Show success message
      setSuccess('Your password has been reset successfully!');
      
      // Clear the form
      setNewPassword('');
      setConfirmPassword('');
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        router.push('/login');
      }, 3000);
    } catch (err: any) {
      // Show error message
      setError(err.response?.data?.detail || 'There was a problem resetting your password. Please try again or request a new reset link.');
      console.error('Password reset error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Reset Password">
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-secondary-400 to-secondary-800 bg-clip-text text-transparent dark:from-secondary-700 dark:to-secondary-500">
            <WandPencilIcon className="w-24 h-24 mx-auto text-secondary-800 dark:text-secondary-500" />
          </h1>

          <h2 className="mt-6 text-center text-2xl font-bold text-primary-600">Reset your password</h2>
          <p className="mt-2 text-center text-sm text-primary-500">
            Enter your new password below.
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

            {isValidToken ? (
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div>
                  <label htmlFor="new-password" className="form-label">
                    New Password
                  </label>
                  <input
                    id="new-password"
                    name="new-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="form-input"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    minLength={8}
                  />
                </div>

                <div>
                  <label htmlFor="confirm-password" className="form-label">
                    Confirm Password
                  </label>
                  <input
                    id="confirm-password"
                    name="confirm-password"
                    type="password"
                    autoComplete="new-password"
                    required
                    className="form-input"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    minLength={8}
                  />
                </div>

                <div>
                  <button
                    type="submit"
                    className="btn-primary w-full flex justify-center"
                    disabled={isLoading}
                  >
                    {isLoading ? 'Resetting...' : 'Reset Password'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="text-center py-4">
                <p className="text-danger-600 mb-4">Invalid or expired password reset link.</p>
                <Link href="/forgot-password" className="btn-primary inline-block px-4 py-2">
                  Request a new reset link
                </Link>
              </div>
            )}

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
