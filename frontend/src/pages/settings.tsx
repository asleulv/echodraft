import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import Layout from '@/components/Layout';
import { Lock, Moon, Sun, Settings as SettingsIcon, Clock } from "lucide-react";
import axios from 'axios';

export default function Settings() {
  const { user, isAuthenticated, isLoading } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState('password');
  const [isUpdating, setIsUpdating] = useState(false);
  const [passwordData, setPasswordData] = useState({
    current_password: '',
    new_password: '',
    confirm_password: '',
  });
  const [inactivityTimeout, setInactivityTimeout] = useState<string>("1800");
  const [stayLoggedIn, setStayLoggedIn] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();
  
  // Load session settings
  useEffect(() => {
    // Check if user has stay logged in preference
    const stayLoggedInPref = localStorage.getItem('stayLoggedIn') === 'true';
    setStayLoggedIn(stayLoggedInPref);
    
    // Load inactivity timeout from user preferences if available
    if (user && user.inactivity_timeout) {
      setInactivityTimeout(user.inactivity_timeout.toString());
    }
  }, [user]);

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle saving session settings
  const handleSaveSessionSettings = () => {
    setError('');
    setSuccess('');
    
    try {
      // Save stay logged in preference to localStorage
      if (stayLoggedIn) {
        localStorage.setItem('stayLoggedIn', 'true');
      } else {
        localStorage.removeItem('stayLoggedIn');
      }
      
      // Save inactivity timeout to localStorage for immediate effect
      // In a real implementation, you would also save these settings to the user's profile on the server
      localStorage.setItem('inactivityTimeout', inactivityTimeout);
      
      setSuccess('Settings saved successfully');
    } catch (err) {
      console.error('Failed to save settings:', err);
      setError('Failed to save settings');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccess('');

    // Validate passwords
    if (passwordData.new_password !== passwordData.confirm_password) {
      setError('New passwords do not match');
      setIsUpdating(false);
      return;
    }

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Update password
      await axios.post(
        'http://localhost:8000/api/v1/users/change-password/',
        {
          current_password: passwordData.current_password,
          new_password: passwordData.new_password,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      setSuccess('Password updated successfully');
      setPasswordData({
        current_password: '',
        new_password: '',
        confirm_password: '',
      });
    } catch (err: any) {
      console.error('Failed to update password:', err);
      setError(err.response?.data?.detail || 'Failed to update password');
    } finally {
      setIsUpdating(false);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Settings">
      <header className="bg-primary-100">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-3 sm:mb-0 text-center sm:text-left">Settings</h1>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-primary-100 shadow overflow-hidden sm:rounded-lg border-4 border-primary-50">
            {/* Tabs */}
            <div className="border-b border-primary-200 dark:border-primary-700">
              <nav className="flex -mb-px">
                <button
                  onClick={() => setActiveTab('password')}
                  className={`py-4 px-6 text-sm font-medium flex items-center ${
                    activeTab === 'password'
                      ? 'border-b-2 border-primary-500 text-primary-600 dark:text-secondary-400'
                      : 'text-primary-500 hover:text-primary-700 hover:border-primary-300 dark:text-primary-400 dark:hover:text-primary-300'
                  }`}
                >
                  <Lock className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">Password</span> 
                </button>
                <button
                  onClick={() => setActiveTab('appearance')}
                  className={`py-4 px-6 text-sm font-medium flex items-center ${
                    activeTab === 'appearance'
                      ? 'border-b-2 border-primary-500 text-primary-600 dark:text-secondary-400'
                      : 'text-primary-500 hover:text-primary-700 hover:border-primary-300 dark:text-primary-400 dark:hover:text-primary-300'
                  }`}
                >
                  {theme === 'dark' ? (
                    <Moon className="w-4 h-4 mr-2" />
                  ) : (
                    <Sun className="w-4 h-4 mr-2" />
                  )}
                  <span className="hidden sm:inline">Appearance</span> 
                </button>
                <button
                  onClick={() => setActiveTab('general')}
                  className={`py-4 px-6 text-sm font-medium flex items-center ${
                    activeTab === 'general'
                      ? 'border-b-2 border-primary-500 text-primary-600 dark:text-secondary-400'
                      : 'text-primary-500 hover:text-primary-700 hover:border-primary-300 dark:text-primary-400 dark:hover:text-primary-300'
                  }`}
                >
                  <SettingsIcon className="w-4 h-4 mr-2" />
                  <span className="hidden sm:inline">General</span> 
                </button>
              </nav>
            </div>
            
            {/* Tab content */}
            <div className="px-4 py-5 sm:p-6">
              {error && (
                <div className="mb-4 bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                  {error}
                </div>
              )}
              
              {success && (
                <div className="mb-4 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded">
                  {success}
                </div>
              )}
              
              {/* Password tab */}
              {activeTab === 'password' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-primary-600 dark:text-primary-400 mb-4">
                    Change Password
                  </h3>
                  <form onSubmit={handlePasswordSubmit}>
                    <div className="space-y-6">
                      <div>
                        <label htmlFor="current_password" className="form-label">
                          Current Password
                        </label>
                        <input
                          type="password"
                          name="current_password"
                          id="current_password"
                          value={passwordData.current_password}
                          onChange={handlePasswordChange}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="new_password" className="form-label">
                          New Password
                        </label>
                        <input
                          type="password"
                          name="new_password"
                          id="new_password"
                          value={passwordData.new_password}
                          onChange={handlePasswordChange}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <label htmlFor="confirm_password" className="form-label">
                          Confirm New Password
                        </label>
                        <input
                          type="password"
                          name="confirm_password"
                          id="confirm_password"
                          value={passwordData.confirm_password}
                          onChange={handlePasswordChange}
                          className="form-input"
                          required
                        />
                      </div>
                      
                      <div>
                        <button
                          type="submit"
                          className="btn-primary"
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : 'Update Password'}
                        </button>
                      </div>
                    </div>
                  </form>
                </div>
              )}
              
              {/* Appearance tab */}
              {activeTab === 'appearance' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-primary-600 dark:text-primary-400 mb-4">
                    Appearance Settings
                  </h3>
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-md font-medium text-primary-700 dark:text-primary-300 mb-2">
                        Theme
                      </h4>
                      <div className="flex space-x-4">
                        <button
                          onClick={toggleTheme}
                          className={`px-4 py-2 rounded-md flex items-center ${
                            theme === 'light'
                              ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                              : 'bg-primary-200 text-primary-700 border border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          <Sun className="w-4 h-4 mr-2" />
                          Light
                        </button>
                        <button
                          onClick={toggleTheme}
                          className={`px-4 py-2 rounded-md flex items-center ${
                            theme === 'dark'
                              ? 'bg-primary-100 text-primary-700 border-2 border-primary-500'
                              : 'bg-primary-200 text-primary-700 border border-primary-300 hover:bg-primary-50'
                          }`}
                        >
                          <Moon className="w-4 h-4 mr-2" />
                          Dark
                        </button>
                      </div>
                      <p className="mt-2 text-sm text-primary-500 dark:text-primary-500">
                        Choose between light and dark theme for the application.
                      </p>
                    </div>
                  </div>
                </div>
              )}
              
              {/* General tab */}
              {activeTab === 'general' && (
                <div>
                  <h3 className="text-lg leading-6 font-medium text-primary-500 mb-4">
                    General Settings
                  </h3>
                  <div className="space-y-6">
                    <div>
                    <p className="text-sm text-danger-500">
                        English is the only available language at the moment.
                      </p>
                      <h4 className="text-md font-medium text-primary-500 mb-2">
                        Language
                      </h4>
                      <select
                        className="form-input"
                        defaultValue="en"
                      >
                        <option value="en">English</option>

                      </select>
                      <p className="mt-2 text-sm text-primary-500 dark:text-primary-500">
                        Select your preferred language for the application interface.
                      </p>
                    </div>
                    
                    {/* Time Zone settings removed as they are not used */}
                    
                    <div className="mt-6 border-t border-gray-200 pt-6">
                      <h4 className="text-md font-medium text-primary-500 mb-2 flex items-center">
                        <Clock className="w-4 h-4 mr-2" />
                        Session Settings
                      </h4>
                      
                      {/* Inactivity Timeout */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-primary-500">
                          Auto-logout after inactivity
                        </label>
                        <select 
                          className="mt-1 block w-full pl-3 pr-10 py-2 text-primary-500 border-secondary-300 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm rounded-md"
                          value={inactivityTimeout}
                          onChange={(e) => setInactivityTimeout(e.target.value)}
                        >
                          <option value="900">15 minutes</option>
                          <option value="1800">30 minutes</option>
                          <option value="3600">1 hour</option>
                          <option value="14400">4 hours</option>
                          <option value="0">Never (not recommended)</option>
                        </select>
                        <p className="mt-1 text-sm text-primary-500 dark:text-primary-500">
                          You'll be automatically logged out after this period of inactivity.
                        </p>
                      </div>
                      
                      {/* Stay Logged In */}
                      <div className="mt-4">
                        <div className="flex items-start">
                          <div className="flex items-center h-5">
                            <input
                              id="stayLoggedIn"
                              name="stayLoggedIn"
                              type="checkbox"
                              checked={stayLoggedIn}
                              onChange={(e) => setStayLoggedIn(e.target.checked)}
                              className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
                            />
                          </div>
                          <div className="ml-3 text-sm">
                            <label htmlFor="stayLoggedIn" className="font-medium text-primary-500">
                              Stay logged in
                            </label>
                            <p className="text-primary-500 dark:text-primary-500">
                              Keep me logged in on this device until I explicitly log out.
                              Not recommended for shared or public computers.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div>
                      <button
                        type="button"
                        className="btn-primary"
                        onClick={handleSaveSessionSettings}
                      >
                        Save Settings
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </Layout>
  );
}
