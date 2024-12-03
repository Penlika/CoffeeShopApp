import i18next from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';  // Updated import
import i18nextBrowserLanguageDetector from 'i18next-browser-languagedetector';

// Import your translations
import en from './en.json';
import es from './es.json';
import fr from './fr.json';

i18next
  .use(initReactI18next)
  .use(i18nextBrowserLanguageDetector)
  .init({
    resources: {
      en: { translation: en },
      es: { translation: es },
      fr: { translation: fr },
    },
    lng: 'en', // Default language
    fallbackLng: 'en',
    debug: true,
    storage: AsyncStorage,  // Use the new AsyncStorage here
    interpolation: {
      escapeValue: false, // React already escapes
    },
  });

export default i18next;
