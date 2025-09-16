import { electronStore } from '~/electron-store.js';
import { IpcHandlersDef } from './shared.types.js';

export const themeHandlers: IpcHandlersDef = {
  'theme:get'() {
    return electronStore.get('themePreference');
  },
  'theme:set'(_, theme) {
    electronStore.set('themePreference', theme);
    return theme;
  },
};
