import { createI18n } from 'vue-i18n';

// Placeholder messages object; add real translations later.
// Keeping structure ready for extension.
const messages = {
  en: {},
};

const i18n = createI18n({
  legacy: false, // Use Composition API style in components
  locale: 'en',
  fallbackLocale: 'en',
  messages,
  globalInjection: true, // Allow using $t in templates without importing
});

export default i18n;
