import { createMemoryHistory, createRouter } from 'vue-router';

import AboutView from './views/AboutView.vue';
import MainLayout from './layouts/MainLayout.vue';
import CoursesView from './views/CoursesView.vue';
import CourseView from './views/CourseView.vue';
import SettingsView from './views/SettingsView.vue';
import SettingsAccount from './views/settings/SettingsAccount.vue';
import SettingsAppearance from './views/settings/SettingsAppearance.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: CoursesView },
      { path: 'courses/:slug', name: 'course', component: CourseView },
      {
        path: 'settings',
        component: SettingsView,
        children: [
          { path: '', name: 'settings-account', component: SettingsAccount },
          { path: 'appearance', name: 'settings-appearance', component: SettingsAppearance },
        ],
      },
    ],
  },
  { path: '/about', component: AboutView },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
