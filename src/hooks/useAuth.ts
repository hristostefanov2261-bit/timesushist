import { useState, useEffect, useCallback } from 'react';
import { useTelegramWebApp } from './useTelegramWebApp';

interface AuthUser {
  id: string;
  telegram_id: number;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface AuthResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  error?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://timesushist-backend.vercel.app';
const AUTH_TOKEN_KEY = 'timesushist_auth_token';
const AUTH_USER_KEY = 'timesushist_auth_user';

export const useAuth = () => {
  const { telegramWebApp, isReady } = useTelegramWebApp();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Проверяем сохранённый токен при загрузке
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
      } catch (err) {
        console.error('Failed to restore auth:', err);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  // Аутентификация через Telegram
  const authenticateTelegram = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Получаем initData из Telegram через публичный метод
      const initDataRaw = window.Telegram?.WebApp?.initData;

      if (!initDataRaw) {
        throw new Error('Telegram initData not available');
      }

      // Отправляем на backend для проверки подписи
      const response = await fetch(`${BACKEND_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ initData: initDataRaw }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Authentication failed');
      }

      const data: AuthResponse = await response.json();

      if (data.success) {
        setUser(data.user);
        setToken(data.token);
        setIsAuthenticated(true);

        // Сохраняем токен и пользователя локально
        localStorage.setItem(AUTH_TOKEN_KEY, data.token);
        localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

        console.log('✅ Authenticated as:', data.user.first_name);
        return data;
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Authentication error';
      setError(errorMsg);
      console.error('❌ Auth error:', err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
  }, []);

  return {
    user,
    token,
    isLoading,
    error,
    isAuthenticated,
    authenticateTelegram,
    logout,
    backendUrl: BACKEND_URL,
  };
};

// Хук для получения headers с токеном для API запросов
export const useAuthHeaders = (token: string | null) => {
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};
