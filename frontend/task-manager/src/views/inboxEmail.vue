<template>
  <div class="page-shell">
    <div class="gmail-page">
      <aside class="left-nav">
        <button class="compose-btn" @click="activePanel = 'compose'">Compose</button>
        <ul>
          <li :class="{ active: activePanel === 'inbox' }" @click="activePanel = 'inbox'">Inbox</li>
          <li :class="{ active: activePanel === 'starred' }" @click="activePanel = 'starred'">Starred</li>
          <li :class="{ active: activePanel === 'snoozed' }" @click="activePanel = 'snoozed'">Snoozed</li>
          <li :class="{ active: activePanel === 'sent' }" @click="activePanel = 'sent'">Sent</li>
          <li :class="{ active: activePanel === 'drafts' }" @click="activePanel = 'drafts'">Drafts</li>
        </ul>
      </aside>

      <section class="mail-area glass-card">
        <div class="top-tabs">
          <span class="tab active">{{ currentPanelTitle }}</span>
        </div>

        <div v-if="activePanel === 'inbox'" class="inbox-list">
          <div v-for="item in mockEmails" :key="item.id" class="mail-row">
            <span class="sender">{{ item.sender }}</span>
            <span class="subject">{{ item.subject }}</span>
            <span class="time">{{ item.time }}</span>
          </div>
        </div>

        <div v-else class="compose-panel">
          <h3>New Message</h3>
          <div class="templates card-lite">
            <div class="design-row">
              <label>Template</label>
              <select v-model="selectedTemplateId">
                <option v-for="template in templates" :key="template.id" :value="template.id">
                  {{ template.name }}
                </option>
              </select>
            </div>
            <button class="ghost-btn" @click="copyTemplate">Copy Template</button>
            <p v-if="copied" class="success">Template copied.</p>
          </div>

          <div class="send-box card-lite">
            <div class="form-grid">
              <div>
                <label>To</label>
                <input v-model="emailForm.to" placeholder="member@example.com" />
              </div>
              <div>
                <label>Subject</label>
                <input v-model="emailForm.subject" placeholder="Email subject" />
              </div>
            </div>
            <div class="body-wrap">
              <label>Body</label>
              <textarea v-model="emailForm.body" rows="12"></textarea>
            </div>
            <button @click="sendEmail">Send</button>
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
      emailForm: {
        to: '',
        subject: '',
        body: ''
      },
      mockEmails: [
        { id: 1, sender: 'Task Manager', subject: 'Welcome to your workspace', time: '12:15 PM' },
        { id: 2, sender: 'Admin', subject: 'Task assigned: {{taskTitle}}', time: '11:22 AM' },
        { id: 3, sender: 'Notifications', subject: 'Reminder: Due date is coming soon', time: '10:04 AM' },
        { id: 4, sender: 'Project Bot', subject: 'You were invited to {{projectName}}', time: '9:45 AM' }
      ],
      templates: [
        {
          id: 'welcome',
          name: 'Welcome Member',
          subject: 'Welcome to {{projectName}}',
          body:
            'Hi {{memberName}},\n\nWelcome to {{projectName}}! Your account is active and you can now view your tasks and updates.\n\nRegards,\n{{adminName}}'
        },
        {
          id: 'assignment',
          name: 'Task Assignment',
          subject: 'New Task Assigned: {{taskTitle}}',
          body:
            'Hi {{memberName}},\n\nYou have been assigned a new task:\n- Task: {{taskTitle}}\n- Project: {{projectName}}\n- Due: {{dueDate}}\n\nPlease update progress in the board.\n\nThanks,\n{{adminName}}'
        },
        {
          id: 'reminder',
          name: 'Due Reminder',
          subject: 'Reminder: {{taskTitle}} is due soon',
          body:
            'Hi {{memberName}},\n\nFriendly reminder that {{taskTitle}} is due on {{dueDate}}.\n\nIf you need support, reply to this email.\n\nRegards,\n{{adminName}}'
        },
        {
          id: 'completed',
          name: 'Task Completed',
          subject: 'Task Completed: {{taskTitle}}',
          body:
            'Hi Team,\n\n{{memberName}} has marked the following task as completed:\n- Task: {{taskTitle}}\n- Project: {{projectName}}\n\nPlease review and confirm.\n\nThanks,\nTask Manager'
        },
        {
          id: 'invite',
          name: 'Project Invite',
          subject: 'You are invited to {{projectName}}',
          body:
            'Hi {{memberName}},\n\nYou have been invited to join {{projectName}}.\n\nClick the app link, open Projects, and join the project.\n\nRegards,\n{{adminName}}'
        }
      ]
    };
  },
  computed: {
    activeTemplate() {
      return this.templates.find((t) => t.id === this.selectedTemplateId) || null;
    },
    currentPanelTitle() {
      const titles = {
        inbox: 'Inbox',
        starred: 'Starred',
        snoozed: 'Snoozed',
        sent: 'Sent',
        drafts: 'Drafts',
        compose: 'Compose'
      };
      return titles[this.activePanel] || 'Inbox';
    }
  },
  watch: {
    selectedTemplateId() {
      this.applySelectedTemplate();
    }
  },
  mounted() {
    this.applySelectedTemplate();
  },
  methods: {
    applySelectedTemplate() {
      if (!this.activeTemplate) return;
      this.emailForm.subject = this.activeTemplate.subject;
      this.emailForm.body = this.activeTemplate.body;
    },
    async copyTemplate() {
      if (!this.activeTemplate) return;
      const content = `Subject: ${this.emailForm.subject}\n\n${this.emailForm.body}`;
      try {
        await navigator.clipboard.writeText(content);
        this.copied = true;
        setTimeout(() => {
          this.copied = false;
        }, 1500);
      } catch (err) {
        this.copied = false;
      }
    },
    async sendEmail() {
      if (!this.emailForm.to || !this.emailForm.subject || !this.emailForm.body) {
        toast.error('Please fill recipient, subject, and body.');
        return;
      }

      try {
        const res = await api.post('/email/send', this.emailForm);
        toast.success(res.data.message || 'Email sent successfully');
        this.emailForm.to = '';
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to send email');
      }
    }
  }
};
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.95);
}

.gmail-page {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 14px;
  min-height: 78vh;
}

.left-nav {
  background: #f1f3f4;
  border: 1px solid #e0e3e7;
  border-radius: 16px;
  padding: 12px;
}

.compose-btn {
  width: 100%;
  background: #c2e7ff;
  color: #001d35;
  margin-bottom: 12px;
}

.left-nav ul {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 6px;
}

.left-nav li {
  padding: 8px 10px;
  border-radius: 999px;
  color: #3c4043;
  cursor: pointer;
  font-weight: 600;
  font-size: 14px;
}

.left-nav li.active,
.left-nav li:hover {
  background: #d3e3fd;
  color: #174ea6;
}

.mail-area {
  padding: 0;
  overflow: hidden;
}

.top-tabs {
  display: flex;
  gap: 20px;
  padding: 12px 16px;
  border-bottom: 1px solid #e5e9ef;
  background: #fff;
}

.tab {
  color: #5f6368;
  font-weight: 600;
  padding-bottom: 8px;
}

.tab.active {
  color: #1a73e8;
  border-bottom: 2px solid #1a73e8;
}

.inbox-list {
  background: #fff;
}

.mail-row {
  display: grid;
  grid-template-columns: 200px 1fr 90px;
  gap: 12px;
  padding: 10px 16px;
  border-bottom: 1px solid #edf1f5;
  font-size: 14px;
  align-items: center;
}

.mail-row:hover {
  background: #f8fbff;
}

.sender {
  font-weight: 600;
  color: #3c4043;
}

.subject {
  color: #3c4043;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.time {
  color: #5f6368;
  font-size: 12px;
  text-align: right;
}

.compose-panel {
  padding: 14px;
}

.compose-panel h3 {
  margin-bottom: 10px;
  color: #202124;
}

.card-lite {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  background: #fff;
}

.templates {
  margin-bottom: 12px;
}

.design-row {
  display: grid;
  grid-template-columns: 120px 240px;
  align-items: center;
  gap: 10px;
}

.ghost-btn {
  background: #e8f0fe;
  color: #174ea6;
  margin-top: 10px;
}

.success {
  margin-top: 8px;
  color: #166534;
}

.error {
  margin-top: 8px;
  color: #dc2626;
}

.send-box {
  border: 1px solid #dbeafe;
  box-shadow: 0 8px 22px rgba(15, 23, 42, 0.06);
}

.send-box h3 {
  margin-bottom: 10px;
  color: #1e1b4b;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-bottom: 10px;
}

label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #475569;
}

textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  resize: vertical;
  font: inherit;
}

textarea:focus {
  outline: none;
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.body-wrap {
  margin-bottom: 12px;
}

.send-box button {
  border-radius: 18px;
  padding-left: 18px;
  padding-right: 18px;
}

@media (max-width: 860px) {
  .gmail-page {
    grid-template-columns: 1fr;
  }

  .design-row {
    grid-template-columns: 1fr;
  }

  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
