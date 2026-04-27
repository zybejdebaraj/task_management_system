<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8">
        <h2 class="text-2xl font-bold text-slate-900 mb-1">Forgot password?</h2>
        <p class="text-sm text-slate-500 mb-6">Enter your email and we'll send you a reset link.</p>

        <div v-if="sent" class="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm font-medium mb-4">
          If that email exists, reset instructions have been sent.
        </div>

        <div v-if="!sent" class="space-y-4">
          <div>
            <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
            <input
              v-model="email"
              type="email"
              placeholder="you@company.com"
              class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              @keyup.enter="submit"
            />
          </div>
          <button
            class="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
            :disabled="loading"
            @click="submit"
          >
            {{ loading ? 'Sending...' : 'Send reset link' }}
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
    return { email: '', loading: false, sent: false };
  },
  methods: {
    async submit() {
      if (!this.email) { toast.error('Email is required'); return; }
      this.loading = true;
      try {
        await api.post('/auth/forgot-password', { email: this.email });
        this.sent = true;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Something went wrong');
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>
