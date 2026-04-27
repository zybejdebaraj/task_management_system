<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-1">Reset password</h2>
        <p class="text-sm text-slate-500 mb-6">Choose a new password for your account.</p>

        <div v-if="!token" class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm font-medium">
          Invalid reset link. Please request a new one.
        </div>

        <div v-else-if="done" class="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
          Password reset successfully.
          <span class="font-semibold cursor-pointer underline ml-1" @click="$router.push('/login')">Sign in</span>
        </div>

        <div v-else class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">New password</label>
            <input
              v-model="newPassword"
              type="password"
              placeholder="••••••••"
              class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Confirm password</label>
            <input
              v-model="confirmPassword"
              type="password"
              placeholder="••••••••"
              class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              @keyup.enter="submit"
            />
          </div>
          <button
            class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
            :disabled="loading"
            @click="submit"
          >
            {{ loading ? 'Resetting...' : 'Reset password' }}
          </button>
        </div>

        <p class="mt-5 text-center text-sm text-slate-500">
          <span class="font-semibold text-indigo-600 cursor-pointer hover:underline" @click="$router.push('/login')">Back to sign in</span>
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
    return { newPassword: '', confirmPassword: '', loading: false, done: false, token: null };
  },
  mounted() {
    this.token = new URLSearchParams(window.location.search).get('token') || null;
  },
  methods: {
    async submit() {
      if (!this.newPassword) { toast.error('Password is required'); return; }
      if (this.newPassword !== this.confirmPassword) { toast.error('Passwords do not match'); return; }
      this.loading = true;
      try {
        await api.post('/auth/reset-password', { token: this.token, newPassword: this.newPassword });
        this.done = true;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Reset failed');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
