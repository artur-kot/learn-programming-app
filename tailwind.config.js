// Tailwind configuration
// Added explicit darkMode class strategy with custom selector 'app-dark'.
// This ensures user-selected light mode isn't overridden by the OS media query.
// Your appearance store toggles the 'app-dark' class on <html>, so Tailwind's
// dark: utilities will now respond to that instead of prefers-color-scheme.
module.exports = {
  darkMode: ['class', '.app-dark'], // custom selector matches the class you toggle on <html>
  content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
  theme: { extend: {} },
  variants: { extend: {} },
  plugins: [],
};