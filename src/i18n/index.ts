import * as Localization from 'expo-localization';
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import { getSecureItem, setSecureItem } from '../utils/secureStorage';
import en from './locales/en.json';
import ur from './locales/ur.json';

export type AppLanguage = 'en' | 'ur';

const LANGUAGE_KEY = 'hk_language';
const deviceLanguage = Localization.getLocales()[0]?.languageCode ?? 'en';

void i18n.use(initReactI18next).init({
  compatibilityJSON: 'v4',
  resources: {
    en: { translation: en },
    ur: { translation: ur },
  },
  lng: deviceLanguage === 'ur' ? 'ur' : 'en',
  fallbackLng: 'en',
  interpolation: {
    escapeValue: false,
  },
});

void getSecureItem(LANGUAGE_KEY).then((stored) => {
  if ((stored === 'en' || stored === 'ur') && stored !== i18n.language) {
    void i18n.changeLanguage(stored);
  }
});

export async function setAppLanguage(language: AppLanguage): Promise<void> {
  await i18n.changeLanguage(language);
  await setSecureItem(LANGUAGE_KEY, language);
}

export default i18n;
