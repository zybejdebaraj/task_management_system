<template>
  <header class="topbar">
    <h2>{{ pageTitle }}</h2>
    <button class="logout-btn" @click="logout">Logout</button>
  </header>
</template>

<script>
export default {
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
    }
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

.logout-btn {
  background: #dc2626;
}

.logout-btn:hover {
  background: #b91c1c;
}
</style>
