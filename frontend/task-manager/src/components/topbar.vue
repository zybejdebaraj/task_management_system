<template>
  <header class="sticky top-0 z-10 flex items-center justify-between px-6 py-3 bg-white border-b border-slate-200 shadow-sm">
    <h2 class="text-lg font-bold text-slate-800">{{ pageTitle }}</h2>

    <div class="flex items-center gap-3">
      <!-- Notification bell -->
      <div class="relative" ref="notifyWrap">
        <button
          type="button"
          class="relative w-9 h-9 rounded-xl border border-slate-200 bg-white flex items-center justify-center text-slate-500 hover:bg-slate-50 transition"
          @click="toggleNotifications"
          aria-label="Notifications"
        >
          <Bell class="w-4 h-4" />
          <span
            v-if="unreadCount"
            class="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[10px] font-bold grid place-items-center px-1"
          >{{ unreadCount }}</span>
        </button>

        <!-- Dropdown panel -->
        <div
          v-if="showNotifications"
          class="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-2xl shadow-xl z-20 overflow-hidden"
        >
          <div class="flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span class="font-bold text-sm text-slate-800">Notifications</span>
            <div class="flex gap-3">
              <button class="text-xs font-semibold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer" @click="loadNotifications">Refresh</button>
              <button class="text-xs font-semibold text-indigo-600 hover:underline bg-transparent border-none cursor-pointer" @click="markAllAsRead">Mark all read</button>
            </div>
          </div>
          <p v-if="loading" class="px-4 py-3 text-sm text-slate-400">Loading...</p>
          <p v-else-if="!notifications.length" class="px-4 py-3 text-sm text-slate-400">No notifications yet.</p>
          <ul v-else class="max-h-72 overflow-auto divide-y divide-slate-50">
            <li
              v-for="item in notifications"
              :key="item.id"
              class="px-4 py-3 cursor-pointer hover:bg-slate-50 transition"
              :class="{ 'bg-indigo-50': !item.is_read }"
              @click="openNotification(item)"
            >
              <p class="text-sm text-slate-700">{{ item.message }}</p>
              <small class="text-xs text-slate-400">{{ formatDate(item.created_at) }}</small>
            </li>
          </ul>
        </div>
      </div>

      <!-- Logout -->
      <button
        class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition"
        @click="logout"
      >Logout</button>
    </div>
  </header>
</template>

<script>
import api from '@/api/api';
import { Bell } from 'lucide-vue-next';

export default {
  components: { Bell },
  data() {
    return { showNotifications: false, notifications: [], loading: false, pollTimer: null };
  },
  computed: {
    pageTitle() {
      const map = {
        '/dashboard': 'Dashboard', '/tasks': 'Tasks', '/projects': 'Projects',
        '/members': 'Members', '/inbox-email': 'Messages', '/settings': 'Settings'
      };
      return map[this.$route.path] || 'Task Manager';
    },
    unreadCount() {
      return this.notifications.filter(n => !n.is_read).length;
    }
  },
  async mounted() {
    await this.loadNotifications();
    this.pollTimer = window.setInterval(this.loadNotifications, 15000);
    document.addEventListener('click', this.handleOutsideClick);
  },
  beforeUnmount() {
    if (this.pollTimer) window.clearInterval(this.pollTimer);
    document.removeEventListener('click', this.handleOutsideClick);
  },
  methods: {
    async loadNotifications() {
      try {
        this.loading = true;
        const res = await api.get('/notifications');
        this.notifications = res.data || [];
      } catch (err) {
        console.error('Failed to load notifications', err);
      } finally {
        this.loading = false;
      }
    },
    toggleNotifications() { this.showNotifications = !this.showNotifications; },
    async markAsRead(item) {
      if (item.is_read) return;
      try { await api.put(`/notifications/${item.id}/read`); item.is_read = true; }
      catch (err) { console.error(err); }
    },
    async markAllAsRead() {
      try {
        await api.put('/notifications/read-all');
        this.notifications = this.notifications.map(n => ({ ...n, is_read: true }));
      } catch (err) { console.error(err); }
    },
    async openNotification(item) {
      await this.markAsRead(item);
      this.showNotifications = false;
      if (!item.task_id) return;
      this.$router.push({ path: '/tasks', query: { taskId: String(item.task_id), from: 'notification', t: String(Date.now()) } });
    },
    formatDate(value) { return new Date(value).toLocaleString(); },
    handleOutsideClick(event) {
      if (!this.showNotifications) return;
      const root = this.$refs.notifyWrap;
      if (root && !root.contains(event.target)) this.showNotifications = false;
    },
    logout() { localStorage.removeItem('token'); this.$router.push('/login'); }
  }
};
</script>
