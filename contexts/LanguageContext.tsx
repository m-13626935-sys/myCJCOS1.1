
import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import type { Language } from '../types';
import { translations } from '../i18n/translations';

type LanguageContextType = {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: Record<string, string | number>) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
        const saved = localStorage.getItem('cjc5_language');
        return (saved as Language) || 'zh';
    } catch {
        return 'zh';
    }
  });

  const setLanguage = useCallback((lang: Language) => {
    try {
        localStorage.setItem('cjc5_language', lang);
        setLanguageState(lang);
    } catch (e) {
        console.error("Failed to save language to localStorage", e);
    }
  }, []);

  const t = useCallback((key: string, options?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    if (options) {
        Object.keys(options).forEach(optionKey => {
            text = text.replace(`{{${optionKey}}}`, String(options[optionKey]));
        });
    }
    return text;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
