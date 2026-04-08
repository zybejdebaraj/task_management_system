<template>
  <div>
    <div v-if="showNavbar" class="app-shell">
      <Navbar />
      <main class="content">
        <Topbar />
        <router-view />
      </main>
    </div>
    <router-view v-else />
  </div>
</template>

<script>
import Navbar from './components/navbar.vue';
import Topbar from './components/topbar.vue';

export default {
  components: { Navbar, Topbar },

  computed: {
    showNavbar() {
      const hiddenRoutes = ['/', '/login', '/register'];
      return !hiddenRoutes.includes(this.$route.path);
    }
  }
};
</script>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 250px 1fr;
}

.content {
  min-width: 0;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }
}
</style>