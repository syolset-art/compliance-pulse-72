import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import nb from '@/locales/nb.json';
import en from '@/locales/en.json';
import nl from '@/locales/nl.json';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      nb: { translation: nb },
      en: { translation: en },
      nl: { translation: nl },
    },
    fallbackLng: 'nb',
    supportedLngs: ['nb', 'en', 'nl'],
    nonExplicitSupportedLngs: true,
    load: 'languageOnly',
    detection: {
      order: ['localStorage', 'navigator', 'htmlTag'],
      caches: ['localStorage'],
      lookupLocalStorage: 'i18nextLng',
      convertDetectedLanguage: (lng: string) => {
        const base = (lng || '').toLowerCase().split('-')[0];
        if (base === 'nb' || base === 'nn' || base === 'no') return 'nb';
        if (base === 'nl') return 'nl';
        return 'en';
      },
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;
