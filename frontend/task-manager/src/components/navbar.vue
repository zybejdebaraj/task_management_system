<template>
  <aside class="flex flex-col bg-gradient-to-b from-slate-900 to-indigo-950 text-white w-64 min-h-screen p-4 gap-6 border-r border-white/10 shrink-0">

    <!-- Brand -->
    <div class="flex items-center gap-3 px-2 pt-2">
      <div class="w-9 h-9 rounded-xl bg-indigo-600 grid place-items-center font-bold text-sm shrink-0">IT</div>
      <span class="font-bold text-base tracking-tight">IdealTask</span>
    </div>

    <!-- Nav links -->
    <nav class="flex flex-col gap-1 flex-1">
      <router-link
        v-for="link in visibleLinks"
        :key="link.to"
        :to="link.to"
        active-class="bg-indigo-600/40 text-white"
        class="nav-link"
      >
        <component :is="link.icon" class="w-5 h-5 shrink-0" />
        {{ link.label }}
      </router-link>
    </nav>

    <!-- User footer -->
    <div class="flex items-center gap-3 px-3 py-3 rounded-xl bg-white/10 border border-white/10">
      <div class="w-8 h-8 rounded-full bg-white/20 border border-white/25 grid place-items-center text-xs font-bold shrink-0">
        {{ userInitials }}
      </div>
      <div class="min-w-0 flex-1">
        <p class="text-sm font-semibold truncate leading-tight">{{ displayName }}</p>
        <p class="text-xs text-slate-400 leading-tight">{{ isAdminUser ? 'Admin' : 'Member' }}</p>
      </div>
      <button
        class="w-7 h-7 rounded-lg bg-transparent border-none text-slate-400 hover:bg-white/10 hover:text-white flex items-center justify-center transition cursor-pointer shrink-0"
        type="button"
        aria-label="Log out"
        title="Log out"
        @click="logout"
      >
        <LogOut class="w-4 h-4" />
      </button>
    </div>
  </aside>
</template>

<script>
import { getUser, isAdmin } from '@/utils/auth';
import { LayoutDashboard, ListTodo, FolderKanban, Users, Mail, Settings, LogOut } from 'lucide-vue-next';

export default {
  components: { LayoutDashboard, ListTodo, FolderKanban, Users, Mail, Settings, LogOut },
  data() {
    return { isAdminUser: false, user: null };
  },
  computed: {
    displayName() {
      return this.user?.username || this.user?.email || 'User';
    },
    userInitials() {
      const source = (this.user?.username || this.user?.email || '').trim();
      if (!source) return 'U';
      return source.split('@')[0].replace(/[_\-.]+/g, ' ').trim().charAt(0).toUpperCase() || 'U';
    },
    visibleLinks() {
      const all = [
        { to: '/dashboard', label: 'Dashboard', icon: 'LayoutDashboard', adminOnly: false },
        { to: '/tasks', label: 'Tasks', icon: 'ListTodo', adminOnly: false },
        { to: '/projects', label: 'Projects', icon: 'FolderKanban', adminOnly: true },
        { to: '/members', label: 'Members', icon: 'Users', adminOnly: true },
        { to: '/inbox-email', label: 'Messages', icon: 'Mail', adminOnly: false },
        { to: '/settings', label: 'Settings', icon: 'Settings', adminOnly: false },
      ];
      return all.filter(l => !l.adminOnly || this.isAdminUser);
    }
  },
  mounted() {
    this.isAdminUser = isAdmin();
    this.user = getUser();
  },
  methods: {
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.nav-link {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 12px;
  color: #cbd5e1;
  font-weight: 600;
  font-size: 16px;
  text-decoration: none;
  transition: background 0.15s, color 0.15s;
}
.nav-link:hover {
  background: rgba(255,255,255,0.1);
  color: #fff;
}
</style>
