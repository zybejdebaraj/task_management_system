import { createRouter, createWebHistory } from 'vue-router';
import { getUser } from '../utils/auth';

import login from '../views/login.vue';
import register from '../views/register.vue';
import landing from '../views/landing.vue';
import dashboard from '../views/dashboard.vue';
import TasksPage from '../views/tasks.vue';
import ProjectsPage from '../views/projects.vue';
import InboxEmailPage from '../views/inboxEmail.vue';
import SettingsPage from '../views/settings.vue';
import MembersPage from '../views/members.vue';

const isAuthenticated = () => {
  return !!getUser();
};

const isAdminUser = () => {
  const user = getUser();
  return user?.role === 'admin';
};

const routes = [
  {
    path: '/',
    component: landing,
    beforeEnter: (to, from) => {
      if (isAuthenticated()) {
        return '/dashboard';
      }
      return true;
    }
  },
  { path: '/login', component: login },
  { path: '/register', component: register },

  {
    path: '/dashboard',
    component: dashboard,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) {
        return '/login';
      }
      return true;
    }
  },

  {
    path: '/tasks',
    component: TasksPage,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) {
        return '/login';
      }
      return true;
    }
  },

  {
    path: '/projects',
    component: ProjectsPage,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) {
        return '/login';
      } else if (!isAdminUser()) {
        return '/dashboard';
      }
      return true;
    }
  },
  {
    path: '/members',
    component: MembersPage,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) {
        return '/login';
      } else if (!isAdminUser()) {
        return '/dashboard';
      }
      return true;
    }
  },
  {
    path: '/inbox-email',
    component: InboxEmailPage,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) {
        return '/login';
      }
      return true;
    }
  },
  {
    path: '/settings',
    component: SettingsPage,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) {
        return '/login';
      }
      return true;
    }
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;