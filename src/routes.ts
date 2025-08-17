import { createMemoryHistory, createRouter } from 'vue-router';

import AboutView from './views/AboutView.vue';
import MainLayout from './layouts/MainLayout.vue';
import CoursesView from './views/CoursesView.vue';
import SettingsView from './views/SettingsView.vue';
import SettingsProfile from './views/settings/SettingsProfile.vue';
import SettingsAccount from './views/settings/SettingsAccount.vue';
import SettingsAppearance from './views/settings/SettingsAppearance.vue';
import SettingsAccessibility from './views/settings/SettingsAccessibility.vue';
import SettingsNotifications from './views/settings/SettingsNotifications.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: CoursesView },
      {
        path: 'settings',
        component: SettingsView,
        children: [
          { path: '', redirect: { name: 'settings-profile' } },
          { path: 'profile', name: 'settings-profile', component: SettingsProfile },
          { path: 'account', name: 'settings-account', component: SettingsAccount },
          { path: 'appearance', name: 'settings-appearance', component: SettingsAppearance },
          { path: 'accessibility', name: 'settings-accessibility', component: SettingsAccessibility },
          { path: 'notifications', name: 'settings-notifications', component: SettingsNotifications },
        ],
      },
    ],
  },
  { path: '/about', component: AboutView },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
