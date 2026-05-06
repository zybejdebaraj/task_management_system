<template>
  <div>
    <div v-if="showNavbar" class="flex h-screen overflow-hidden">
      <Navbar
        :collapsed="sidebarCollapsed"
        :class="['fixed top-0 left-0 h-screen z-20 transition-all duration-300', sidebarCollapsed ? 'w-16' : 'w-64']"
        @toggle-collapse="sidebarCollapsed = !sidebarCollapsed"
      />
      <main :class="['flex flex-col min-w-0 bg-slate-50 flex-1 h-screen overflow-y-auto transition-all duration-300', sidebarCollapsed ? 'ml-16' : 'ml-64']">
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
  data() {
    return { sidebarCollapsed: false };
  },
  computed: {
    showNavbar() {
      const hiddenRoutes = ['/', '/login', '/register', '/forgot-password', '/reset-password'];
      return !hiddenRoutes.includes(this.$route.path);
    }
  }
};
</script>
