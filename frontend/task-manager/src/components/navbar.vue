<template>
  <aside
    :class="[
      'flex flex-col bg-gradient-to-b from-slate-900 to-indigo-950 text-white h-full border-r border-white/10 transition-all duration-300',
      collapsed ? 'w-16 p-2' : 'w-64 p-4'
    ]"
  >
    <!-- Collapse button — floating on the right edge, aligned with brand row -->
    <button
      class="absolute -right-3.5 top-5 z-30 w-7 h-7 rounded-full bg-indigo-600 border-2 border-slate-900 text-white flex items-center justify-center shadow-md hover:bg-indigo-500 transition cursor-pointer"
      type="button"
      :aria-label="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      :title="collapsed ? 'Expand sidebar' : 'Collapse sidebar'"
      @click="$emit('toggle-collapse')"
    >
      <ChevronLeft v-if="!collapsed" class="w-3.5 h-3.5" />
      <ChevronRight v-else class="w-3.5 h-3.5" />
    </button>

    <!-- Brand -->
    <div :class="['flex items-center pt-2 pb-2', collapsed ? 'justify-center' : 'gap-3 px-2']">
      <div class="flex items-center gap-3 min-w-0">
        <div class="w-9 h-9 rounded-xl bg-indigo-600 grid place-items-center font-bold text-sm shrink-0">TF</div>
        <span v-if="!collapsed" class="font-bold text-base tracking-tight truncate">TaskFlow</span>
      </div>
    </div>

    <!-- Nav links -->
    <nav class="flex flex-col gap-1 flex-1 mt-4">
      <router-link
        v-for="link in visibleLinks"
        :key="link.to"
        :to="link.to"
        active-class="bg-indigo-600/40 text-white"
        :class="['nav-link', collapsed ? 'justify-center px-0' : '']"
        :title="collapsed ? link.label : ''"
      >
        <component :is="link.icon" class="w-5 h-5 shrink-0" />
        <span v-if="!collapsed">{{ link.label }}</span>
      </router-link>
    </nav>

    <!-- User footer -->
    <div :class="['flex items-center rounded-xl bg-white/10 border border-white/10', collapsed ? 'justify-center p-2' : 'gap-3 px-3 py-3']">
      <div
        class="w-8 h-8 rounded-full bg-white/20 border border-white/25 overflow-hidden grid place-items-center text-xs font-bold shrink-0"
        :title="collapsed ? displayName : ''"
      >
        <img v-if="avatarUrl" :src="avatarUrl" class="w-full h-full object-cover" alt="avatar" />
        <span v-else>{{ userInitials }}</span>
      </div>
      <template v-if="!collapsed">
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
      </template>
    </div>
  </aside>
</template>

<script>
import { getUser, isAdmin } from '@/utils/auth';
import api from '@/api/api';
import { uploadUrl } from '@/api/config';
import { LayoutDashboard, ListTodo, FolderKanban, Users, Mail, Settings, LogOut, ChevronLeft, ChevronRight } from 'lucide-vue-next';

export default {
  components: { LayoutDashboard, ListTodo, FolderKanban, Users, Mail, Settings, LogOut, ChevronLeft, ChevronRight },
  props: {
    collapsed: { type: Boolean, default: false }
  },
  emits: ['toggle-collapse'],
  data() {
    return { isAdminUser: false, user: null, avatarUrl: null };
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
  async mounted() {
    this.isAdminUser = isAdmin();
    this.user = getUser();
    try {
      const res = await api.get('/auth/me');
      if (res.data.avatar_url) {
        this.avatarUrl = uploadUrl(res.data.avatar_url);
      }
    } catch { /* silent */ }
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
