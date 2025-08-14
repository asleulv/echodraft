import axios from "axios";
import {
  AuthTokens,
  RegistrationData,
  RegistrationResponse,
  User,
} from "@/types/api";

// Get the API URL from environment or use a default
const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://192.168.86.33:8000";
const API_BASE_PATH = "/api/v1/";

// Create an axios instance with default config
const api = axios.create({
  baseURL: `${API_URL}${API_BASE_PATH}`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000, // 15 seconds timeout
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
  (config) => {
    // Only run on client side
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");

      if (token && token !== "google_oauth_authenticated") {
        config.headers.Authorization = `Bearer ${token}`;
      }
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
        const refreshToken = localStorage.getItem("refreshToken");
        if (!refreshToken) {
          throw new Error("No refresh token available");
        }

        const response = await axios.post(
          `${API_URL}${API_BASE_PATH}auth/token/refresh/`,
          {
            refresh: refreshToken,
          }
        );

        const { access } = response.data;

        // Save the new token
        localStorage.setItem("token", access);

        // Update the original request with the new token
        originalRequest.headers.Authorization = `Bearer ${access}`;

        // Retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If refresh fails, log out the user
        localStorage.removeItem("token");
        localStorage.removeItem("refreshToken");
        localStorage.removeItem("user");

        // Redirect to login page using replace to avoid navigation issues
        window.location.replace("/login");

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// API functions
export const authAPI = {
  login: (username: string, password: string) =>
    api.post<AuthTokens>("auth/token/", { username, password }),

  requestPasswordReset: (email: string) =>
    api.post("password-reset/", { email }),

  confirmPasswordReset: (uid: string, token: string, newPassword: string) =>
    api.post("password-reset/confirm/", {
      uid,
      token,
      new_password: newPassword,
    }),

  register: (userData: RegistrationData) => {
    // Create a simplified registration payload
    const payload = {
      username: userData.username,
      email: userData.email,
      password: userData.password,
      password_confirm: userData.password_confirm,
      organization: userData.organization,
      role: userData.role || "admin",
      first_name: userData.first_name || "",
      last_name: userData.last_name || "",
    };

    return api.post<RegistrationResponse>("register/", payload, {
      timeout: 10000, // 10 seconds timeout
    });
  },

  refreshToken: (refreshToken: string) =>
    api.post<{ access: string }>("auth/token/refresh/", {
      refresh: refreshToken,
    }),

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
      return Promise.resolve({
        data: authAPI._userProfileCache.data,
        status: 200,
        statusText: "OK",
        headers: {},
        config: {} as any,
      });
    }

    // If there's already a pending request, return that promise
    if (authAPI._userProfileCache.pendingPromise) {
      return authAPI._userProfileCache.pendingPromise;
    }

    // Create a new request
    const promise = api
      .get<User>("users/me/")
      .then((response) => {
        // Update the cache
        authAPI._userProfileCache.data = response.data;
        authAPI._userProfileCache.timestamp = Date.now();
        authAPI._userProfileCache.pendingPromise = null;

        return response;
      })
      .catch((error) => {
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
  getStyleConstraints: (params?: any) =>
    api.get("style-constraints", { params }),

  getStyleConstraint: (id: number) => api.get(`style-constraints/${id}`),

  createStyleConstraint: (data: any) => api.post("style-constraints", data),

  updateStyleConstraint: (id: number, data: any) =>
    api.patch(`style-constraints/${id}`, data),

  deleteStyleConstraint: (id: number) => api.delete(`style-constraints/${id}`),

  getReferenceDocuments: (id: number) =>
    api.get(`style-constraints/${id}/reference_documents`),
};

// Proper Export API Architecture
export const exportAPI = {
  // Create export from document and get data in one call
  createFromDocument: async (
    documentIdentifier: string | number,
    options: {
      expiration_type?: string;
      pin_protected?: boolean;
    } = {}
  ) => {
    const response = await api.post("/pdf-exports/create-from-document/", {
      [typeof documentIdentifier === "number"
        ? "document_id"
        : "document_slug"]: documentIdentifier,
      ...options,
    });
    return response.data;
  },

  // Get existing export data
  getExportData: async (exportId: number) => {
    const response = await api.get(`/pdf-exports/${exportId}/export_pdf`);
    return response.data;
  },

  // List user's exports
  listExports: async () => {
    const response = await api.get("/pdf-exports");
    return response.data;
  },

  // Delete export
  deleteExport: (id: number) => api.delete(`pdf-exports/${id}`),
};

export const documentsAPI = {
  // Updated to use proper export architecture
  exportHTML: async (slug: string) => {
    try {
      const exportData = await exportAPI.createFromDocument(slug, {
        expiration_type: "never",
        pin_protected: false,
      });
      return { data: exportData };
    } catch (error) {
      throw error;
    }
  },

  // Updated to use proper export architecture for sharing
  createHTMLShare: async (
    slug: string,
    options?: { expiration_type?: string; pin_protected?: boolean }
  ) => {
    try {
      const exportData = await exportAPI.createFromDocument(slug, options);

      // Modify the response to use the HTML viewer path
      if (
        exportData &&
        exportData.export_details &&
        exportData.export_details.share_url
      ) {
        exportData.export_details.share_url =
          exportData.export_details.share_url.replace(
            "/shared/pdf/",
            "/shared/html/"
          );
      }

      return { data: exportData };
    } catch (error) {
      throw error;
    }
  },

  getDocuments: (params?: any) => {
    // Ensure we're only getting latest versions by default
    const queryParams = {
      ...params,
      latest_only:
        params?.latest_only !== undefined ? params.latest_only : true,
    };

    return api.get("documents", { params: queryParams });
  },

  searchDocuments: (searchTerm: string, additionalParams?: any) => {
    const limit = additionalParams?.limit || 100;
    const page = additionalParams?.page || 1;

    const queryParams = {
      search: searchTerm,
      latest_only: true,
      limit: limit,
      offset: (page - 1) * limit,
      ...additionalParams,
    };


    return api.get("documents", { params: queryParams }).then((response) => {

      const documents = response.data.results || response.data.documents || [];
      const totalCount =
        response.data.count || response.data.total || documents.length;

      // Transform Django response to match expected format
      return {
        ...response,
        data: {
          results: documents,
          count: totalCount,
          documents: documents, // For backward compatibility
          totalCount: totalCount, // For backward compatibility
          ...response.data,
        },
      };
    });
  },

  // Get documents and filter by tag on the client side
  getDocumentsByTag: async (tag: string, otherParams?: any) => {
    try {
      // Fetch all documents
      const response = await api.get("documents", { params: otherParams });

      // Filter documents by tag on the client side
      const allDocuments = response.data.results || [];
      const filteredDocuments = allDocuments.filter(
        (doc: any) =>
          doc.tags && Array.isArray(doc.tags) && doc.tags.includes(tag)
      );

      // Create a new response with the filtered documents
      const filteredResponse = {
        ...response,
        data: {
          ...response.data,
          results: filteredDocuments,
          count: filteredDocuments.length,
        },
      };

      return filteredResponse;
    } catch (error: any) {
      throw error;
    }
  },

  getDocument: (slug: string, version?: string) => {
    return api.get(`documents/${slug}`, {
      params: {
        // Set latest_only to false to allow fetching non-latest versions
        latest_only: false,
        // Include version if provided
        ...(version && { version }),
      },
    });
  },

  createDocument: (documentData: any) => {
    return api.post("documents/", documentData, {
      timeout: 10000, // 10 seconds timeout
    });
  },

  updateDocument: (slug: string, documentData: any) => {
    return api.patch(`documents/${slug}/`, documentData, {
      timeout: 10000, // 10 seconds timeout
    });
  },

  deleteDocument: (slug: string) => api.delete(`documents/${slug}`),

  getDeletedDocuments: () => {
    return api.get("documents", {
      params: {
        include_deleted: true,
        status: "deleted",
      },
    });
  },

  getDocumentVersions: (slug: string) => api.get(`documents/${slug}/versions`),

  createDocumentVersion: (slug: string, data?: any) =>
    api.post(`documents/${slug}/create_version/`, data),

  addComment: (slug: string, text: string, parentId?: number) =>
    api.post(`documents/${slug}/add_comment/`, { text, parent: parentId }),

  // Bulk operations
  bulkUpdateCategory: (documentIds: number[], categoryId: number | null) =>
    api.post("documents/bulk/update-category/", {
      document_ids: documentIds,
      category: categoryId,
    }),

  bulkAddTags: (documentIds: number[], tags: string[]) =>
    api.post("documents/bulk/add-tags/", {
      document_ids: documentIds,
      tags: tags,
    }),

  bulkUpdateStatus: (documentIds: number[], status: string) =>
    api.post("documents/bulk/update-status/", {
      document_ids: documentIds,
      status: status,
    }),

  bulkDelete: (documentIds: number[]) =>
    api.post("documents/bulk/delete/", { document_ids: documentIds }),

  bulkDeletePermanently: (documentIds: number[]) =>
    api.post("documents/bulk/delete-permanently/", {
      document_ids: documentIds,
    }),

  restoreDocument: (documentId: number) =>
    api.post("documents/bulk/update-status/", {
      document_ids: [documentId],
      status: "draft",
    }),

  formatWithAI: (content: string) => api.post("format-with-ai", { content }),

  // Updated to use proper export architecture
  exportPDF: async (slug: string) => {
    try {
      const exportData = await exportAPI.createFromDocument(slug, {
        expiration_type: "never",
        pin_protected: false,
      });
      return { data: exportData };
    } catch (error) {
      throw error;
    }
  },

  // Updated to use proper export architecture
  createPDFShare: async (
    slug: string,
    options?: { expiration_type?: string; pin_protected?: boolean }
  ) => {
    try {
      const exportData = await exportAPI.createFromDocument(slug, options);
      return { data: exportData };
    } catch (error) {
      throw error;
    }
  },

  // Deprecated - use exportAPI.listExports() instead
  getPDFExports: () => exportAPI.listExports(),

  // Deprecated - use exportAPI.deleteExport() instead
  deletePDFExport: (id: number) => exportAPI.deleteExport(id),

  generateDocumentWithAI: (data: {
    tags?: string[];
    category_filter?: string | number;
    document_category?: string | number;
    status?: string;
    generation_type?: string;
    document_type?: string;
    concept?: string;
    document_length?: string;
    title?: string;
    debug_mode?: boolean;
    analyze_style_only?: boolean;
    style_guide?: string;
  }) => {
    return api.post("documents/generate-with-ai", data, {
      timeout: 120000, // 120 seconds timeout for longer generations
    });
  },

  analyzeDocumentStyle: (data: {
    tags?: string[];
    category_filter?: string | number;
    status?: string;
    selected_document_ids?: number[];
    style_constraint_id?: number | null;
  }) => {
    // If we already have a style constraint ID, we can skip the analysis
    if (data.style_constraint_id) {
      // Return a resolved promise with the style constraint ID
      return Promise.resolve({
        data: {
          style_constraint_id: data.style_constraint_id,
          message: "Style constraint already exists",
        },
      });
    }

    // Validate that we have documents selected
    if (
      !Array.isArray(data.selected_document_ids) ||
      data.selected_document_ids.length === 0
    ) {
      return Promise.reject({
        message:
          "Please select at least one document to use as a style reference.",
      });
    }

    // Ensure selected_document_ids is always a valid array
    const validatedData = {
      ...data,
      selected_document_ids: data.selected_document_ids,
    };

    // Add the analyze_style_only flag to the request
    const requestData = {
      ...validatedData,
      generation_type: "new",
      analyze_style_only: true,
    };

    return api.post("documents/generate-with-ai", requestData, {
      timeout: 60000, // 60 seconds timeout for style analysis
    });
  },
};

export const categoriesAPI = {
  getCategories: (params?: any) => api.get("categories", { params }),

  getCategoryTree: () => api.get("categories/tree"),

  getCategory: (slug: string) => api.get(`categories/${slug}`),

  createCategory: (categoryData: any) => {
    // Ensure organization is a number
    if (
      categoryData.organization &&
      typeof categoryData.organization === "string"
    ) {
      categoryData.organization = parseInt(categoryData.organization, 10);
    }

    // Create a clean payload with only the required fields
    const payload = {
      name: categoryData.name,
      description: categoryData.description || null,
      organization: categoryData.organization,
      color: categoryData.color || null,
    };

    // Use the api instance with interceptors instead of direct axios call
    return api.post("categories", payload);
  },

  updateCategory: (slug: string, categoryData: any) =>
    api.patch(`categories/${slug}`, categoryData),

  deleteCategory: (slug: string) => api.delete(`categories/${slug}`),

  getCategoryDocuments: (slug: string, params?: any) =>
    api.get(`categories/${slug}/documents`, { params }),
};

export const tagsAPI = {
  getTags: (params?: any) => api.get("tags", { params }),

  getTag: (slug: string) => api.get(`tags/${slug}`),

  createTag: (tagData: any) => api.post("tags", tagData),

  updateTag: (slug: string, tagData: any) => api.patch(`tags/${slug}`, tagData),

  deleteTag: (slug: string) => api.delete(`tags/${slug}`),

  getTagDocuments: (slug: string, params?: any) =>
    api.get(`tags/${slug}/documents`, { params }),
};

export const legalAPI = {
  getLegalDocument: (type: string) => api.get(`legal/document/${type}/`),

  getAllLegalDocuments: () => api.get("legal/documents/?latest=true"),
};

export const contactAPI = {
  sendContactForm: (formData: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => api.post("contact/send-email/", formData),
};

export default api;
