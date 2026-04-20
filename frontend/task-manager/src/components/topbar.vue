<template>
  <header class="topbar">
    <h2>{{ pageTitle }}</h2>
    <div class="actions">
      <div class="notify-wrap" ref="notifyWrap">
        <button class="icon-btn" type="button" @click="toggleNotifications" aria-label="Notifications">
          <Bell class="icon" />
          <span v-if="unreadCount" class="badge">{{ unreadCount }}</span>
        </button>
        <div v-if="showNotifications" class="notify-panel">
          <div class="notify-head">
            <strong>Notifications</strong>
            <div class="notify-tools">
              <button class="link-btn" type="button" @click="loadNotifications">Refresh</button>
              <button class="link-btn" type="button" @click="markAllAsRead">Mark all read</button>
            </div>
          </div>
          <p v-if="loading" class="empty">Loading...</p>
          <p v-else-if="!notifications.length" class="empty">No notifications yet.</p>
          <ul v-else class="notify-list">
            <li
              v-for="item in notifications"
              :key="item.id"
              class="notify-item"
              :class="{ unread: !item.is_read }"
              @click="openNotification(item)"
            >
              <p>{{ item.message }}</p>
              <small>{{ formatDate(item.created_at) }}</small>
            </li>
          </ul>
        </div>
      </div>
      <button class="logout-btn" @click="logout">Logout</button>
    </div>
  </header>
</template>

<script>
import api from '@/api/api';
import { Bell } from 'lucide-vue-next';

export default {
  components: { Bell },
  data() {
    return {
      showNotifications: false,
      notifications: [],
      loading: false,
      pollTimer: null
    };
  },
  computed: {
    pageTitle() {
      const map = {
        '/dashboard': 'Dashboard',
        '/tasks': 'Tasks',
        '/projects': 'Projects',
        '/members': 'Members',
        '/inbox-email': 'Messages',
        '/settings': 'Settings'
      };
      return map[this.$route.path] || 'Task Manager';
    },
    unreadCount() {
      return this.notifications.filter((item) => !item.is_read).length;
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
    toggleNotifications() {
      this.showNotifications = !this.showNotifications;
    },
    async markAsRead(item) {
      if (item.is_read) return;
      try {
        await api.put(`/notifications/${item.id}/read`);
        item.is_read = true;
      } catch (err) {
        console.error('Failed to mark notification', err);
      }
    },
    async markAllAsRead() {
      try {
        await api.put('/notifications/read-all');
        this.notifications = this.notifications.map((item) => ({ ...item, is_read: true }));
      } catch (err) {
        console.error('Failed to mark all notifications', err);
      }
    },
    async openNotification(item) {
      await this.markAsRead(item);
      this.showNotifications = false;
      if (!item.task_id) return;
      this.$router.push({
        path: '/tasks',
        query: { taskId: String(item.task_id), from: 'notification', t: String(Date.now()) }
      });
    },
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
    handleOutsideClick(event) {
      if (!this.showNotifications) return;
      const root = this.$refs.notifyWrap;
      if (!root) return;
      if (!root.contains(event.target)) {
        this.showNotifications = false;
      }
    },
    logout() {
      localStorage.removeItem('token');
      this.$router.push('/login');
    }
  }
};
</script>

<style scoped>
.topbar {
  background: linear-gradient(90deg, rgba(255, 255, 255, 0.95) 0%, rgba(238, 242, 255, 0.9) 100%);
  border-bottom: 1px solid #dbeafe;
  padding: 14px 22px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  position: sticky;
  top: 0;
  z-index: 10;
  box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
}

.topbar h2 {
  font-size: 22px;
  color: #1e1b4b;
}

.actions {
  display: flex;
  align-items: center;
  gap: 10px;
}

.notify-wrap {
  position: relative;
}

.icon-btn {
  border: 1px solid #dbeafe;
  background: #fff;
  color: #334155;
  border-radius: 10px;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 0;
  line-height: 0;
  cursor: pointer;
  position: relative;
}

.icon-btn:hover {
  background: #f1f5f9;
}

.icon {
  width: 18px;
  height: 18px;
  display: block;
}

.badge {
  position: absolute;
  top: -5px;
  right: -5px;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  padding: 0 5px;
  display: grid;
  place-items: center;
  background: #ef4444;
  color: white;
  font-size: 11px;
  font-weight: 700;
}

.notify-panel {
  position: absolute;
  right: 0;
  top: calc(100% + 8px);
  width: min(360px, 80vw);
  background: #fff;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.12);
  z-index: 20;
  overflow: hidden;
}

.notify-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  border-bottom: 1px solid #e2e8f0;
}

.notify-tools {
  display: flex;
  align-items: center;
  gap: 10px;
}

.link-btn {
  background: transparent;
  border: none;
  color: #4f46e5;
  font-weight: 600;
  cursor: pointer;
}

.notify-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
}

.notify-item {
  padding: 10px 12px;
  border-bottom: 1px solid #f1f5f9;
  cursor: pointer;
}

.notify-item p {
  color: #334155;
  font-size: 14px;
}

.notify-item small {
  color: #64748b;
}

.notify-item.unread {
  background: #eef2ff;
}

.empty {
  padding: 14px 12px;
  color: #64748b;
}

.logout-btn {
  background: #dc2626;
}

.logout-btn:hover {
  background: #b91c1c;
}
</style>
