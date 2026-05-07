<template>
  <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 px-4">
    <div class="w-full max-w-md">
      <div class="bg-white rounded-2xl shadow-2xl p-8">

        <!-- Invalid / expired token -->
        <div v-if="!token || expired" class="text-center space-y-3">
          <p class="text-3xl">⛔</p>
          <h2 class="text-xl font-bold text-slate-900">Invite link invalid</h2>
          <p class="text-sm text-slate-500">This link is invalid or has expired. Ask your admin to send a new invitation.</p>
          <button
            class="mt-4 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
            @click="$router.push('/login')"
          >Back to login</button>
        </div>

        <!-- Setup form -->
        <template v-else>
          <h2 class="text-2xl font-bold text-slate-900 mb-1">Create your account</h2>
          <p class="text-sm text-slate-500 mb-6">You have been invited to join IdealTask. Choose a name and password to get started.</p>

          <div class="space-y-4">
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Your name</label>
              <input
                v-model="username"
                placeholder="Your name"
                class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Password</label>
              <input
                v-model="password"
                type="password"
                placeholder="Choose a password"
                class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                @keyup.enter="submit"
              />
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Confirm password</label>
              <input
                v-model="confirmPassword"
                type="password"
                placeholder="Repeat password"
                class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
                @keyup.enter="submit"
              />
            </div>
          </div>

          <button
            class="mt-6 w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="loading"
            @click="submit"
          >{{ loading ? 'Creating account...' : 'Create account' }}</button>
        </template>

      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import { toast } from '@/utils/toast';

export default {
  data() {
    return {
      username: '',
      password: '',
      confirmPassword: '',
      loading: false,
      expired: false,
    };
  },
  computed: {
    token() {
      return this.$route.query.token || null;
    },
  },
  methods: {
    async submit() {
      if (!this.password) { toast.error('Password is required'); return; }
      if (this.password.length < 6) { toast.error('Password must be at least 6 characters'); return; }
      if (this.password !== this.confirmPassword) { toast.error('Passwords do not match'); return; }

      this.loading = true;
      try {
        const res = await api.post('/auth/accept-invite', {
          token: this.token,
          username: this.username.trim() || null,
          password: this.password,
        });
        localStorage.removeItem('token');
        localStorage.setItem('token', res.data.token);
        toast.success('Account created! Welcome to IdealTask.');
        this.$router.push('/dashboard');
      } catch (err) {
        const msg = err.response?.data?.message || 'Failed to set up account';
        if (msg.toLowerCase().includes('expired') || msg.toLowerCase().includes('invalid')) {
          this.expired = true;
        }
        toast.error(msg);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>
