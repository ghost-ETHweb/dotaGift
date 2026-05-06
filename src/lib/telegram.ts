type TelegramWebApp = {
  ready: () => void;
  expand: () => void;
  disableVerticalSwipes?: () => void;
  enableVerticalSwipes?: () => void;
  colorScheme?: 'light' | 'dark';
  themeParams?: Record<string, string>;
  initData?: string;
  initDataUnsafe?: {
    user?: {
      language_code?: string;
    };
  };
  HapticFeedback?: {
    impactOccurred: (style: 'light' | 'medium' | 'heavy') => void;
    notificationOccurred: (type: 'success' | 'warning' | 'error') => void;
  };
};

declare global {
  interface Window {
    Telegram?: {
      WebApp?: TelegramWebApp;
    };
  }
}

export const telegram = {
  get app() {
    return window.Telegram?.WebApp;
  },
  init() {
    this.app?.ready();
    this.app?.expand();
  },
  haptic(type: 'light' | 'medium' | 'heavy' = 'light') {
    this.app?.HapticFeedback?.impactOccurred(type);
  },
  notify(type: 'success' | 'warning' | 'error') {
    this.app?.HapticFeedback?.notificationOccurred(type);
  },
  disableVerticalSwipes() {
    this.app?.disableVerticalSwipes?.();
  },
  enableVerticalSwipes() {
    this.app?.enableVerticalSwipes?.();
  },
  getUserLanguageCode() {
    return this.app?.initDataUnsafe?.user?.language_code;
  },
  getInitData() {
    return this.app?.initData ?? '';
  },
};
