import { createMemoryHistory, createRouter } from 'vue-router';

import AboutView from './views/AboutView.vue';
import MainLayout from './layouts/MainLayout.vue';
import CoursesView from './views/CoursesView.vue';
import CourseView from './views/CourseView.vue';
import SettingsView from './views/SettingsView.vue';
import SettingsAccount from './views/settings/SettingsAccount.vue';
import SettingsAppearance from './views/settings/SettingsAppearance.vue';
import LoginView from './views/auth/LoginView.vue';
import pinia, { useAuthStore } from './stores/index.js';

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
  { path: '/auth/login', name: 'login', component: LoginView, meta: { public: true } },
  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

// Global navigation guard to protect non-auth routes
router.beforeEach(async (to, _from) => {
  const auth = useAuthStore(pinia);

  if (auth.user === null && !auth.loading) {
    try { await auth.fetchUser(); } catch {/* ignore */ }
  }

  const isAuthRoute = to.path.startsWith('/auth');

  if (!auth.isAuthenticated && !isAuthRoute) {
    return { path: '/auth/login', query: { redirect: to.fullPath } };
  }

  if (auth.isAuthenticated && isAuthRoute) {
    const target = (to.query.redirect as string) || '/';
    return target;
  }

  return true;
});

export default router;
