<template>
  <div class="p-5 space-y-5">

    <!-- Profile -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <h3 class="font-bold text-slate-800 text-xl">Profile</h3>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Username</label>
          <input v-model="profile.username" placeholder="Your username" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Email</label>
          <input v-model="profile.email" type="email" placeholder="you@email.com" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>
      <div class="flex justify-end">
        <button class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition border-none cursor-pointer" @click="saveProfile">Save profile</button>
      </div>
    </section>

    <!-- Password -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <h3 class="font-bold text-slate-800 text-xl">Change password</h3>
      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Current password</label>
          <input v-model="password.currentPassword" type="password" placeholder="Current password" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">New password</label>
          <input v-model="password.newPassword" type="password" placeholder="New password" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>
      <div class="flex justify-end">
        <button class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition border-none cursor-pointer" @click="savePassword">Update password</button>
      </div>
    </section>

    <!-- Preferences -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <h3 class="font-bold text-slate-800 text-xl">Preferences</h3>
      <div class="space-y-4">
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-base font-medium text-slate-700">Email & in-app notifications</span>
          <div class="relative">
            <input v-model="preferences.notifications_enabled" type="checkbox" class="sr-only peer" />
            <div class="w-12 h-7 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition peer-focus:ring-2 peer-focus:ring-indigo-400 peer-focus:ring-offset-1 cursor-pointer" @click="preferences.notifications_enabled = !preferences.notifications_enabled"></div>
            <div class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 pointer-events-none"></div>
          </div>
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-base font-medium text-slate-700">Dark mode</span>
          <div class="relative">
            <input v-model="preferences.dark_mode" type="checkbox" class="sr-only peer" />
            <div class="w-12 h-7 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition peer-focus:ring-2 peer-focus:ring-indigo-400 peer-focus:ring-offset-1 cursor-pointer" @click="preferences.dark_mode = !preferences.dark_mode"></div>
            <div class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 pointer-events-none"></div>
          </div>
        </label>
      </div>
      <div class="flex justify-end">
        <button class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition border-none cursor-pointer" @click="savePreferences">Save preferences</button>
      </div>
    </section>

    <!-- SMTP / Email account -->
    <section class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <div>
        <h3 class="font-bold text-slate-800 text-xl">Email account (SMTP)</h3>
        <p class="text-sm text-slate-400 mt-1">Connect your personal email account to send messages from the Messages page.</p>
      </div>

      <!-- Status badge -->
      <div
        class="flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-xl w-fit"
        :class="mailbox.has_smtp_pass ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-slate-50 text-slate-500 border border-slate-200'"
      >
        <span class="w-2.5 h-2.5 rounded-full" :class="mailbox.has_smtp_pass ? 'bg-green-500' : 'bg-slate-400'"></span>
        {{ mailbox.has_smtp_pass ? 'Email account connected' : 'No email account connected' }}
      </div>

      <div class="grid sm:grid-cols-2 gap-5">
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">SMTP Host</label>
          <input v-model="mailbox.smtp_host" placeholder="smtp.gmail.com" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Port</label>
          <input v-model="mailbox.smtp_port" type="number" placeholder="587" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">Email address</label>
          <input v-model="mailbox.smtp_user" type="email" placeholder="you@gmail.com" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Password / App password
            <span v-if="mailbox.has_smtp_pass" class="normal-case font-normal text-slate-400">(leave blank to keep current)</span>
          </label>
          <input v-model="mailbox.smtp_pass" type="password" placeholder="••••••••••••" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-sm font-semibold text-slate-500 uppercase tracking-wide mb-2">From name</label>
          <input v-model="mailbox.smtp_from" placeholder="Your Name" class="block w-full rounded-xl border-slate-300 text-base focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div class="flex items-end">
          <label class="flex items-center gap-3 cursor-pointer pb-2">
            <input v-model="mailbox.smtp_secure" type="checkbox" class="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
            <span class="text-base font-medium text-slate-700">Use SSL/TLS (port 465)</span>
          </label>
        </div>
      </div>

      <div class="bg-indigo-50 border border-indigo-100 rounded-xl px-4 py-3 text-sm text-indigo-700">
        <strong class="font-semibold">Gmail tip:</strong> Use <code class="bg-indigo-100 px-1 rounded">smtp.gmail.com</code> on port <code class="bg-indigo-100 px-1 rounded">587</code> with an <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" class="underline font-semibold">App Password</a> (requires 2FA enabled).
      </div>

      <div class="flex justify-end">
        <button class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition border-none cursor-pointer" @click="saveMailbox">Save email account</button>
      </div>
    </section>

  </div>
</template>

<script>
import api from '../api/api';
import { toast } from '@/utils/toast';

export default {
  data() {
    return {
      profile: { username: '', email: '' },
      password: { currentPassword: '', newPassword: '' },
      preferences: { notifications_enabled: true, dark_mode: false },
      mailbox: {
        smtp_host: '',
        smtp_port: 587,
        smtp_user: '',
        smtp_pass: '',
        smtp_from: '',
        smtp_secure: false,
        has_smtp_pass: false,
      },
      message: '',
      error: ''
    };
  },
  async mounted() { await this.loadSettings(); },
  methods: {
    async loadSettings() {
      try {
        const res = await api.get('/auth/me');
        this.profile.username = res.data.username || '';
        this.profile.email = res.data.email || '';
        this.preferences.notifications_enabled = !!res.data.notifications_enabled;
        this.preferences.dark_mode = !!res.data.dark_mode;
        this.applyTheme(this.preferences.dark_mode);
        this.mailbox.smtp_host = res.data.smtp_host || '';
        this.mailbox.smtp_port = res.data.smtp_port || 587;
        this.mailbox.smtp_user = res.data.smtp_user || '';
        this.mailbox.smtp_from = res.data.smtp_from || '';
        this.mailbox.smtp_secure = !!res.data.smtp_secure;
        this.mailbox.has_smtp_pass = !!res.data.has_smtp_pass;
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to load settings'); }
    },
    applyTheme(isDark) { document.body.classList.toggle('dark-mode', isDark); },
    clearMessages() { this.error = ''; this.message = ''; },
    async saveProfile() {
      this.clearMessages();
      try { await api.put('/auth/me/profile', this.profile); toast.success('Profile updated'); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to update profile'); }
    },
    async savePassword() {
      this.clearMessages();
      try {
        await api.put('/auth/me/password', this.password);
        this.password.currentPassword = '';
        this.password.newPassword = '';
        toast.success('Password changed');
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to change password'); }
    },
    async savePreferences() {
      this.clearMessages();
      try {
        await api.put('/auth/me/preferences', this.preferences);
        this.applyTheme(this.preferences.dark_mode);
        toast.success('Preferences updated');
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to update preferences'); }
    },
    async saveMailbox() {
      this.clearMessages();
      try {
        const res = await api.put('/auth/me/mailbox', {
          smtp_host: this.mailbox.smtp_host,
          smtp_port: this.mailbox.smtp_port,
          smtp_user: this.mailbox.smtp_user,
          smtp_pass: this.mailbox.smtp_pass || undefined,
          smtp_from: this.mailbox.smtp_from,
          smtp_secure: this.mailbox.smtp_secure,
        });
        this.mailbox.has_smtp_pass = !!res.data.has_smtp_pass;
        this.mailbox.smtp_pass = '';
        toast.success('Email account saved');
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to save email account'); }
    }
  }
};
</script>
