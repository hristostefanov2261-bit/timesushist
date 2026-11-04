import { useEffect, useState } from 'react';
import { telegramWebApp } from '../lib/telegram';

interface TelegramInitDataUnsafe {
  user?: {
    id: number;
    is_bot: boolean;
    first_name: string;
    last_name?: string;
    username?: string;
    language_code?: string;
    is_premium?: boolean;
  };
  auth_date?: number;
  chat_instance?: string;
  hash?: string;
}

export const useTelegramWebApp = () => {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [initDataUnsafe, setInitDataUnsafe] = useState<TelegramInitDataUnsafe | null>(null);

  useEffect(() => {
    if (telegramWebApp.isReady()) {
      setIsReady(true);
      const telegramUser = telegramWebApp.getUser();
      setUser(telegramUser);

      // Get initDataUnsafe from window.Telegram.WebApp
      const initData = (window as any).Telegram?.WebApp?.initDataUnsafe;
      if (initData) {
        setInitDataUnsafe(initData);
        console.log('📱 Telegram initDataUnsafe:', initData);
      }

      // Set up Telegram appearance
      telegramWebApp.setBackgroundColor('#f3f4f6');
      telegramWebApp.setHeaderColor('#ffffff');
    } else {
      // In development, simulate Telegram
      setIsReady(true);
      const devUser = {
        id: Math.floor(Math.random() * 1000000),
        is_bot: false,
        first_name: 'Dev User',
      };
      setUser(devUser);
      setInitDataUnsafe({ user: devUser });
      console.log('🔧 Development mode - simulated Telegram user:', devUser);
    }
  }, []);

  return {
    isReady,
    user,
    telegramWebApp,
    initDataUnsafe,
  };
};

export const useHapticFeedback = () => {
  return {
    impact: () => telegramWebApp.hapticFeedback('impact'),
    notification: () => telegramWebApp.hapticFeedback('notification'),
    selection: () => telegramWebApp.hapticFeedback('selection'),
  };
};
