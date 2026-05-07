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
      first_name?: string;
      last_name?: string;
      username?: string;
      language_code?: string;
      photo_url?: string;
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
  getUserDisplayName() {
    const user = this.app?.initDataUnsafe?.user;
    return [user?.first_name, user?.last_name].filter(Boolean).join(' ') || user?.username || undefined;
  },
  getInitData() {
    return this.app?.initData ?? '';
  },
};
