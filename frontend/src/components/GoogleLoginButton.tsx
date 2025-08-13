import { GoogleLogin } from '@react-oauth/google';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface GoogleLoginButtonProps {
  onError?: (error: string) => void;
  onSuccess?: () => void;
  buttonText?: 'signin_with' | 'signup_with'; 
}

const GoogleLoginButton = ({ onError, onSuccess, buttonText }: GoogleLoginButtonProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const { loginWithGoogle } = useAuth();

  const handleGoogleSuccess = async (credentialResponse: any) => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/v1/google', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token: credentialResponse.credential
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data.success) {
        // Store JWT tokens for API authentication
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        
        if (data.refresh_token) {
          localStorage.setItem('refreshToken', data.refresh_token);
        }
        
        // Login with Google - AuthContext handles the user profile refresh
        await loginWithGoogle(data.user);
        
        onSuccess?.();
      } else {
        onError?.(data.error || 'Google login failed');
      }
    } catch (error) {
      console.error('Google login failed:', error);
      onError?.('Google login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleError = () => {
    onError?.('Google login failed. Please try again.');
  };

  return (
    <div className="relative">
      {isLoading && (
        <div className="absolute inset-0 bg-white dark:bg-gray-800 bg-opacity-75 flex items-center justify-center rounded-md z-10">
          <div className="text-sm text-gray-600 dark:text-gray-300">Signing in...</div>
        </div>
      )}
      <GoogleLogin
        onSuccess={handleGoogleSuccess}
        onError={handleGoogleError}
        theme="filled_black"
        size="large"
        width="100%"
        text={buttonText || 'signin_with'}
        locale="en"
      />
    </div>
  );
};

export default GoogleLoginButton;
