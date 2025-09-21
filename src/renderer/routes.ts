import { createMemoryHistory, createRouter } from 'vue-router';

import MainLayout from './layouts/MainLayout.vue';
import CourseLayout from './layouts/CourseLayout.vue';
import ExerciseLayout from './layouts/ExerciseLayout.vue';
import MyLearningView from './views/MyLearningView.vue';
import CourseView from './views/CourseView.vue';
import ExerciseView from './views/ExerciseView.vue';
import SettingsView from './views/SettingsView.vue';
import SettingsAccount from './views/settings/SettingsAccount.vue';
import SettingsAppearance from './views/settings/SettingsAppearance.vue';

const routes = [
  // Home uses MainLayout
  {
    path: '/',
    component: MainLayout,
    children: [
      { path: '', component: MyLearningView },
      {
        path: '/settings',
        component: SettingsView,
        children: [
          { path: '', name: 'settings-account', component: SettingsAccount },
          { path: 'appearance', name: 'settings-appearance', component: SettingsAppearance },
        ],
      },
    ],
  },
  // Courses overview uses CourseLayout
  {
    path: '/courses',
    component: CourseLayout,
    children: [{ path: ':slug', name: 'course', component: CourseView }],
  },
  // Dedicated Exercise editor uses ExerciseLayout (separate full-page layout)
  {
    path: '/courses/:slug/exercise',
    component: ExerciseLayout,
    children: [{ path: '', name: 'exercise', component: ExerciseView }],
  },

  { path: '/:pathMatch(.*)*', redirect: '/' },
];

const router = createRouter({
  history: createMemoryHistory(),
  routes,
});

export default router;
