/**
 * i18n setup for the six African Union working languages, including RTL Arabic.
 * Add another African language by creating locales/<code>.json and registering it below.
 */
import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import en from './locales/en.json'
import fr from './locales/fr.json'
import pt from './locales/pt.json'
import es from './locales/es.json'
import sw from './locales/sw.json'
import ar from './locales/ar.json'

export interface LanguageDef {
  code: string
  native: string
  dir: 'ltr' | 'rtl'
}

/** The AU working languages. */
export const LANGUAGES: LanguageDef[] = [
  { code: 'en', native: 'English', dir: 'ltr' },
  { code: 'fr', native: 'Français', dir: 'ltr' },
  { code: 'pt', native: 'Português', dir: 'ltr' },
  { code: 'es', native: 'Español', dir: 'ltr' },
  { code: 'sw', native: 'Kiswahili', dir: 'ltr' },
  { code: 'ar', native: 'العربية', dir: 'rtl' },
]

const STORAGE_KEY = 'afya-acr-lang'

export function dirFor(code: string): 'ltr' | 'rtl' {
  return LANGUAGES.find((l) => l.code === code)?.dir ?? 'ltr'
}

/** Apply <html lang/dir> for the active language. */
export function applyDocumentLang(code: string): void {
  const el = document.documentElement
  el.lang = code
  el.dir = dirFor(code)
}

const saved = (typeof localStorage !== 'undefined' && localStorage.getItem(STORAGE_KEY)) || 'en'

void i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    fr: { translation: fr },
    pt: { translation: pt },
    es: { translation: es },
    sw: { translation: sw },
    ar: { translation: ar },
  },
  lng: saved,
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

i18n.on('languageChanged', (code) => {
  if (typeof localStorage !== 'undefined') localStorage.setItem(STORAGE_KEY, code)
  applyDocumentLang(code)
})

if (typeof document !== 'undefined') applyDocumentLang(saved)

export default i18n
