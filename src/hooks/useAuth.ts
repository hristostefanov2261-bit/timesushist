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
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasAttemptedAuth, setHasAttemptedAuth] = useState(false);

  // На загрузке проверяем сохранённый токен
  useEffect(() => {
    console.log('🔍 useAuth: Checking for saved token...');
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        setHasAttemptedAuth(true);
        console.log('✅ useAuth: Restored session from localStorage');
        return;
      } catch (err) {
        console.error('useAuth: Failed to restore session:', err);
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }

    // Нет сохранённого токена, пробуем аутентифицироваться
    setHasAttemptedAuth(true);
  }, []);

  // Аутентификация через Telegram
  const authenticateTelegram = useCallback(async () => {
    // Если уже аутентифицированы, выходим
    if (isAuthenticated) {
      console.log('✅ Already authenticated');
      return;
    }

    // Если нет данных от Telegram, выходим
    const tgUser = initDataUnsafe?.user;
    if (!tgUser || !tgUser.id) {
      console.warn('⚠️ Telegram user data not available yet');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      console.log(`🔐 Authenticating: ${tgUser.id} (${tgUser.first_name})`);
      console.log(`📍 Backend URL: ${BACKEND_URL}`);

      const payload = {
        user_id: tgUser.id,
        first_name: tgUser.first_name,
        last_name: tgUser.last_name || undefined,
        username: tgUser.username || undefined,
      };

      console.log('📤 Sending payload:', payload);

      const response = await fetch(`${BACKEND_URL}/api/auth/telegram`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      console.log('📥 Response status:', response.status, response.statusText);

      if (!response.ok) {
        let errorData = {};
        try {
          errorData = await response.json();
        } catch (e) {
          errorData = { error: await response.text() };
        }
        console.error('❌ Server error:', errorData);
        throw new Error((errorData as any).error || `HTTP ${response.status}`);
      }

      const data: AuthResponse = await response.json();
      console.log('✅ Auth response received:', { user: data.user.first_name, token: data.token ? '***' : 'none' });

      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      console.log('✅ Authenticated:', data.user.first_name);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('❌ Auth error details:', err);
      console.error('❌ Auth error message:', msg);
      setError(msg);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [initDataUnsafe, isAuthenticated]);

  // Пробуем аутентифицироваться когда Telegram готов и есть данные
  useEffect(() => {
    if (isReady && hasAttemptedAuth && !isAuthenticated && initDataUnsafe?.user) {
      console.log('📱 Telegram ready, attempting auth...');
      authenticateTelegram();
    }
  }, [isReady, hasAttemptedAuth, isAuthenticated, initDataUnsafe, authenticateTelegram]);

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
  };
};

export const useAuthHeaders = (token: string | null) => {
  return {
    'Authorization': token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };
};
