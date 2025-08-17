import { createMemoryHistory, createRouter } from 'vue-router';

import AboutView from './views/AboutView.vue';
import MainLayout from './layouts/MainLayout.vue';
import CoursesView from './views/CoursesView.vue';
import SettingsView from './views/SettingsView.vue';

const routes = [
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: CoursesView },
      { path: 'settings', component: SettingsView },
    ],
  },
  { path: '/about', component: AboutView },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
