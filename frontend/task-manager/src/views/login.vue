<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-1">Welcome back</h2>
        <p class="text-sm text-slate-500 mb-6">Sign in to continue to your workspace.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@company.com"
              class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</label>
            <input
              v-model="password"
              type="password"
              placeholder="••••••••"
              class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              @keyup.enter="login"
            />
          </div>
        </div>

        <button
          class="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          @click="login"
        >Sign in</button>

        <p class="mt-4 text-center text-sm text-slate-500">
          <span class="font-semibold text-indigo-600 cursor-pointer hover:underline" @click="$router.push('/forgot-password')">Forgot password?</span>
        </p>
        <p class="mt-2 text-center text-sm text-slate-500">
          Don't have an account?
          <span class="font-semibold text-indigo-600 cursor-pointer hover:underline" @click="$router.push('/register')">Create one</span>
        </p>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import { toast } from '@/utils/toast';

export default {
  data() {
    return { email: '', password: '', error: '' };
  },
  methods: {
    async login() {
      if (!this.email || !this.password) { toast.error('Email and password are required'); return; }
      this.error = '';
      try {
        const res = await api.post('/auth/login', { email: this.email, password: this.password });
        localStorage.setItem('token', res.data.token);
        toast.success('Logged in');
        this.$router.push('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
      }
    }
  }
};
</script>
