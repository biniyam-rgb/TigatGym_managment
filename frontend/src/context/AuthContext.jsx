import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { AuthContext } from './AuthContextCore';

const USER_STORAGE_KEY = 'gymcore_user';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const cached = localStorage.getItem(USER_STORAGE_KEY);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  });
  const [token, setTokenState] = useState(() => apiClient.getToken());
  // Instantly unblock page load if cached user already exists
  const [isLoading, setIsLoading] = useState(() => {
    const hasToken = Boolean(apiClient.getToken());
    const hasCachedUser = Boolean(localStorage.getItem(USER_STORAGE_KEY));
    return hasToken && !hasCachedUser;
  });

  const clearAuth = useCallback(() => {
    apiClient.clearToken();
    try {
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem('gymcore_reception_cache');
    } catch {
      // ignore
    }
    setTokenState(null);
    setUser(null);
  }, []);

  // Restore authenticated session on page load
  const restoreSession = useCallback(async () => {
    const storedToken = apiClient.getToken();
    if (!storedToken) {
      clearAuth();
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.getMe();
      if (response && response.user) {
        setUser(response.user);
        try {
          localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
        } catch {
          // ignore
        }
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch (err) {
      console.warn('Session restoration failed or token expired:', err.message);
      clearAuth();
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth]);

  useEffect(() => {
    let ignore = false;

    const storedToken = apiClient.getToken();
    if (storedToken) {
      apiClient.getMe()
        .then((response) => {
          if (!ignore && response?.user) {
            setUser(response.user);
            try {
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
            } catch {
              // ignore
            }
          }
        })
        .catch((err) => {
          if (!ignore) {
            console.warn('Session init failed:', err.message);
            clearAuth();
          }
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }

    // Listen for automatic 401 unauthorized events from apiClient
    const handleUnauthorized = () => {
      clearAuth();
    };

    window.addEventListener('gymcore:unauthorized', handleUnauthorized);
    return () => {
      ignore = true;
      window.removeEventListener('gymcore:unauthorized', handleUnauthorized);
    };
  }, [clearAuth]);

  const login = async (email, password) => {
    const response = await apiClient.login({ email, password });
    if (response?.token && response?.user) {
      apiClient.setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
      try {
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(response.user));
      } catch {
        // ignore
      }
      return response;
    }
    throw new Error('Unexpected login response format');
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (err) {
      console.warn('Logout API call failed, clearing client state anyway:', err);
    } finally {
      clearAuth();
    }
  };

  const changePassword = async (current_password, new_password, new_password_confirmation) => {
    return apiClient.changePassword({
      current_password,
      new_password,
      new_password_confirmation,
    });
  };

  const hasRole = (roleName) => {
    if (!user || !user.role_names) return false;
    return user.role_names.includes(roleName);
  };

  const hasAnyRole = (roles = []) => {
    if (!user || !user.role_names) return false;
    return roles.some((r) => user.role_names.includes(r));
  };

  const primaryRole = user?.primary_role || (user?.role_names?.[0] ?? 'guest');

  const value = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    isLoading,
    login,
    logout,
    changePassword,
    hasRole,
    hasAnyRole,
    primaryRole,
    refreshUser: restoreSession,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export default AuthProvider;
