import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useAuth } from '@/context/AuthContext';
import Layout from '@/components/Layout';
import { User, Mail, Building, UserCheck } from "lucide-react";
import axios from 'axios';

export default function Profile() {
  const { user, isAuthenticated, isLoading, refreshUser } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    marketing_consent: false,
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Initialize form data with user data
  useEffect(() => {
    if (user) {
      console.log('User data loaded:', user);
      
      setFormData({
        first_name: user.first_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        marketing_consent: user.marketing_consent || false,
      });
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      // Get the current user's ID
      const userResponse = await axios.get(
        'http://localhost:8000/api/v1/users/me/',
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      const userId = userResponse.data.id;
      
      // Update user profile using the update_profile endpoint
      const updateResponse = await axios.patch(
        `http://localhost:8000/api/v1/users/${userId}/update_profile/`,
        {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          marketing_consent: formData.marketing_consent,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      console.log('Profile update response:', updateResponse.data);

      // Refresh the user data in the AuthContext
      await refreshUser();
      
      setSuccess('Profile updated successfully');
    } catch (err: any) {
      console.error('Failed to update profile:', err);
      setError(err.response?.data?.detail || 'Failed to update profile');
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
    <Layout title="Your Profile">
      <header className="bg-primary-100">
        <div className="max-w-7xl mx-auto py-4 sm:py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
            <h1 className="text-2xl sm:text-3xl font-bold text-primary-500 mb-3 sm:mb-0 text-center sm:text-left">Your Profile</h1>
          </div>
        </div>
      </header>
    
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <div className="bg-white dark:bg-primary-100 shadow overflow-hidden sm:rounded-lg border-4 border-primary-50">
            <div className="px-4 py-5 sm:px-6 border-b border-primary-200 dark:border-primary-700">
              <h3 className="text-lg leading-6 font-medium text-primary-600">
                Profile Information
              </h3>
              <p className="mt-1 max-w-2xl text-sm text-primary-500">
                Personal details and account information
              </p>
            </div>
            
            {/* Profile details */}
            <div className="px-4 py-5 sm:p-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-primary-500 dark:text-primary-600 flex items-center">
                    <User className="w-4 h-4 mr-2" />
                    Username
                  </dt>
                  <dd className="mt-1 text-sm text-primary-700">
                    {user?.username}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-primary-500 dark:text-primary-600 flex items-center">
                    <Mail className="w-4 h-4 mr-2" />
                    Email address
                  </dt>
                  <dd className="mt-1 text-sm text-primary-700">
                    {user?.email}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-primary-500 dark:text-primary-600 flex items-center">
                    <Building className="w-4 h-4 mr-2" />
                    Organization
                  </dt>
                  <dd className="mt-1 text-sm text-primary-700">
                    {user?.organization_name}
                  </dd>
                </div>
                
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-primary-500 dark:text-primary-600 flex items-center">
                    <UserCheck className="w-4 h-4 mr-2" />
                    Role
                  </dt>
                  <dd className="mt-1 text-sm text-primary-700">
                    {user?.role}
                    {user?.is_organization_admin && " (Organization Admin)"}
                  </dd>
                </div>
              </dl>
            </div>
            
            {/* Edit profile form */}
            <div className="border-t border-primary-200  px-4 py-5 sm:p-6">
              <h3 className="text-lg leading-6 font-medium text-primary-600 dark:text-primary-400 mb-4">
                Edit Profile
              </h3>
              
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
              
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <label htmlFor="first_name" className="form-label">
                      First name
                    </label>
                    <input
                      type="text"
                      name="first_name"
                      id="first_name"
                      value={formData.first_name}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="sm:col-span-3">
                    <label htmlFor="last_name" className="form-label">
                      Last name
                    </label>
                    <input
                      type="text"
                      name="last_name"
                      id="last_name"
                      value={formData.last_name}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                  
                  <div className="sm:col-span-6">
                    <label htmlFor="email" className="form-label">
                      Email address
                    </label>
                    <input
                      type="email"
                      name="email"
                      id="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="form-input"
                    />
                  </div>
                </div>
                
                <div className="mt-6 mb-6">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="marketing_consent"
                        name="marketing_consent"
                        type="checkbox"
                        checked={formData.marketing_consent}
                        onChange={(e) => 
                          setFormData((prev) => ({ 
                            ...prev, 
                            marketing_consent: e.target.checked 
                          }))
                        }
                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label htmlFor="marketing_consent" className="font-medium text-gray-700 dark:text-gray-300">
                        Marketing emails
                      </label>
                      <p className="text-gray-500 dark:text-gray-400">
                        Yes, I'd like to receive updates about new features, tips, and special offers. You can unsubscribe at any time.
                      </p>
                    </div>
                  </div>
                </div>
                
                <div className="mt-6">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={isUpdating}
                  >
                    {isUpdating ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
            
            {/* AI Integration Settings section removed - using global API key */}
            
          </div>
        </div>
      </main>
    </Layout>
  );
}
