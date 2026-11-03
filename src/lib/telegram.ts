// Telegram WebApp integration utilities

interface TelegramUser {
  id: number;
  is_bot: boolean;
  first_name: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
}

interface TelegramWebAppInitData {
  user?: TelegramUser;
  auth_date: number;
  hash: string;
}

declare global {
  interface Window {
    Telegram: any;
  }
}

export class TelegramWebApp {
  private static instance: TelegramWebApp;
  private webApp: any;
  private initData: TelegramWebAppInitData | null = null;

  private constructor() {
    this.webApp = window.Telegram?.WebApp;
    if (this.webApp) {
      this.webApp.ready();
      this.parseInitData();
    }
  }

  static getInstance(): TelegramWebApp {
    if (!TelegramWebApp.instance) {
      TelegramWebApp.instance = new TelegramWebApp();
    }
    return TelegramWebApp.instance;
  }

  private parseInitData() {
    if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initData) {
      try {
        const params = new URLSearchParams(window.Telegram.WebApp.initData);
        const user = params.get('user');
        const auth_date = params.get('auth_date');
        const hash = params.get('hash');

        if (user && auth_date && hash) {
          this.initData = {
            user: JSON.parse(user),
            auth_date: parseInt(auth_date),
            hash,
          };
        }
      } catch (error) {
        console.error('Failed to parse Telegram init data:', error);
      }
    }
  }

  getUser(): TelegramUser | null {
    return this.initData?.user || null;
  }

  getInitData(): TelegramWebAppInitData | null {
    return this.initData;
  }

  isReady(): boolean {
    return !!this.webApp;
  }

  setMainButtonText(text: string) {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.setText(text);
    }
  }

  showMainButton() {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.show();
    }
  }

  hideMainButton() {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.hide();
    }
  }

  onMainButtonClick(callback: () => void) {
    if (this.webApp?.MainButton) {
      this.webApp.MainButton.onClick(callback);
    }
  }

  setBackgroundColor(color: string) {
    if (this.webApp) {
      this.webApp.setBackgroundColor(color);
    }
  }

  setHeaderColor(color: string) {
    if (this.webApp) {
      this.webApp.setHeaderColor(color);
    }
  }

  close() {
    if (this.webApp) {
      this.webApp.close();
    }
  }

  hapticFeedback(type: 'impact' | 'notification' | 'selection' = 'impact') {
    if (this.webApp?.HapticFeedback) {
      switch (type) {
        case 'impact':
          this.webApp.HapticFeedback.impactOccurred('light');
          break;
        case 'notification':
          this.webApp.HapticFeedback.notificationOccurred('success');
          break;
        case 'selection':
          this.webApp.HapticFeedback.selectionChanged();
          break;
      }
    }
  }

  shareUrl(url: string, text?: string) {
    if (this.webApp) {
      this.webApp.shareUrl(url, text);
    }
  }

  openLink(url: string) {
    if (this.webApp) {
      this.webApp.openLink(url);
    }
  }
}

export const telegramWebApp = TelegramWebApp.getInstance();
