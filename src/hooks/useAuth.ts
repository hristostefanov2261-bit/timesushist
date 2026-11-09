import { useState, useEffect, useCallback } from 'react';

interface AuthUser {
  id: string;
  code: string;
  first_name: string;
  last_name?: string;
  username?: string;
}

interface GenerateResponse {
  success: boolean;
  code: string;
  user: AuthUser;
  token: string;
}

interface VerifyResponse {
  success: boolean;
  user: AuthUser;
  token: string;
  error?: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'https://timesushist-backend.vercel.app';
const AUTH_TOKEN_KEY = 'timesushist_auth_token';
const AUTH_USER_KEY = 'timesushist_auth_user';

export const useAuth = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Код, который показываем пользователю после generate
  const [generatedCode, setGeneratedCode] = useState<string | null>(null);

  // Восстанавливаем сессию из localStorage
  useEffect(() => {
    const savedToken = localStorage.getItem(AUTH_TOKEN_KEY);
    const savedUser = localStorage.getItem(AUTH_USER_KEY);

    if (savedToken && savedUser) {
      try {
        setToken(savedToken);
        setUser(JSON.parse(savedUser));
        setIsAuthenticated(true);
        console.log('✅ useAuth: Session restored from localStorage');
      } catch {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
      }
    }
  }, []);

  // Шаг 1: генерируем код (создаём нового пользователя)
  const generateCode = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`📤 Generating code from ${BACKEND_URL}/api/auth/generate`);

      const response = await fetch(`${BACKEND_URL}/api/auth/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const data = await response.json();
          msg = data.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const data: GenerateResponse = await response.json();
      console.log('✅ Code generated:', data.code);

      // Сразу логиним — пользователь уже создан
      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);
      setGeneratedCode(data.code);

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      return data.code;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('❌ Generate error:', msg);
      setError(msg);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Шаг 2: входим по существующему коду
  const verifyCode = useCallback(async (code: string) => {
    try {
      setIsLoading(true);
      setError(null);

      console.log(`📤 Verifying code: ${code}`);

      const response = await fetch(`${BACKEND_URL}/api/auth/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({ code: code.trim() }),
      });

      if (!response.ok) {
        let msg = `HTTP ${response.status}`;
        try {
          const data = await response.json();
          msg = data.error || msg;
        } catch {}
        throw new Error(msg);
      }

      const data: VerifyResponse = await response.json();
      console.log('✅ Verified, user:', data.user.first_name);

      setUser(data.user);
      setToken(data.token);
      setIsAuthenticated(true);

      localStorage.setItem(AUTH_TOKEN_KEY, data.token);
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(data.user));

      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('❌ Verify error:', msg);
      setError(msg);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setIsAuthenticated(false);
    setGeneratedCode(null);
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
    generatedCode,
    generateCode,
    verifyCode,
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
