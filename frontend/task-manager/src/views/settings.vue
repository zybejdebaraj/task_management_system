<template>
  <div class="p-4 space-y-5">

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
            <div class="w-12 h-7 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition cursor-pointer"></div>
            <div class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 pointer-events-none"></div>
          </div>
        </label>
        <label class="flex items-center justify-between cursor-pointer">
          <span class="text-base font-medium text-slate-700">Dark mode</span>
          <div class="relative">
            <input v-model="preferences.dark_mode" type="checkbox" class="sr-only peer" />
            <div class="w-12 h-7 bg-slate-200 peer-checked:bg-indigo-600 rounded-full transition cursor-pointer"></div>
            <div class="absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform peer-checked:translate-x-5 pointer-events-none"></div>
          </div>
        </label>
      </div>
      <div class="flex justify-end">
        <button class="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-base transition border-none cursor-pointer" @click="savePreferences">Save preferences</button>
      </div>
    </section>

    <!-- Audit Log (admin only) -->
    <section v-if="isAdmin" class="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5">
      <!-- Header -->
      <div class="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 class="font-bold text-slate-800 text-xl">Audit Log</h3>
          <p class="text-sm text-slate-400 mt-0.5">{{ filteredAuditRows.length }} events recorded</p>
        </div>
        <input
          v-model="auditSearch"
          placeholder="Search task, user or action..."
          class="block w-64 rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
        />
      </div>

      <!-- Loading -->
      <div v-if="auditLoading" class="flex items-center justify-center py-12 text-slate-400 text-sm">
        <span class="animate-pulse">Loading activity...</span>
      </div>

      <!-- Empty -->
      <div v-else-if="!paginatedAuditRows.length" class="flex flex-col items-center justify-center py-12 text-slate-400 gap-2">
        <span class="text-3xl">📋</span>
        <p class="text-sm font-medium">No activity found.</p>
      </div>

      <!-- Timeline -->
      <div v-else class="space-y-3">
        <div
          v-for="row in paginatedAuditRows"
          :key="row.id"
          class="bg-slate-50 hover:bg-white border border-slate-100 hover:border-slate-200 hover:shadow-sm rounded-2xl px-4 py-3 transition-all"
        >
          <div class="flex items-start justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-2 flex-wrap">
              <div class="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                :class="auditDotClass(row.action)">
                {{ auditIcon(row.action) }}
              </div>
              <span :class="auditActionClass(row.action)" class="text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full">
                {{ row.action }}
              </span>
              <span class="font-semibold text-slate-800 text-sm">{{ row.task_title || 'Unknown task' }}</span>
              <span class="text-xs text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-md">#{{ row.task_id }}</span>
            </div>
            <span class="text-xs text-slate-400 whitespace-nowrap shrink-0">{{ formatAuditDate(row.created_at) }}</span>
          </div>
          <p v-if="row.detail" class="text-xs text-slate-500 mt-1.5 leading-relaxed">{{ row.detail }}</p>
          <div class="flex items-center gap-1.5 mt-2">
            <div class="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-[10px] font-bold grid place-items-center shrink-0">
              {{ (row.username || row.email || 'S').charAt(0).toUpperCase() }}
            </div>
            <span class="text-xs text-slate-400">{{ row.username || row.email || 'System' }}</span>
          </div>
        </div>
      </div>

      <!-- Pagination -->
      <div v-if="auditTotalPages > 1" class="flex items-center justify-between pt-1">
        <p class="text-xs text-slate-400">Page {{ auditPage }} of {{ auditTotalPages }}</p>
        <div class="flex gap-2">
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            :disabled="auditPage === 1"
            @click="auditPage--"
          >← Previous</button>
          <button
            class="px-3 py-1.5 rounded-lg text-xs font-semibold border border-slate-200 bg-white hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition"
            :disabled="auditPage === auditTotalPages"
            @click="auditPage++"
          >Next →</button>
        </div>
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
import { isAdmin } from '@/utils/auth';

export default {
  data() {
    return {
      isAdmin: false,
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
      auditRows: [],
      auditLoading: false,
      auditSearch: '',
      auditPage: 1,
      auditPageSize: 5,
      message: '',
      error: ''
    };
  },
  computed: {
    filteredAuditRows() {
      const q = this.auditSearch.trim().toLowerCase();
      if (!q) return this.auditRows;
      return this.auditRows.filter(r =>
        (r.task_title || '').toLowerCase().includes(q) ||
        (r.action || '').toLowerCase().includes(q) ||
        (r.detail || '').toLowerCase().includes(q) ||
        (r.username || r.email || '').toLowerCase().includes(q)
      );
    },
    auditTotalPages() {
      return Math.max(1, Math.ceil(this.filteredAuditRows.length / this.auditPageSize));
    },
    paginatedAuditRows() {
      const start = (this.auditPage - 1) * this.auditPageSize;
      return this.filteredAuditRows.slice(start, start + this.auditPageSize);
    }
  },
  watch: {
    auditSearch() { this.auditPage = 1; },
    'preferences.dark_mode'(val) { this.applyTheme(val); }
  },
  async mounted() {
    this.isAdmin = isAdmin();
    await this.loadSettings();
    if (this.isAdmin) await this.loadAuditLog();
  },
  methods: {
    async loadAuditLog() {
      this.auditLoading = true;
      try { const res = await api.get('/tasks/activity/all'); this.auditRows = res.data; }
      catch (err) { console.error(err); }
      finally { this.auditLoading = false; }
    },
    formatAuditDate(value) { return new Date(value).toLocaleString(); },
    auditActionClass(action) {
      if (!action) return 'bg-slate-100 text-slate-500';
      const a = action.toLowerCase();
      if (a.includes('creat')) return 'bg-green-100 text-green-700';
      if (a.includes('delet')) return 'bg-red-100 text-red-700';
      if (a.includes('complet') || a.includes('done')) return 'bg-blue-100 text-blue-700';
      if (a.includes('updat') || a.includes('edit') || a.includes('mov')) return 'bg-amber-100 text-amber-700';
      return 'bg-slate-100 text-slate-500';
    },
    auditDotClass(action) {
      if (!action) return 'bg-slate-100 text-slate-400';
      const a = action.toLowerCase();
      if (a.includes('creat')) return 'bg-green-100 text-green-600';
      if (a.includes('delet')) return 'bg-red-100 text-red-600';
      if (a.includes('complet') || a.includes('done')) return 'bg-blue-100 text-blue-600';
      if (a.includes('updat') || a.includes('edit') || a.includes('mov')) return 'bg-amber-100 text-amber-600';
      return 'bg-slate-100 text-slate-400';
    },
    auditIcon(action) {
      if (!action) return '•';
      const a = action.toLowerCase();
      if (a.includes('creat')) return '✚';
      if (a.includes('delet')) return '✕';
      if (a.includes('complet') || a.includes('done')) return '✓';
      if (a.includes('updat') || a.includes('edit') || a.includes('mov')) return '✎';
      return '•';
    },
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
    applyTheme(isDark) {
      document.documentElement.classList.toggle('dark', isDark);
      localStorage.setItem('dark_mode', isDark ? 'true' : 'false');
    },
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

