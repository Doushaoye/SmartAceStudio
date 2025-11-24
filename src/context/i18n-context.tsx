'use client';

import { createContext, useContext, useState, useEffect, type ReactNode, useCallback } from 'react';

import en from '@/locales/en.json';
import zh from '@/locales/zh.json';
import ja from '@/locales/ja.json';
import ko from '@/locales/ko.json';

type Language = 'en' | 'zh' | 'ja' | 'ko';

const translations = { en, zh, ja, ko };

interface I18nContextType {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

// Helper function to get a nested property from an object using a dot-separated string
const getNested = (obj: any, path: string) => {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
};

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  useEffect(() => {
    // Set language from browser settings if available
    const browserLang = navigator.language.split('-')[0] as Language;
    if (['en', 'zh', 'ja', 'ko'].includes(browserLang)) {
      setLanguage(browserLang);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const translation = getNested(translations[language], key);
    if (translation) {
      return translation;
    }
    // Fallback to English if translation is not found
    const fallback = getNested(translations.en, key);
    return fallback || key;
  }, [language]);


  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
