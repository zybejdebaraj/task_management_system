<template>
  <div class="page-shell">
    <div class="card glass-card">
      <section class="section">
        <h3>Profile</h3>
        <div class="grid">
          <div>
            <label>Username</label>
            <input v-model="profile.username" placeholder="Your username" />
          </div>
          <div>
            <label>Email</label>
            <input v-model="profile.email" type="email" placeholder="you@email.com" />
          </div>
          <div>
            <label>Timezone</label>
            <select v-model="profile.timezone">
              <option value="UTC">UTC</option>
              <option value="Africa/Nairobi">Africa/Nairobi</option>
              <option value="Europe/London">Europe/London</option>
              <option value="America/New_York">America/New_York</option>
              <option value="Asia/Dubai">Asia/Dubai</option>
            </select>
          </div>
          <div>
            <label>Language</label>
            <select v-model="profile.language">
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="es">Spanish</option>
            </select>
          </div>
        </div>
        <button @click="saveProfile">Save Profile</button>
      </section>

      <section class="section">
        <h3>Password</h3>
        <div class="grid">
          <div>
            <label>Current Password</label>
            <input v-model="password.currentPassword" type="password" placeholder="Current password" />
          </div>
          <div>
            <label>New Password</label>
            <input v-model="password.newPassword" type="password" placeholder="New password" />
          </div>
        </div>
        <button @click="savePassword">Change Password</button>
      </section>

      <section class="section">
        <h3>Preferences</h3>
        <div class="toggles">
          <label class="toggle">
            <input v-model="preferences.notifications_enabled" type="checkbox" />
            <span>Email / in-app notifications</span>
          </label>
          <label class="toggle">
            <input v-model="preferences.dark_mode" type="checkbox" />
            <span>Dark mode</span>
          </label>
        </div>
        <button @click="savePreferences">Save Preferences</button>
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
      profile: {
        username: '',
        email: '',
        timezone: 'UTC',
        language: 'en'
      },
      password: {
        currentPassword: '',
        newPassword: ''
      },
      preferences: {
        notifications_enabled: true,
        dark_mode: false
      },
      message: '',
      error: ''
    };
  },
  async mounted() {
    await this.loadSettings();
  },
  methods: {
    async loadSettings() {
      try {
        const res = await api.get('/auth/me');
        this.profile.username = res.data.username || '';
        this.profile.email = res.data.email || '';
        this.profile.timezone = res.data.timezone || 'UTC';
        this.profile.language = res.data.language || 'en';
        this.preferences.notifications_enabled = !!res.data.notifications_enabled;
        this.preferences.dark_mode = !!res.data.dark_mode;
        this.applyTheme(this.preferences.dark_mode);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load settings');
      }
    },
    applyTheme(isDark) {
      document.body.classList.toggle('dark-mode', isDark);
    },
    clearMessages() {
      this.error = '';
      this.message = '';
    },
    async saveProfile() {
      this.clearMessages();
      try {
        await api.put('/auth/me/profile', this.profile);
        toast.success('Profile updated');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update profile');
      }
    },
    async savePassword() {
      this.clearMessages();
      try {
        await api.put('/auth/me/password', this.password);
        this.password.currentPassword = '';
        this.password.newPassword = '';
        toast.success('Password changed successfully');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to change password');
      }
    },
    async savePreferences() {
      this.clearMessages();
      try {
        await api.put('/auth/me/preferences', this.preferences);
        this.applyTheme(this.preferences.dark_mode);
        toast.success('Preferences updated');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to update preferences');
      }
    },
  }
};
</script>

<style scoped>
.card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 20px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.07);
}

.card h2 {
  margin-bottom: 10px;
}

.sub {
  color: #64748b;
  margin-bottom: 16px;
}

.section {
  padding-top: 10px;
}

.section h3 {
  margin-bottom: 10px;
}

.grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 12px;
  margin-bottom: 10px;
}

label {
  display: block;
  font-size: 13px;
  color: #475569;
  margin-bottom: 6px;
}

.toggles {
  display: grid;
  gap: 10px;
  margin-bottom: 10px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 8px;
}

.helper {
  color: #64748b;
  margin-bottom: 10px;
}

.toggle input {
  width: 16px;
  height: 16px;
}

.success {
  color: #166534;
  margin-bottom: 8px;
}

.error {
  color: #dc2626;
  margin-bottom: 8px;
}
</style>
