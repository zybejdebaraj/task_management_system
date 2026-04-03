<template>
  <nav class="navbar">
    <h3>Task Manager</h3>

    <div class="menu">
      <router-link to="/tasks">Tasks</router-link>

      <!-- Only admin sees projects management -->
      <router-link v-if="isAdminUser" to="/projects">
        Manage Projects
      </router-link>

      <!-- Member sees only their projects -->
      <router-link v-else to="/projects">
        My Projects
      </router-link>
    </div>

    <button @click="logout">Logout</button>
  </nav>
</template>

<script>
import { isAdmin } from '../utils/auth';

export default {
  data() {
    return {
      isAdminUser: false
    };
  },

  mounted() {
    this.isAdminUser = isAdmin();
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
.navbar {
  background: #2c3e50;
  color: white;
  padding: 15px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.logo {
  font-weight: bold;
}

.menu {
  display: flex;
  gap: 20px;
}

.link {
  color: white;
  text-decoration: none;
}

.link:hover {
  text-decoration: underline;
}

.logout-btn {
  background: #e74c3c;
  border: none;
  color: white;
  padding: 6px 12px;
  cursor: pointer;
  border-radius: 4px;
}
</style>