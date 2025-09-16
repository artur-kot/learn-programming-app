import Store from 'electron-store';

export type AppConfig = {
  themePreference: 'system' | 'light' | 'dark';
};

export const electronStore = new Store<AppConfig>({
  schema: {
    themePreference: {
      type: 'string',
      enum: ['system', 'light', 'dark'],
      default: 'system',
    },
  },
});
