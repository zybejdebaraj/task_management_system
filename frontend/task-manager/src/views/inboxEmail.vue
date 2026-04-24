<template>
  <div class="p-5">
    <div class="flex gap-4 min-h-[76vh]">

      <!-- Left nav -->
      <aside class="w-52 shrink-0 bg-white rounded-2xl border border-slate-200 shadow-sm p-3 flex flex-col gap-1">
        <button
          class="w-full mb-2 py-2 rounded-xl bg-blue-100 hover:bg-blue-200 text-blue-800 font-semibold text-sm transition border-none cursor-pointer"
          @click="activePanel = 'compose'"
        >Compose</button>
        <button
          v-for="item in navItems"
          :key="item.key"
          class="w-full text-left px-3 py-2 rounded-full text-sm font-semibold transition border-none cursor-pointer"
          :class="activePanel === item.key ? 'bg-blue-100 text-blue-800' : 'text-slate-600 hover:bg-slate-100 bg-transparent'"
          @click="activePanel = item.key"
        >{{ item.label }}</button>
      </aside>

      <!-- Mail area -->
      <section class="flex-1 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
        <!-- Tab header -->
        <div class="px-5 py-3 border-b border-slate-100 bg-white">
          <span class="text-sm font-bold text-blue-600 border-b-2 border-blue-500 pb-2.5 inline-block">{{ currentPanelTitle }}</span>
        </div>

        <!-- Inbox list -->
        <div v-if="activePanel === 'inbox'" class="flex-1 overflow-auto divide-y divide-slate-50">
          <div v-for="item in mockEmails" :key="item.id" class="grid px-5 py-3 hover:bg-slate-50 transition cursor-pointer" style="grid-template-columns: 180px 1fr 80px">
            <span class="font-bold text-sm text-slate-800 truncate">{{ item.sender }}</span>
            <span class="text-sm text-slate-600 truncate px-3">{{ item.subject }}</span>
            <span class="text-xs text-slate-400 text-right">{{ item.time }}</span>
          </div>
        </div>

        <!-- Compose panel -->
        <div v-else class="flex-1 overflow-auto p-5 space-y-4">
          <h3 class="font-bold text-slate-800">New Message</h3>

          <!-- Template picker -->
          <div class="bg-slate-50 rounded-xl border border-slate-200 p-4 flex items-center gap-4 flex-wrap">
            <div class="flex items-center gap-3">
              <label class="text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">Template</label>
              <select v-model="selectedTemplateId" class="rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
                <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
              </select>
            </div>
            <button class="px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs transition border-none cursor-pointer" @click="copyTemplate">Copy template</button>
            <span v-if="copied" class="text-xs text-green-600 font-semibold">Copied!</span>
          </div>

          <!-- Compose form -->
          <div class="bg-white rounded-xl border border-slate-200 p-4 space-y-4 shadow-sm">
            <div class="grid sm:grid-cols-2 gap-4">
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">To</label>
                <input v-model="emailForm.to" placeholder="member@example.com" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
              <div>
                <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Subject</label>
                <input v-model="emailForm.subject" placeholder="Email subject" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
            </div>
            <div>
              <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Body</label>
              <textarea v-model="emailForm.body" rows="10" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-y"></textarea>
            </div>
            <button class="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" @click="sendEmail">Send</button>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import { toast } from '@/utils/toast';

export default {
  data() {
    return {
      activePanel: 'inbox',
      selectedTemplateId: 'welcome',
      copied: false,
      emailForm: { to: '', subject: '', body: '' },
      navItems: [
        { key: 'inbox', label: 'Inbox' },
        { key: 'starred', label: 'Starred' },
        { key: 'snoozed', label: 'Snoozed' },
        { key: 'sent', label: 'Sent' },
        { key: 'drafts', label: 'Drafts' },
      ],
      mockEmails: [
        { id: 1, sender: 'Task Manager', subject: 'Welcome to your workspace', time: '12:15 PM' },
        { id: 2, sender: 'Admin', subject: 'Task assigned: {{taskTitle}}', time: '11:22 AM' },
        { id: 3, sender: 'Notifications', subject: 'Reminder: Due date is coming soon', time: '10:04 AM' },
        { id: 4, sender: 'Project Bot', subject: 'You were invited to {{projectName}}', time: '9:45 AM' }
      ],
      templates: [
        { id: 'welcome', name: 'Welcome Member', subject: 'Welcome to {{projectName}}', body: 'Hi {{memberName}},\n\nWelcome to {{projectName}}! Your account is active and you can now view your tasks and updates.\n\nRegards,\n{{adminName}}' },
        { id: 'assignment', name: 'Task Assignment', subject: 'New Task Assigned: {{taskTitle}}', body: 'Hi {{memberName}},\n\nYou have been assigned a new task:\n- Task: {{taskTitle}}\n- Project: {{projectName}}\n- Due: {{dueDate}}\n\nPlease update progress in the board.\n\nThanks,\n{{adminName}}' },
        { id: 'reminder', name: 'Due Reminder', subject: 'Reminder: {{taskTitle}} is due soon', body: 'Hi {{memberName}},\n\nFriendly reminder that {{taskTitle}} is due on {{dueDate}}.\n\nRegards,\n{{adminName}}' },
        { id: 'completed', name: 'Task Completed', subject: 'Task Completed: {{taskTitle}}', body: 'Hi Team,\n\n{{memberName}} has marked {{taskTitle}} as completed.\n\nThanks,\nTask Manager' },
        { id: 'invite', name: 'Project Invite', subject: 'You are invited to {{projectName}}', body: 'Hi {{memberName}},\n\nYou have been invited to join {{projectName}}.\n\nRegards,\n{{adminName}}' }
      ]
    };
  },
  computed: {
    activeTemplate() { return this.templates.find(t => t.id === this.selectedTemplateId) || null; },
    currentPanelTitle() {
      const titles = { inbox: 'Inbox', starred: 'Starred', snoozed: 'Snoozed', sent: 'Sent', drafts: 'Drafts', compose: 'Compose' };
      return titles[this.activePanel] || 'Inbox';
    }
  },
  watch: { selectedTemplateId() { this.applySelectedTemplate(); } },
  mounted() { this.applySelectedTemplate(); },
  methods: {
    applySelectedTemplate() {
      if (!this.activeTemplate) return;
      this.emailForm.subject = this.activeTemplate.subject;
      this.emailForm.body = this.activeTemplate.body;
    },
    async copyTemplate() {
      if (!this.activeTemplate) return;
      try { await navigator.clipboard.writeText(`Subject: ${this.emailForm.subject}\n\n${this.emailForm.body}`); this.copied = true; setTimeout(() => { this.copied = false; }, 1500); }
      catch { this.copied = false; }
    },
    async sendEmail() {
      if (!this.emailForm.to || !this.emailForm.subject || !this.emailForm.body) { toast.error('Please fill recipient, subject, and body.'); return; }
      try { const res = await api.post('/email/send', this.emailForm); toast.success(res.data.message || 'Email sent'); this.emailForm.to = ''; }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to send email'); }
    }
  }
};
</script>
