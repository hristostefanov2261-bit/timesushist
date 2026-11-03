import React, { createContext, useState, useCallback, type ReactNode } from 'react';
import type { UserSettings } from '../types';

interface AuthContextType {
  userId: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (telegramData: any) => Promise<void>;
  logout: () => void;
}

interface SettingsContextType {
  settings: UserSettings | null;
  isLoading: boolean;
  updateSettings: (settings: Partial<UserSettings>) => Promise<void>;
}

interface NotificationContextType {
  notifications: Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>;
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);
export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);
export const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface ProviderProps {
  children: ReactNode;
}

export const AppProvider: React.FC<ProviderProps> = ({ children }) => {
  // Auth state
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const login = useCallback(async (telegramData: any) => {
    setAuthLoading(true);
    setAuthError(null);
    try {
      // In development, use mock user
      if (import.meta.env.DEV) {
        setUserId('dev-user-' + Date.now());
        localStorage.setItem('userId', 'dev-user-' + Date.now());
      } else {
        // In production, validate initData on backend
        // For now, mock it
        setUserId('user-' + telegramData.user?.id || 'unknown');
        localStorage.setItem('userId', 'user-' + (telegramData.user?.id || 'unknown'));
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : 'Auth failed');
      throw error;
    } finally {
      setAuthLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUserId(null);
    localStorage.removeItem('userId');
  }, []);

  // Settings state
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [settingsLoading, setSettingsLoading] = useState(false);

  const updateSettings = useCallback(async (newSettings: Partial<UserSettings>) => {
    setSettingsLoading(true);
    try {
      setSettings((prev) => prev ? { ...prev, ...newSettings } : null);
      // TODO: sync with backend
    } finally {
      setSettingsLoading(false);
    }
  }, []);

  // Notifications
  const [notifications, setNotifications] = useState<
    Array<{ id: string; message: string; type: 'success' | 'error' | 'info' }>
  >([]);

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const id = Date.now().toString();
    setNotifications((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, 3000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        userId,
        isAuthenticated: !!userId,
        isLoading: authLoading,
        error: authError,
        login,
        logout,
      }}
    >
      <SettingsContext.Provider value={{ settings, isLoading: settingsLoading, updateSettings }}>
        <NotificationContext.Provider value={{ notifications, addNotification, removeNotification }}>
          {children}
        </NotificationContext.Provider>
      </SettingsContext.Provider>
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AppProvider');
  return context;
};

export const useSettings = () => {
  const context = React.useContext(SettingsContext);
  if (!context) throw new Error('useSettings must be used within AppProvider');
  return context;
};

export const useNotification = () => {
  const context = React.useContext(NotificationContext);
  if (!context) throw new Error('useNotification must be used within AppProvider');
  return context;
};
