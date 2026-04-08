<template>
  <aside class="sidebar">
    <div class="brand">
      <div class="logo">TM</div>
      <div>
        <h3>Task Manager</h3>
      </div>
    </div>

    <div class="menu">
      <router-link to="/dashboard" class="link">Dashboard</router-link>
      <router-link to="/tasks" class="link">Tasks</router-link>
      <router-link v-if="isAdminUser" to="/projects" class="link">Projects</router-link>
      <router-link v-if="isAdminUser" to="/members" class="link">Members</router-link>
      <router-link to="/inbox-email" class="link">Inbox/Email</router-link>
      <router-link to="/settings" class="link">Settings</router-link>
    </div>

    <div class="role-footer">
      Role: <strong>{{ isAdminUser ? 'Admin' : 'Member' }}</strong>
    </div>
  </aside>
</template>

<script>
import { isAdmin } from '@/utils/auth';

export default {
  data() {
    return {
      isAdminUser: false
    };
  },
  mounted() {
    this.isAdminUser = isAdmin();
  }
};
</script>

<style scoped>
.sidebar {
  background: linear-gradient(180deg, #0f172a 0%, #1e1b4b 100%);
  color: #fff;
  padding: 18px 14px;
  display: flex;
  flex-direction: column;
  gap: 22px;
  border-right: 1px solid rgba(255, 255, 255, 0.08);
}

.brand {
  display: flex;
  gap: 12px;
  padding: 8px 10px;
}

.brand h3 {
  margin-bottom: 6px;
}

.logo {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: #4f46e5;
  display: grid;
  place-items: center;
  font-weight: 700;
}

.menu {
  display: grid;
  gap: 8px;
}

.link {
  color: #cbd5e1;
  text-decoration: none;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 10px;
  transition: 0.2s ease;
}

.link:hover {
  background: rgba(99, 102, 241, 0.2);
  color: #eef2ff;
}

.link.router-link-active {
  background: rgba(99, 102, 241, 0.35);
  color: #fff;
}

.role-footer {
  margin-top: auto;
  padding: 10px 12px;
  border-radius: 10px;
  background: rgba(99, 102, 241, 0.18);
  color: #dbeafe;
  font-size: 13px;
}

@media (max-width: 900px) {
  .sidebar {
    border-right: none;
    border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  }
  .menu {
    grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  }
}
</style>