import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import fetchWithAuth from '../lib/apiClient';
import { logDebug, logError } from '../utils/logger';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const usePermissions = () => {
  const { user } = useAuth();
  
  const hasPermission = (permission) => {
    if (!user || !user.role) return false;
    
    // Define role-based permissions
    const rolePermissions = {
      admin: ['canManageUsers', 'canViewReports', 'canManageAnimals', 'canManageHealth'],
      manager: ['canViewReports', 'canManageAnimals', 'canManageHealth'],
      user: ['canViewAnimals', 'viewHealthRecords']
    };
    
    return rolePermissions[user.role]?.includes(permission) || false;
  };
  
  return { hasPermission };
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Helper function to validate JWT token locally
  const isTokenValid = (token) => {
    if (!token) return false;
    try {
      // Decode the token
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const decodedToken = JSON.parse(atob(base64));
      
      // Check if token is expired
      const currentTime = Date.now() / 1000;
      return decodedToken.exp > currentTime;
    } catch (e) {
      console.error('Error validating token:', e);
      return false;
    }
  };

  // Load user from localStorage on initial load and validate token
  useEffect(() => {
    const validateAuth = async () => {
      logDebug('Starting auth validation');
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');
      const userData = localStorage.getItem('user');
      
      logDebug('Auth state from storage', {
        hasToken: !!token,
        hasRefreshToken: !!refreshToken,
        hasUserData: !!userData
      });
      
      if (token && refreshToken && userData) {
        try {
          logDebug('Validating token...');
          if (isTokenValid(token)) {
            const user = JSON.parse(userData);
            logDebug('Token valid, setting user', { userId: user._id, email: user.email });
            setUser(user);
            // No subscription check needed
          } else {
            logDebug('Token invalid or expired');
            throw new Error('Token expired');
          }
        } catch (error) {
          logError('Auth validation error:', error);
          // Clear invalid auth data
          logDebug('Clearing invalid auth data');
          localStorage.removeItem('token');
          localStorage.removeItem('refreshToken');
          localStorage.removeItem('user');
          setUser(null);
        }
      } else {
        logDebug('No valid auth data found, clearing any partial state');
        // Clear any partial auth state
        localStorage.removeItem('token');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
      }
      logDebug('Auth validation complete, setting loading to false');
      setLoading(false);
    };

    validateAuth();
  }, []);

  // Login function
  const login = async (credentials) => {
    setLoading(true);
    setError(null);
    const { redirect, ...loginCredentials } = credentials;
    logDebug('Login attempt', { 
      username: loginCredentials.username,
      redirect: redirect || 'none'
    });
    
    try {
      const response = await fetchWithAuth('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginCredentials),
      });

      const data = await response.json();
      logDebug('Login response', { 
        status: response.status,
        hasToken: !!(data.token && data.refreshToken)
      });

      if (response.ok && data.token && data.refreshToken && data.user) {
        // Store tokens and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        logDebug('User logged in', { 
          userId: data.user._id,
          username: data.user.username,
          role: data.user.role,
          redirect: redirect || 'default'
        });
        
        // Update state
        setUser(data.user);
        
        return { 
          success: true, 
          user: data.user,
          redirect: redirect // Pass the redirect URL back to the component
        };
      } else {
        const errorMsg = data.message || 'Login failed';
        logError('Login failed', {
          status: response.status,
          message: errorMsg,
          response: data
        });
        throw new Error(errorMsg);
      }
    } catch (error) {
      logError('Login error', {
        message: error.message,
        stack: error.stack,
        credentials: { username: credentials.username }
      });
      setError(error.message || 'Failed to log in');
      return { 
        success: false, 
        message: error.message || 'Failed to log in' 
      };
    } finally {
      setLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      // Call the logout endpoint to invalidate the refresh token
      if (user?._id) {
        await fetchWithAuth('/auth/logout', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({ userId: user._id })
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear auth state regardless of server response
      localStorage.removeItem('token');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
      setUser(null);
    }
  };

  // Register function
  const register = async (userData) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetchWithAuth('/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...userData,
          farmTypes: Array.isArray(userData.farmTypes) 
            ? userData.farmTypes 
            : (userData.farmType ? [userData.farmType] : []),
          primaryFarmType: userData.primaryFarmType || 
            (Array.isArray(userData.farmTypes) && userData.farmTypes[0]) || 
            userData.farmType || 'goat'
        }),
      });

      const data = await response.json();

      if (response.ok && data.token && data.refreshToken && data.user) {
        // Store tokens and user data
        localStorage.setItem('token', data.token);
        localStorage.setItem('refreshToken', data.refreshToken);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        setUser(data.user);
        return { success: true };
      } else {
        throw new Error(data.message || 'Registration failed');
      }
    } catch (error) {
      console.error('Registration error:', error);
      setError(error.message || 'Failed to register');
      return { success: false, message: error.message || 'Failed to register' };
    } finally {
      setLoading(false);
    }
  };

  // Check if user is authenticated
  const isAuthenticated = () => {
    return !!user;
  };

  // Check if user has specific role
  const hasRole = (role) => {
    return user?.role === role;
  };

  // Check if user has any of the specified roles
  const hasAnyRole = (roles) => {
    return roles.includes(user?.role);
  };

  // Check if user has access to a specific farm type
  const hasAccess = (farmType) => {
    return user?.farmTypes?.includes(farmType) || false;
  };

  // Check if current user has a specific permission
  const hasPermission = (permission) => {
    return user?.permissions?.[permission] === true;
  };

  // Get user's farm types
  const getUserFarmTypes = () => {
    return user?.farmTypes || [];
  };

  // Get current user's primary farm type
  const getPrimaryFarmType = () => {
    return user?.primaryFarmType || 'goat';
  };
  
  // Refresh authentication token
  const refreshAuthToken = async () => {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) return null;
    
    try {
      const response = await fetch('/api/auth/refresh-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken })
      });
      
      const data = await response.json();
      if (response.ok && data.token) {
        localStorage.setItem('token', data.token);
        return data.token;
      }
      return null;
    } catch (error) {
      console.error('Error refreshing token:', error);
      return null;
    }
  };

  // Context value
  const value = {
    user,
    loading,
    error,
    login,
    logout,
    refreshToken: refreshAuthToken,
    hasPermission,
    isAuthenticated: !!user,
    getPrimaryFarmType
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export default AuthContext;