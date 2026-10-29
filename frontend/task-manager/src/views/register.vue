<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
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
        </div>

        <button
          class="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          @click="register"
        >Create account</button>

        <div class="mt-4 flex items-center gap-3">
          <div class="flex-1 h-px bg-slate-200"></div>
          <span class="text-xs text-slate-400">or</span>
          <div class="flex-1 h-px bg-slate-200"></div>
        </div>

        <div ref="googleBtn" class="mt-3 w-full flex justify-center"></div>

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
    return { username: '', email: '', password: '', error: '' };
  },
  mounted() {
    this.initGoogle();
  },
  methods: {
    async register() {
      if (!this.email || !this.password) { toast.error('Email and password are required'); return; }
      this.error = '';
      try {
        await api.post('/auth/register', { username: this.username?.trim() || null, email: this.email, password: this.password });
        toast.success('Registered successfully');
        this.$router.push('/login');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Register failed');
      }
    },
    initGoogle() {
      const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
      if (!clientId || !window.google) return;
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: this.handleGoogleCredential,
      });
      window.google.accounts.id.renderButton(this.$refs.googleBtn, {
        theme: 'outline',
        size: 'large',
        width: 360,
        text: 'signup_with',
      });
    },
    async handleGoogleCredential({ credential }) {
      try {
        const res = await api.post('/auth/google', { credential });
        localStorage.setItem('token', res.data.token);
        toast.success('Signed up with Google');
        this.$router.push('/dashboard');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Google sign-up failed');
      }
    },
  },
};
</script>
