import { createMemoryHistory, createRouter } from 'vue-router';

import AboutView from './views/AboutView.vue';
import MainLayout from './layouts/MainLayout.vue';
import CoursesView from './views/CoursesView.vue';

const routes = [
  { path: '/', component: MainLayout, children: [{ path: '', component: CoursesView }] },
  { path: '/about', component: AboutView },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
