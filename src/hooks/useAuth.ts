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
  const { initDataUnsafe, isReady } = useTelegramWebApp();
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
        console.log('✅ Restored session from localStorage');
      } catch (err) {
        console.error('Failed to restore auth:', err);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    setIsLoading(false);
  }, []);

  // Аутентификация через Telegram - просто по ID пользователя
  const authenticateTelegram = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Получаем данные пользователя из Telegram WebApp
      const tgUser = initDataUnsafe?.user;

      if (!tgUser || !tgUser.id) {
        throw new Error('Telegram user data not available');
      }

      console.log(`🔐 Authenticating Telegram user: ${tgUser.id} (${tgUser.first_name})`);

      // Отправляем на backend просто user_id и основную информацию
      const response = await fetch(`${BACKEND_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: tgUser.id,
          first_name: tgUser.first_name,
          last_name: tgUser.last_name || undefined,
          username: tgUser.username || undefined,
        }),
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
      console.error('❌ Auth error:', errorMsg);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [initDataUnsafe]);

  // Logout
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    console.log('👋 Logged out');
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
    telegramReady: isReady,
  };
};

// Хук для получения headers с токеном для API запросов
export const useAuthHeaders = (token: string | null) => {
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};
