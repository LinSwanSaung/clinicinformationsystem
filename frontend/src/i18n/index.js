import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import translation files
import translationEN from './locales/en.json';
import translationMY from './locales/my.json';

const resources = {
  en: {
    translation: translationEN
  },
  my: {
    translation: translationMY
  }
};

i18n
  .use(LanguageDetector) // Detect user language
  .use(initReactI18next) // Pass i18n instance to react-i18next
  .init({
    resources,
    fallbackLng: 'en', // Default language
    lng: localStorage.getItem('language') || 'en', // Get saved language or default to English
    
    interpolation: {
      escapeValue: false, // React already escapes values
      prefix: '{',
      suffix: '}'
    },
    
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage']
    },
    
    react: {
      useSuspense: false
    }
  });

export default i18n;
