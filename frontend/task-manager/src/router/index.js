import { createRouter, createWebHistory } from 'vue-router';
import { getUser } from '../utils/auth';

import login from '../views/login.vue';
import register from '../views/register.vue';
import dashboard from '../views/dashboard.vue';
import TasksPage from '../views/tasks.vue';
import ProjectsPage from '../views/projects.vue';

const isAuthenticated = () => {
  return !!getUser();
};

const routes = [
  { path: '/', redirect: '/login' },
  { path: '/login', component: login },
  { path: '/register', component: register },

  {
    path: '/dashboard',
    component: dashboard,
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next('/login');
      } else {
        next();
      }
    }
  },

  {
    path: '/tasks',
    component: TasksPage,
    beforeEnter: (to, from, next) => {
      if (!isAuthenticated()) {
        next('/login');
      } else {
        next();
      }
    }
  },

  {
    path: '/projects',
    component: ProjectsPage,
    beforeEnter: (to, from, next) => {
      const user = getUser();

      if (!user) {
        next('/login');
      } else {
        next();
      }
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;