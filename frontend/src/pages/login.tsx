import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import WandPencilIcon from "@/components/icons/WandPencilIcon";

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [stayLoggedIn, setStayLoggedIn] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    // Check for verification status and username in URL query parameters
    const { verified, username: usernameParam } = router.query;
    
    // Set verification status messages
    if (verified === 'true') {
      setSuccess('Your email has been verified successfully! You can now log in.');
      
      // Pre-fill username if provided
      if (usernameParam && typeof usernameParam === 'string') {
        setUsername(usernameParam);
        // Focus on password field for better UX
        setTimeout(() => {
          const passwordInput = document.getElementById('password');
          if (passwordInput) {
            passwordInput.focus();
          }
        }, 100);
      }
    } else if (verified === 'false') {
      setError('Email verification failed. Please try registering again or contact support.');
    }
  }, [router.query]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      await login(username, password, stayLoggedIn);
      // Redirect is handled in the login function
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to login. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout title="Login">
      <div className="min-h-[80vh] flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold bg-gradient-to-r from-secondary-400 to-secondary-800 bg-clip-text text-transparent dark:from-secondary-700 dark:to-secondary-500">
          <WandPencilIcon className="w-24 h-24 mx-auto text-secondary-800 dark:text-secondary-500" />
        </h1>

          <h2 className="mt-6 text-center text-2xl font-bold text-primary-600">Sign in to your account</h2>
          <p className="mt-2 text-center text-sm text-primary-500">
            Or{' '}
            <Link href="/register" className="font-medium text-primary-500 hover:text-secondary-600">
              create a new account
            </Link>
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
                <label htmlFor="username" className="form-label">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  autoComplete="username"
                  required
                  className="form-input"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                />
              </div>

              <div>
                <label htmlFor="password" className="form-label">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="form-input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <input
                    id="stay-logged-in"
                    name="stay-logged-in"
                    type="checkbox"
                    checked={stayLoggedIn}
                    onChange={(e) => setStayLoggedIn(e.target.checked)}
                    className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                  />
                  <label htmlFor="stay-logged-in" className="ml-2 block text-sm text-primary-700">
                    Stay logged in
                  </label>
                </div>

                <div className="text-sm">
                  <Link href="/forgot-password" className="font-medium text-primary-700 hover:text-secondary-500">
                    Forgot your password?
                  </Link>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  className="btn-primary w-full flex justify-center"
                  disabled={isLoading}
                >
                  {isLoading ? 'Signing in...' : 'Sign in'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </Layout>
  );
}
