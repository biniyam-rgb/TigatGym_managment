import { useState, useEffect, useCallback } from 'react';
import apiClient from '../services/api';
import { AuthContext } from './AuthContextCore';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(() => apiClient.getToken());
  const [isLoading, setIsLoading] = useState(() => !!apiClient.getToken());

  // Restore authenticated session on page load
  const restoreSession = useCallback(async () => {
    const storedToken = apiClient.getToken();
    if (!storedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    try {
      const response = await apiClient.getMe();
      if (response && response.user) {
        setUser(response.user);
      } else {
        throw new Error('Invalid user profile response');
      }
    } catch (err) {
      console.warn('Session restoration failed or token expired:', err.message);
      apiClient.clearToken();
      setTokenState(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;

    const storedToken = apiClient.getToken();
    if (storedToken) {
      apiClient.getMe()
        .then((response) => {
          if (!ignore && response?.user) {
            setUser(response.user);
          }
        })
        .catch((err) => {
          if (!ignore) {
            console.warn('Session init failed:', err.message);
            apiClient.clearToken();
            setTokenState(null);
            setUser(null);
          }
        })
        .finally(() => {
          if (!ignore) setIsLoading(false);
        });
    }

    // Listen for automatic 401 unauthorized events from apiClient
    const handleUnauthorized = () => {
      apiClient.clearToken();
      setTokenState(null);
      setUser(null);
    };

    window.addEventListener('gymcore:unauthorized', handleUnauthorized);
    return () => {
      ignore = true;
      window.removeEventListener('gymcore:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email, password) => {
    const response = await apiClient.login({ email, password });
    if (response?.token && response?.user) {
      apiClient.setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
      return response;
    }
    throw new Error('Unexpected login response format');
  };

  const register = async (registrationData) => {
    const response = await apiClient.register(registrationData);
    if (response?.token && response?.user) {
      apiClient.setToken(response.token);
      setTokenState(response.token);
      setUser(response.user);
      return response;
    }
    throw new Error('Unexpected registration response format');
  };

  const logout = async () => {
    try {
      await apiClient.logout();
    } catch (err) {
      console.warn('Logout API call failed, clearing client state anyway:', err);
    } finally {
      apiClient.clearToken();
      setTokenState(null);
      setUser(null);
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
    register,
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
