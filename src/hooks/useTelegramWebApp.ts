import { useEffect, useState } from 'react';
import { telegramWebApp } from '../lib/telegram';

export const useTelegramWebApp = () => {
  const [isReady, setIsReady] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    if (telegramWebApp.isReady()) {
      setIsReady(true);
      const telegramUser = telegramWebApp.getUser();
      setUser(telegramUser);

      // Set up Telegram appearance
      telegramWebApp.setBackgroundColor('#f3f4f6');
      telegramWebApp.setHeaderColor('#ffffff');
    } else {
      // In development, simulate Telegram
      setIsReady(true);
      setUser({
        id: Math.random() * 1000000,
        is_bot: false,
        first_name: 'Dev User',
      });
    }
  }, []);

  return {
    isReady,
    user,
    telegramWebApp,
  };
};

export const useHapticFeedback = () => {
  return {
    impact: () => telegramWebApp.hapticFeedback('impact'),
    notification: () => telegramWebApp.hapticFeedback('notification'),
    selection: () => telegramWebApp.hapticFeedback('selection'),
  };
};
