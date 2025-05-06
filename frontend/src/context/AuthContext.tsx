import { createContext, useContext, useState, useEffect, ReactNode, useCallback, useRef } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import { authAPI } from '@/utils/api';
import { User, AuthTokens, RegistrationData, RegistrationResponse } from '@/types/api';
import { jwtDecode } from 'jwt-decode';
import { debounce } from 'lodash';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (username: string, password: string, stayLoggedIn?: boolean) => Promise<void>;
  logout: () => void;
  register: (userData: RegistrationData) => Promise<any>;
  refreshUser: () => Promise<User | null | undefined>;
  refreshTokenIfNeeded: () => Promise<boolean>;
  showInactivityWarning?: boolean;
  resetInactivityTimer?: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [inactivityTimeout, setInactivityTimeout] = useState<number>(1800); // Default 30 minutes
  
  // Initialize from localStorage when component mounts (client-side only)
  useEffect(() => {
    // Check if we're in the browser environment
    if (typeof window !== 'undefined') {
      const savedTimeout = localStorage.getItem('inactivityTimeout');
      if (savedTimeout) {
        setInactivityTimeout(parseInt(savedTimeout, 10));
      }
    }
  }, []);
  const [showInactivityWarning, setShowInactivityWarning] = useState<boolean>(false);
  const inactivityTimerRef = useRef<NodeJS.Timeout | null>(null);
  const warningTimerRef = useRef<NodeJS.Timeout | null>(null);
  const router = useRouter();

  // Check if token is expired or about to expire (within 5 minutes)
  const isTokenExpired = (token: string, expirationBuffer = 0): boolean => {
    try {
      const decoded: any = jwtDecode(token);
      const currentTime = Date.now() / 1000;
      // Token is considered expired if it's actually expired or will expire within the buffer time
      return decoded.exp < (currentTime + expirationBuffer);
    } catch (error) {
      console.error('Error decoding token:', error);
      return true;
    }
  };

  // Function to refresh the token
  const refreshTokenIfNeeded = useCallback(async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return false;
    }
    
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // If no tokens, we can't refresh
      if (!token || !refreshToken) {
        return false;
      }
      
      // Check if token is about to expire (within 5 minutes)
      const bufferTimeInSeconds = 5 * 60; // 5 minutes
      if (isTokenExpired(token, bufferTimeInSeconds)) {
        console.log('Token is about to expire, refreshing...');
        
        // Refresh the token
        const response = await authAPI.refreshToken(refreshToken);
        const { access } = response.data;
        
        // Save the new token
        localStorage.setItem('token', access);
        console.log('Token refreshed successfully');
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, clear storage and log out
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
      }
      setUser(null);
      return false;
    }
  }, []);

  // Load user from local storage on initial load
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      setIsLoading(false);
      return;
    }
    
    const loadUser = async () => {
      try {
        // Check if we're returning from a Stripe redirect
        const url = window.location.href;
        const isStripeRedirect = url.includes('subscription') && (url.includes('success=true') || url.includes('canceled=true'));
        
        if (isStripeRedirect) {
          console.log('AuthContext: Detected return from Stripe redirect, ensuring authentication persistence');
        }
        
        const token = localStorage.getItem('token');
        
        if (!token || isTokenExpired(token)) {
          // If no token or expired token, try to refresh
          console.log('AuthContext: Token missing or expired, attempting to refresh');
          const refreshed = await refreshTokenIfNeeded();
          
          if (!refreshed) {
            // If refresh failed, clear storage and set as not authenticated
            console.log('AuthContext: Token refresh failed, logging out');
            localStorage.removeItem('token');
            localStorage.removeItem('refreshToken');
            setUser(null);
            setIsLoading(false);
            return;
          } else {
            console.log('AuthContext: Token refreshed successfully');
          }
        }
        
        // Token exists and is valid, fetch user profile
        console.log('AuthContext: Fetching user profile');
        const response = await authAPI.getProfile();
        console.log('AuthContext: Initial user profile load:', response.data);
        setUser(response.data);
      } catch (error) {
        console.error('AuthContext: Error loading user:', error);
        // If error fetching user, clear storage
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUser();
  }, [refreshTokenIfNeeded]);
  
  // Set up periodic token refresh
  useEffect(() => {
    // Only set up refresh interval if user is authenticated
    if (!user) return;
    
    console.log('Setting up token refresh interval');
    
    // Check token every minute
    const refreshInterval = setInterval(() => {
      refreshTokenIfNeeded().catch(error => {
        console.error('Error in token refresh interval:', error);
      });
    }, 60 * 1000); // 1 minute
    
    // Clean up interval on unmount
    return () => {
      console.log('Clearing token refresh interval');
      clearInterval(refreshInterval);
    };
  }, [user, refreshTokenIfNeeded]);

  // Refresh user data
  const refreshUser = async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      
      // If we don't have any tokens, we can't refresh the user
      if (!token && !refreshToken) {
        console.log('No authentication tokens found, cannot refresh user profile');
        setUser(null);
        return;
      }
      
      if (!token || isTokenExpired(token)) {
        // If no token or expired token, try to refresh
        console.log('Token expired or missing, attempting to refresh before fetching user profile');
        
        if (!refreshToken) {
          console.log('No refresh token available, cannot refresh user profile');
          localStorage.removeItem('token');
          setUser(null);
          return;
        }
        
        try {
          // Try to refresh the token directly
          console.log('Attempting to refresh token directly...');
          const response = await authAPI.refreshToken(refreshToken);
          const { access } = response.data;
          
          // Save the new token
          localStorage.setItem('token', access);
          console.log('Token refreshed successfully');
        } catch (refreshError) {
          console.error('Error refreshing token:', refreshError);
          
          // If refresh fails, clear storage and set as not authenticated
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          setUser(null);
          return;
        }
      }
      
      // At this point, we should have a valid token
      // Fetch user profile
      console.log('Refreshing user profile...');
      const response = await authAPI.getProfile();
      console.log('User profile API response:', response.data);
      
      setUser(response.data);
      console.log('User profile refreshed successfully');
      return response.data;
    } catch (error) {
      console.error('Error refreshing user profile:', error);
      
      // If there's an error, try one more time with a fresh token
      try {
        const refreshToken = localStorage.getItem('refreshToken');
        
        if (!refreshToken) {
          console.log('No refresh token available for second attempt');
          localStorage.removeItem('token');
          setUser(null);
          return;
        }
        
        // Try to refresh the token directly
        console.log('Second attempt: Refreshing token directly...');
        const tokenResponse = await authAPI.refreshToken(refreshToken);
        const { access } = tokenResponse.data;
        
        // Save the new token
        localStorage.setItem('token', access);
        console.log('Token refreshed successfully on second attempt');
        
        // Try to fetch user profile again
        console.log('Second attempt: Fetching user profile...');
        const userResponse = await authAPI.getProfile();
        setUser(userResponse.data);
        console.log('User profile refreshed successfully on second attempt');
        return userResponse.data;
      } catch (secondError) {
        console.error('Error in second attempt to refresh user profile:', secondError);
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        setUser(null);
        return null;
      }
    }
  };

  // Login function
  const login = async (username: string, password: string, stayLoggedIn = false) => {
    setIsLoading(true);
    try {
      console.log('Attempting to login with username:', username);
      
      // Use the API utility for login
      const tokenResponse = await authAPI.login(username, password);
      
      const { access, refresh } = tokenResponse.data as AuthTokens;
      console.log('Login successful, received tokens');
      
      // Save tokens to local storage (client-side only)
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', access);
        localStorage.setItem('refreshToken', refresh);
        
        // Save stay logged in preference
        if (stayLoggedIn) {
          localStorage.setItem('stayLoggedIn', 'true');
          console.log('Stay logged in preference saved');
        } else {
          localStorage.removeItem('stayLoggedIn');
        }
      }
      
      // Get user profile using the API utility
      console.log('Fetching user profile after login');
      const userResponse = await authAPI.getProfile();
      
      setUser(userResponse.data);
      console.log('User profile loaded successfully');
      
      // Reset inactivity timer after successful login
      setTimeout(() => {
        console.log('Initializing inactivity timer after login');
        if (resetInactivityTimer) {
          resetInactivityTimer();
        }
      }, 1000);
      
      // Redirect to dashboard using replace to avoid navigation issues
      router.replace('/dashboard');
    } catch (error) {
      console.error('Login error:', error);
      
      // Enhanced error logging
      if (axios.isAxiosError(error) && error.response) {
        console.error('Login error details:', {
          status: error.response.status,
          data: error.response.data
        });
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = () => {
    // Only access localStorage on client side
    if (typeof window !== 'undefined') {
      // First clear auth data
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('stayLoggedIn');
      
      // Set user to null
      setUser(null);
      
      // Use window.location for a full page navigation instead of Next.js router
      // This avoids the "Cancel rendering route" error by completely bypassing the Next.js router
      window.location.href = '/login';
    }
  };
  
  // Reset inactivity timer function
  const resetInactivityTimer = useCallback(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    // Clear existing timers
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    if (warningTimerRef.current) {
      clearTimeout(warningTimerRef.current);
      warningTimerRef.current = null;
    }
    
    // Hide warning if it's showing
    setShowInactivityWarning(false);
    
    // If inactivity timeout is 0 (disabled) or user has "stay logged in" enabled, don't set timers
    const stayLoggedIn = localStorage.getItem('stayLoggedIn') === 'true';
    if (inactivityTimeout === 0 || stayLoggedIn) {
      return;
    }
    
    // Set warning timer (2 minutes before logout)
    const warningTime = inactivityTimeout - 120; // 2 minutes before timeout
    if (warningTime > 0) {
      warningTimerRef.current = setTimeout(() => {
        setShowInactivityWarning(true);
      }, warningTime * 1000);
    }
    
    // Set logout timer - using a separate function to avoid closure issues
    const performLogout = () => {
      console.log('Auto-logout timer triggered after inactivity');
      logout();
    };
    
    // Set logout timer
    inactivityTimerRef.current = setTimeout(performLogout, inactivityTimeout * 1000);
  }, [inactivityTimeout, logout]);
  
  // Listen for changes to inactivityTimeout in localStorage
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined') {
      return;
    }
    
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'inactivityTimeout' && e.newValue) {
        setInactivityTimeout(parseInt(e.newValue, 10));
        // Reset the timer with the new timeout
        resetInactivityTimer();
      }
    };
    
    window.addEventListener('storage', handleStorageChange);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [resetInactivityTimer]);
  
  // Type for debounced function with cancel method
  type DebouncedFunction = {
    (): void;
    cancel: () => void;
  };
  
  // Create a debounced version of the activity handler
  const debouncedActivityHandler = useRef<DebouncedFunction | null>(null);

  // Set up activity listeners
  useEffect(() => {
    // Only run on client side
    if (typeof window === 'undefined' || !user) return;
    
    console.log('Setting up inactivity timer with timeout:', inactivityTimeout, 'seconds');
    
    // Reset timer initially
    resetInactivityTimer();
    
    // Create a debounced activity handler if it doesn't exist
    if (!debouncedActivityHandler.current) {
      debouncedActivityHandler.current = debounce(() => {
        resetInactivityTimer();
      }, 300); // 300ms debounce
    }
    
    // Set up event listeners for user activity
    const activityEvents = ['mousedown', 'keypress', 'scroll', 'touchstart'];
    const mouseMoveEvents = ['mousemove']; // Handle mousemove separately with more aggressive debouncing
    
    const handleUserActivity = () => {
      // Don't log every activity event to avoid console spam
      const eventName = window.event ? window.event.type : 'unknown';
      if (eventName !== 'mousemove') {
        console.log('User activity detected:', eventName);
      }
      
      // Use the debounced handler
      if (debouncedActivityHandler.current) {
        debouncedActivityHandler.current();
      }
    };
    
    // Add event listeners
    activityEvents.forEach(event => {
      window.addEventListener(event, handleUserActivity);
    });
    
    // Add mousemove with a more aggressive debounce
    const handleMouseMove: DebouncedFunction = debounce(() => {
      if (debouncedActivityHandler.current) {
        debouncedActivityHandler.current();
      }
    }, 1000); // 1 second debounce for mousemove
    
    mouseMoveEvents.forEach(event => {
      window.addEventListener(event, handleMouseMove);
    });
    
    // Clean up
    return () => {
      console.log('Cleaning up inactivity timer event listeners');
      
      // Remove event listeners
      activityEvents.forEach(event => {
        window.removeEventListener(event, handleUserActivity);
      });
      
      mouseMoveEvents.forEach(event => {
        window.removeEventListener(event, handleMouseMove);
      });
      
      // Cancel debounced functions
      if (debouncedActivityHandler.current && typeof debouncedActivityHandler.current.cancel === 'function') {
        debouncedActivityHandler.current.cancel();
      }
      
      handleMouseMove.cancel();
      
      // Clear timers
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
      }
      if (warningTimerRef.current) {
        clearTimeout(warningTimerRef.current);
      }
    };
  }, [user, resetInactivityTimer, inactivityTimeout]);

  // Register function
  const register = async (userData: RegistrationData) => {
    setIsLoading(true);
    try {
      // Log the registration data for debugging
      console.log('AuthContext: Registering with data:', userData);
      
      // Register user - no need to format organization as it's already a string
      const response = await authAPI.register(userData);
      console.log('AuthContext: Registration response:', response.data);
      
      // Return the response data instead of auto-login
      // This allows the registration page to show a verification message
      return response.data;
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Log more details about the error
      if (error.response) {
        console.error('Error response:', {
          data: error.response.data,
          status: error.response.status,
          headers: error.response.headers
        });
      } else if (error.request) {
        console.error('Error request:', error.request);
      } else {
        console.error('Error message:', error.message);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const value = {
    user,
    isLoading,
    isAuthenticated: !!user,
    login,
    logout,
    register,
    refreshUser,
    refreshTokenIfNeeded,
    showInactivityWarning,
    resetInactivityTimer,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
