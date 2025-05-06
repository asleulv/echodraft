import axios from 'axios';
import { AuthTokens, RegistrationData, RegistrationResponse, User } from '@/types/api';

// Get the API URL from environment or use a default
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://192.168.86.33:8000';
const API_BASE_PATH = '/api/v1/';

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}${API_BASE_PATH}`,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 15000, // 15 seconds timeout
});

// For debugging
console.log(`API configured with baseURL: ${API_URL}${API_BASE_PATH}`);

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add a response interceptor to handle token refresh
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      try {
        // Try to refresh the token
        const refreshToken = localStorage.getItem('refreshToken');
        if (!refreshToken) {
          console.error('No refresh token available for refresh attempt');
          throw new Error('No refresh token available');
        }
        
        console.log('Attempting to refresh token...');
        const response = await axios.post(`${API_URL}${API_BASE_PATH}auth/token/refresh/`, {
          refresh: refreshToken,
        });
        console.log('Token refresh successful');
        
        const { access } = response.data;
        
        // Save the new token
        localStorage.setItem('token', access);
        
        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;
        
        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        
        // Redirect to login page using replace to avoid navigation issues
        window.location.replace('/login');
        
        return Promise.reject(refreshError);
      }
    }
    
    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (username: string, password: string) => 
    api.post<AuthTokens>('auth/token/', { username, password }),
    
  requestPasswordReset: (email: string) => {
    console.log('API: Requesting password reset for email:', email);
    return api.post('password-reset/', { email })
      .then(response => {
        console.log('API: Password reset request successful');
        return response;
      })
      .catch(error => {
        console.error('API: Error requesting password reset:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  confirmPasswordReset: (uid: string, token: string, newPassword: string) => {
    console.log('API: Confirming password reset');
    return api.post('password-reset/confirm/', { 
      uid, 
      token, 
      new_password: newPassword 
    })
      .then(response => {
        console.log('API: Password reset confirmation successful');
        return response;
      })
      .catch(error => {
        console.error('API: Error confirming password reset:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  register: (userData: RegistrationData) => {
    // Create a simplified registration payload
    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password_confirm: userData.password_confirm,
      organization: userData.organization,
      role: userData.role || 'admin',
      first_name: userData.first_name || '',
      last_name: userData.last_name || '',
    };
    
    // Log the data being sent for debugging
    console.log('API: Registration data being sent:', payload);
    
    return api.post<RegistrationResponse>('register/', payload, {
      timeout: 10000, // 10 seconds timeout
    })
    .then(response => {
      console.log('API: Registration successful:', response.data);
      return response;
    })
    .catch(error => {
      // Enhanced error logging
      console.error('Registration API error:', error);
      if (error.response) {
        console.error('Error response data:', error.response.data);
        console.error('Error response status:', error.response.status);
        console.error('Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('Error request (no response received):', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      console.error('Error config:', error.config);
      
      throw error;
    });
  },
  
  refreshToken: (refreshToken: string) => 
    api.post<{ access: string }>('auth/token/refresh/', { refresh: refreshToken }),
  
  // Cache for user profile data
  _userProfileCache: {
    data: null as User | null,
    timestamp: 0,
    pendingPromise: null as Promise<any> | null,
  },
  
  getProfile: () => {
    // Cache duration in milliseconds (30 seconds)
    const CACHE_DURATION = 30000;
    
    // Check if we have a recent cached profile
    const now = Date.now();
    if (
      authAPI._userProfileCache.data && 
      now - authAPI._userProfileCache.timestamp < CACHE_DURATION
    ) {
      console.log('Using cached user profile data');
      return Promise.resolve({ 
        data: authAPI._userProfileCache.data,
        status: 200,
        statusText: 'OK',
        headers: {},
        config: {} as any
      });
    }
    
    // If there's already a pending request, return that promise
    if (authAPI._userProfileCache.pendingPromise) {
      console.log('Using pending user profile request');
      return authAPI._userProfileCache.pendingPromise;
    }
    
    console.log('Fetching user profile from API utility');
    
    // Create a new request
    const promise = api.get<User>('users/me/')
      .then(response => {
        console.log('API utility: User profile fetched successfully');
        
        // Update the cache
        authAPI._userProfileCache.data = response.data;
        authAPI._userProfileCache.timestamp = Date.now();
        authAPI._userProfileCache.pendingPromise = null;
        
        return response;
      })
      .catch(error => {
        console.error('API utility: Error fetching user profile:', error);
        
        // Clear the pending promise on error
        authAPI._userProfileCache.pendingPromise = null;
        
        throw error;
      });
    
    // Store the pending promise
    authAPI._userProfileCache.pendingPromise = promise;
    
    return promise;
  },
};

export const styleConstraintsAPI = {
  getStyleConstraints: (params?: any) => {
    console.log('API: Fetching style constraints with params:', params);
    return api.get('style-constraints', { params })
      .then(response => {
        console.log('API: Style constraints fetched successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error fetching style constraints:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  getStyleConstraint: (id: number) => {
    console.log('API: Fetching style constraint with ID:', id);
    return api.get(`style-constraints/${id}`)
      .then(response => {
        console.log('API: Style constraint fetched successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error fetching style constraint:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  createStyleConstraint: (data: any) => {
    console.log('API: Creating style constraint with data:', data);
    return api.post('style-constraints', data)
      .then(response => {
        console.log('API: Style constraint created successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error creating style constraint:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  updateStyleConstraint: (id: number, data: any) => {
    console.log('API: Updating style constraint with ID:', id, 'data:', data);
    return api.patch(`style-constraints/${id}`, data)
      .then(response => {
        console.log('API: Style constraint updated successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error updating style constraint:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  deleteStyleConstraint: (id: number) => {
    console.log('API: Deleting style constraint with ID:', id);
    return api.delete(`style-constraints/${id}`)
      .then(response => {
        console.log('API: Style constraint deleted successfully');
        return response;
      })
      .catch(error => {
        console.error('API: Error deleting style constraint:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  getReferenceDocuments: (id: number) => {
    console.log('API: Fetching reference documents for style constraint with ID:', id);
    return api.get(`style-constraints/${id}/reference_documents`)
      .then(response => {
        console.log('API: Reference documents fetched successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error fetching reference documents:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  }
};

export const documentsAPI = {
  exportHTML: (slug: string) => {
    console.log('API: Exporting document as HTML with slug:', slug);
    // Reuse the existing PDF endpoint for now
    return api.get(`documents/${slug}/export_pdf`)
    .then(response => {
      console.log('API: Document data for HTML export fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching document data for HTML export:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
    
  },
  
  // Add after the existing createPDFShare method
  createHTMLShare: (slug: string, options?: { expiration_type?: string, pin_protected?: boolean }) => {
    console.log('API: Creating shareable HTML link for document with slug:', slug, 'options:', options);
    // Reuse the existing PDF endpoint for now
    return api.post(`documents/${slug}/create_pdf_share`, options)
    .then(response => {
      console.log('API: Shareable HTML link created successfully:', response.data);
      // Modify the response to use the HTML viewer path
      if (response.data && response.data.share_url) {
        const originalUrl = response.data.share_url;
        // Replace /shared/pdf/ with /shared/html/
        response.data.share_url = originalUrl.replace('/shared/pdf/', '/shared/html/');
      }
      return response;
    })
    .catch(error => {
      console.error('API: Error creating shareable HTML link:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },

  getDocuments: (params?: any) => {
    console.log('API: Fetching documents with params:', params);
    // Ensure we're only getting latest versions by default
    const queryParams = { 
      ...params,
      latest_only: params?.latest_only !== undefined ? params.latest_only : true
    };
    
    console.log('API: Final query params for documents request:', queryParams);
    console.log('API: Category param type:', typeof queryParams.category);
    
    return api.get('documents', { params: queryParams })
    .then(response => {
      console.log('API: Documents fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching documents:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  // Search documents with content - hybrid approach for scalability
  searchDocuments: (searchTerm: string, additionalParams?: any) => {
    console.log('API: Searching documents with term:', searchTerm);
    
    // Default limit to 100 documents for better performance
    const limit = additionalParams?.limit || 10;
    const page = additionalParams?.page || 1;
    
    // If search term is short (1-2 chars), use client-side filtering only
    // This prevents excessive server load for very short search terms
    const useClientSideOnly = searchTerm.length < 3;
    
    // Prepare query parameters
    const queryParams = { 
      ...additionalParams,
      latest_only: true,
      limit: limit,
      offset: (page - 1) * limit
    };
    
    // Helper function for client-side search
    function fallbackToClientSide() {
      console.log('API: Using client-side search with params:', queryParams);
      
      return api.get('documents', { params: queryParams })
        .then(response => {
          console.log('API: Documents fetched successfully for client-side filtering');
          
          // If we have a search term, filter the results client-side
          if (searchTerm && response.data.results) {
            const searchTermLower = searchTerm.toLowerCase();
            const allDocuments = response.data.results || [];
            
            console.log(`Filtering ${allDocuments.length} documents client-side`);
            
            // Filter documents that match the search term in title, content, or tags
            const filteredResults = allDocuments.filter((doc: any) => {
              // Search in title
              if (doc.title.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              
              // Search in plain_text content if available
              if (doc.plain_text && doc.plain_text.toLowerCase().includes(searchTermLower)) {
                return true;
              }
              
              // Search in tags
              if (doc.tags && Array.isArray(doc.tags) && 
                  doc.tags.some((tag: string) => tag.toLowerCase().includes(searchTermLower))) {
                return true;
              }
              
              return false;
            });
            
            console.log(`Found ${filteredResults.length} matching documents client-side`);
            
            // Return a modified response with the filtered results
            return {
              ...response,
              data: {
                ...response.data,
                results: filteredResults,
                count: filteredResults.length
              }
            };
          }
          
          return response;
        })
        .catch(error => {
          console.error('API: Error in client-side search:', error);
          throw error;
        });
    }
    
    // For longer search terms, add the search parameter for server-side filtering
    if (searchTerm && !useClientSideOnly) {
      // Try to use server-side search first
      try {
        // Add search parameter for server-side filtering
        queryParams.search = searchTerm;
        
        console.log('API: Using server-side search with params:', queryParams);
        
        return api.get('documents', { params: queryParams })
          .then(response => {
            console.log(`API: Server-side search returned ${response.data.results?.length || 0} results`);
            return response;
          })
          .catch(error => {
            // If server-side search fails, fall back to client-side
            console.error('API: Server-side search failed, falling back to client-side:', error);
            delete queryParams.search;
            return fallbackToClientSide();
          });
      } catch (error) {
        console.error('API: Error setting up server-side search, falling back to client-side:', error);
        return fallbackToClientSide();
      }
    } else {
      // For short search terms or when no search term is provided
      return fallbackToClientSide();
    }
  },
  
  // Get documents and filter by tag on the client side
  // This is a permanent solution for tag filtering that doesn't rely on the backend's tags__contains lookup
  getDocumentsByTag: async (tag: string, otherParams?: any) => {
    console.log('API: Fetching documents and filtering by tag:', tag);
    try {
      // Fetch all documents
      const response = await api.get('documents', { params: otherParams });
      
      console.log('API: Documents fetched successfully, filtering by tag');
      
      // Filter documents by tag on the client side
      const allDocuments = response.data.results || [];
      const filteredDocuments = allDocuments.filter((doc: any) => 
        doc.tags && Array.isArray(doc.tags) && doc.tags.includes(tag)
      );
      
      // Create a new response with the filtered documents
      const filteredResponse = {
        ...response,
        data: {
          ...response.data,
          results: filteredDocuments,
          count: filteredDocuments.length,
        }
      };
      
      console.log('API: Documents filtered by tag:', filteredResponse.data);
      return filteredResponse;
    } catch (error: any) {
      console.error('API: Error fetching documents by tag:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    }
  },
  
  getDocument: (slug: string, version?: string) => {
    console.log('API: Fetching document with slug:', slug, 'version:', version);
    return api.get(`documents/${slug}`, {
      params: {
        // Set latest_only to false to allow fetching non-latest versions
        latest_only: false,
        // Include version if provided
        ...(version && { version })
      }
    })
    .then(response => {
      console.log('API: Document fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching document:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  createDocument: (documentData: any) => {
    console.log('API: Creating document with data:', documentData);
    
    // Use the api instance with interceptors
    return api.post('documents', documentData, {
      timeout: 10000, // 10 seconds timeout
    })
    .then(response => {
      console.log('API: Document created successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error creating document:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
        console.error('API: Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('API: No response received:', error.request);
      } else {
        console.error('API: Error message:', error.message);
      }
      console.error('API: Error config:', error.config);
      throw error;
    });
  },
  
  updateDocument: (slug: string, documentData: any) => {
    console.log('API: Updating document with slug:', slug, 'data:', documentData);
    return api.patch(`documents/${slug}`, documentData, {
      timeout: 10000, // 10 seconds timeout
    })
    .then(response => {
      console.log('API: Document updated successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error updating document:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
        console.error('API: Error response headers:', error.response.headers);
      } else if (error.request) {
        console.error('API: No response received:', error.request);
      } else {
        console.error('API: Error message:', error.message);
      }
      console.error('API: Error config:', error.config);
      throw error;
    });
  },
  
  deleteDocument: (slug: string) => {
    console.log('API: Moving document to trash with slug:', slug);
    return api.delete(`documents/${slug}`)
    .then(response => {
      console.log('API: Document moved to trash successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error moving document to trash:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  getDeletedDocuments: () => {
    console.log('API: Fetching deleted documents');
    return api.get('documents', { 
      params: { 
        include_deleted: true,
        status: 'deleted'
      }
    })
    .then(response => {
      console.log('API: Deleted documents fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching deleted documents:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  getDocumentVersions: (slug: string) => {
    console.log('API: Fetching document versions with slug:', slug);
    return api.get(`documents/${slug}/versions`)
    .then(response => {
      console.log('API: Document versions fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching document versions:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  createDocumentVersion: (slug: string, data?: any) => {
    console.log('API: Creating new version of document with slug:', slug);
    return api.post(`documents/${slug}/create_version`, data)
    .then(response => {
      console.log('API: Document version created successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error creating document version:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  addComment: (slug: string, text: string, parentId?: number) => {
    console.log('API: Adding comment to document with slug:', slug);
    return api.post(`documents/${slug}/add_comment`, { text, parent: parentId })
    .then(response => {
      console.log('API: Comment added successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error adding comment:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  // Bulk operations
  bulkUpdateCategory: (documentIds: number[], categoryId: number | null) => {
    console.log('API: Bulk updating category for documents:', documentIds, 'to category:', categoryId);
    return api.post('documents/bulk/update-category', { 
      document_ids: documentIds,
      category: categoryId 
    })
    .then(response => {
      console.log('API: Documents category updated successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error updating documents category:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  bulkAddTags: (documentIds: number[], tags: string[]) => {
    console.log('API: Bulk adding tags to documents:', documentIds, 'tags:', tags);
    return api.post('documents/bulk/add-tags', { 
      document_ids: documentIds,
      tags: tags 
    })
    .then(response => {
      console.log('API: Tags added to documents successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error adding tags to documents:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  bulkUpdateStatus: (documentIds: number[], status: string) => {
    console.log('API: Bulk updating status for documents:', documentIds, 'to status:', status);
    return api.post('documents/bulk/update-status', { 
      document_ids: documentIds,
      status: status 
    })
    .then(response => {
      console.log('API: Documents status updated successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error updating documents status:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  bulkDelete: (documentIds: number[]) => {
    console.log('API: Bulk moving documents to trash:', documentIds);
    return api.post('documents/bulk/delete', { document_ids: documentIds })
    .then(response => {
      console.log('API: Documents moved to trash successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error moving documents to trash:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  bulkDeletePermanently: (documentIds: number[]) => {
    console.log('API: Bulk permanently deleting documents:', documentIds);
    return api.post('documents/bulk/delete-permanently', { document_ids: documentIds })
    .then(response => {
      console.log('API: Documents permanently deleted successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error permanently deleting documents:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  restoreDocument: (documentId: number) => {
    console.log('API: Restoring document from trash:', documentId);
    return api.post('documents/bulk/update-status', { 
      document_ids: [documentId],
      status: 'draft' 
    })
    .then(response => {
      console.log('API: Document restored successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error restoring document:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  formatWithAI: (content: string) => {
    console.log('API: Formatting document content with AI');
    return api.post('format-with-ai', { content })
    .then(response => {
      console.log('API: Document content formatted successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error formatting document content:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  exportPDF: (slug: string) => {
    console.log('API: Exporting document as PDF with slug:', slug);
    return api.get(`documents/${slug}/export_pdf`)
    .then(response => {
      console.log('API: Document data for PDF export fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching document data for PDF export:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  createPDFShare: (slug: string, options?: { expiration_type?: string, pin_protected?: boolean }) => {
    console.log('API: Creating shareable PDF link for document with slug:', slug, 'options:', options);
    return api.post(`documents/${slug}/create_pdf_share`, options)
    .then(response => {
      console.log('API: Shareable PDF link created successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error creating shareable PDF link:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  getPDFExports: () => {
    console.log('API: Fetching PDF exports');
    return api.get('pdf-exports')
    .then(response => {
      console.log('API: PDF exports fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching PDF exports:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  deletePDFExport: (id: number) => {
    console.log('API: Deleting PDF export with ID:', id);
    return api.delete(`pdf-exports/${id}`)
    .then(response => {
      console.log('API: PDF export deleted successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error deleting PDF export:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },

  generateDocumentWithAI: (data: {
    tags?: string[],
    category_filter?: string | number,
    document_category?: string | number,
    status?: string,
    generation_type?: string,
    document_type?: string,
    concept?: string,
    document_length?: string,
    title?: string,
    debug_mode?: boolean,
    analyze_style_only?: boolean,
    style_guide?: string
  }) => {
    console.log('API: Generating document with AI using data:', data);
    return api.post('documents/generate-with-ai', data, {
      timeout: 120000, // 120 seconds timeout for longer generations
    })
      .then(response => {
        console.log('API: Document generated successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error generating document:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        } else if (error.request) {
          console.error('API: No response received:', error.request);
        } else {
          console.error('API: Error message:', error.message);
        }
        console.error('API: Error config:', error.config);
        throw error;
      });
  },
  
  analyzeDocumentStyle: (data: {
    tags?: string[],
    category_filter?: string | number,
    status?: string,
    selected_document_ids?: number[],
    style_constraint_id?: number | null
  }) => {
    console.log('API: Analyzing document style with data:', data);
    
    // If we already have a style constraint ID, we can skip the analysis
    if (data.style_constraint_id) {
      console.log('API: Style constraint already exists with ID:', data.style_constraint_id);
      // Return a resolved promise with the style constraint ID
      return Promise.resolve({
        data: {
          style_constraint_id: data.style_constraint_id,
          message: "Style constraint already exists"
        }
      });
    }
    
    // Validate that we have documents selected
    if (!Array.isArray(data.selected_document_ids) || data.selected_document_ids.length === 0) {
      return Promise.reject({
        message: "Please select at least one document to use as a style reference."
      });
    }
    
    // Ensure selected_document_ids is always a valid array
    const validatedData = {
      ...data,
      selected_document_ids: data.selected_document_ids
    };
    
    // Add the analyze_style_only flag to the request
    const requestData = {
      ...validatedData,
      generation_type: 'new',
      analyze_style_only: true
    };
        
        return api.post('documents/generate-with-ai', requestData, {
          timeout: 60000, // 60 seconds timeout for style analysis
        })
      .then(response => {
        console.log('API: Document style analyzed successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error analyzing document style:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        } else if (error.request) {
          console.error('API: No response received:', error.request);
        } else {
          console.error('API: Error message:', error.message);
        }
        console.error('API: Error config:', error.config);
        throw error;
      });
  },
};

export const categoriesAPI = {
  getCategories: (params?: any) => {
    console.log('API: Fetching categories with params:', params);
    return api.get('categories', { params })
    .then(response => {
      console.log('API: Categories fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching categories:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  getCategoryTree: () => 
    api.get('categories/tree'),
  
  getCategory: (slug: string) => {
    console.log('API: Fetching category with slug:', slug);
    return api.get(`categories/${slug}`)
    .then(response => {
      console.log('API: Category fetched successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error fetching category:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  createCategory: (categoryData: any) => {
    console.log('API: Creating category with data:', categoryData);
    
    // Ensure organization is a number
    if (categoryData.organization && typeof categoryData.organization === 'string') {
      categoryData.organization = parseInt(categoryData.organization, 10);
    }
    
    // Create a clean payload with only the required fields
    const payload = {
      name: categoryData.name,
      description: categoryData.description || null,
      organization: categoryData.organization,
      color: categoryData.color || null,
    };
    
    console.log('API: Cleaned category payload:', payload);
    
    // Use the api instance with interceptors instead of direct axios call
    return api.post('categories', payload)
    .then(response => {
      console.log('API: Category created successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error creating category:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
        
        // Log more details for 500 errors
        if (error.response.status === 500) {
          console.error('API: Server error details:', error.response.data);
          console.error('API: Request that caused the error:', error.config);
        }
      } else if (error.request) {
        console.error('API: No response received:', error.request);
      } else {
        console.error('API: Error message:', error.message);
      }
      throw error;
    });
  },
  
  updateCategory: (slug: string, categoryData: any) => {
    console.log('API: Updating category with slug:', slug, 'data:', categoryData);
    return api.patch(`categories/${slug}`, categoryData)
    .then(response => {
      console.log('API: Category updated successfully:', response.data);
      return response;
    })
    .catch(error => {
      console.error('API: Error updating category:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  deleteCategory: (slug: string) => {
    console.log('API: Deleting category with slug:', slug);
    return api.delete(`categories/${slug}`)
    .then(response => {
      console.log('API: Category deleted successfully');
      return response;
    })
    .catch(error => {
      console.error('API: Error deleting category:', error);
      if (error.response) {
        console.error('API: Error response data:', error.response.data);
        console.error('API: Error response status:', error.response.status);
      }
      throw error;
    });
  },
  
  getCategoryDocuments: (slug: string, params?: any) => 
    api.get(`categories/${slug}/documents`, { params }),
};

export const tagsAPI = {
  getTags: (params?: any) => 
    api.get('tags', { params }),
  
  getTag: (slug: string) => 
    api.get(`tags/${slug}`),
  
  createTag: (tagData: any) => 
    api.post('tags', tagData),
  
  updateTag: (slug: string, tagData: any) => 
    api.patch(`tags/${slug}`, tagData),
  
  deleteTag: (slug: string) => 
    api.delete(`tags/${slug}`),
  
  getTagDocuments: (slug: string, params?: any) => 
    api.get(`tags/${slug}/documents`, { params }),
};

export const legalAPI = {
  getLegalDocument: (type: string) => {
    console.log(`API: Fetching ${type} document`);
    return api.get(`legal/document/${type}/`)
      .then(response => {
        console.log(`API: ${type} document fetched successfully:`, response.data);
        return response;
      })
      .catch(error => {
        console.error(`API: Error fetching ${type} document:`, error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  },
  
  getAllLegalDocuments: () => {
    console.log('API: Fetching all legal documents');
    return api.get('legal/documents/?latest=true')
      .then(response => {
        console.log('API: All legal documents fetched successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error fetching all legal documents:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  }
};

export const contactAPI = {
  sendContactForm: (formData: { name: string; email: string; subject: string; message: string }) => {
    console.log('API: Sending contact form submission:', formData);
    return api.post('contact/send-email/', formData)
      .then(response => {
        console.log('API: Contact form submitted successfully:', response.data);
        return response;
      })
      .catch(error => {
        console.error('API: Error submitting contact form:', error);
        if (error.response) {
          console.error('API: Error response data:', error.response.data);
          console.error('API: Error response status:', error.response.status);
        }
        throw error;
      });
  }
};

export default api;
