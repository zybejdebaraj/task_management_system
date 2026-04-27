<template>
  <div>
    <div v-if="showNavbar" class="flex min-h-screen">
      <Navbar />
      <main class="flex-1 flex flex-col min-w-0 bg-slate-50">
        <Topbar />
        <div class="flex-1">
          <router-view />
        </div>
      </main>
    </div>
    <router-view v-else />
    <ToastHost />
  </div>
</template>

<script>
import Navbar from './components/navbar.vue';
import Topbar from './components/topbar.vue';
import ToastHost from './components/toastHost.vue';

export default {
  components: { Navbar, Topbar, ToastHost },
  computed: {
    showNavbar() {
      const hiddenRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      return !hiddenRoutes.includes(this.$route.path);
    }
  }
};
</script>
