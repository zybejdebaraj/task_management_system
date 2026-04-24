<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
      <!-- Logo -->
      <div class="flex items-center justify-center gap-3 mb-8">
        <div class="w-10 h-10 rounded-xl bg-indigo-600 grid place-items-center font-bold text-white text-sm">TM</div>
        <span class="text-xl font-bold text-white">Task Manager</span>
      </div>

      <!-- Card -->
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-1">Create account</h2>
        <p class="text-sm text-slate-500 mb-6">Start managing tasks with your team.</p>

        <div class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username</label>
            <input v-model="username" placeholder="Your name" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input v-model="email" type="email" placeholder="you@company.com" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</label>
            <input v-model="password" type="password" placeholder="••••••••" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" @keyup.enter="register" />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Role</label>
            <select v-model="role" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </div>
        </div>

        <button
          class="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          @click="register"
        >Create account</button>

        <p class="mt-5 text-center text-sm text-slate-500">
          Already have an account?
          <span class="font-semibold text-indigo-600 cursor-pointer hover:underline" @click="$router.push('/login')">Sign in</span>
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
    return { username: '', email: '', password: '', role: 'member', error: '' };
  },
  methods: {
    async register() {
      if (!this.email || !this.password) { toast.error('Email and password are required'); return; }
      this.error = '';
      try {
        await api.post('/auth/register', { username: this.username?.trim() || null, email: this.email, password: this.password, role: this.role });
        toast.success('Registered successfully');
        this.$router.push('/login');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Register failed');
      }
    }
  }
};
</script>
