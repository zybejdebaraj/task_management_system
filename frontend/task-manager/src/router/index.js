import { createRouter, createWebHistory } from 'vue-router';
import { getUser } from '../utils/auth';

import login from '../views/login.vue';
const register = () => import('../views/register.vue');
import landing from '../views/landing.vue';
const dashboard = () => import('../views/dashboard.vue');
const TasksPage = () => import('../views/tasks.vue');
const ProjectsPage = () => import('../views/projects.vue');
const InboxEmailPage = () => import('../views/inboxEmail.vue');
const SettingsPage = () => import('../views/settings.vue');
const MembersPage = () => import('../views/members.vue');
const AuditLogPage = () => import('../views/auditLog.vue');
const ForgotPasswordPage = () => import('../views/forgotPassword.vue');
const ResetPasswordPage = () => import('../views/resetPassword.vue');
const AcceptInvitePage = () => import('../views/acceptInvite.vue');

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
  { path: '/forgot-password', component: ForgotPasswordPage },
  { path: '/reset-password', component: ResetPasswordPage },
  {
    path: '/accept-invite',
    component: AcceptInvitePage,
    beforeEnter: (to) => {
      if (!to.query.token) return '/login';
      return true;
    }
  },

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
  },
  {
    path: '/audit-log',
    component: AuditLogPage,
    beforeEnter: (to, from) => {
      if (!isAuthenticated()) return '/login';
      if (!isAdminUser()) return '/dashboard';
      return true;
    }
  },
  {
    path: '/:pathMatch(.*)*',
    beforeEnter: () => isAuthenticated() ? '/dashboard' : '/login'
  }
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

export default router;