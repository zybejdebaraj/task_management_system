<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>Register</h2>
      <p class="subtitle">Create your account to start managing tasks.</p>

      <div class="form-group">
        <label>Username</label>
        <input v-model="username" placeholder="Username" />
      </div>
      <div class="form-group">
        <label>Email</label>
        <input v-model="email" placeholder="Email" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" placeholder="Password" />
      </div>

      <div class="form-group">
        <label>Role</label>
        <select v-model="role">
          <option value="member">Member</option>
          <option value="admin">Admin</option>
        </select>
      </div>

      <button class="submit-btn" @click="register">Register</button>

      <p class="link" @click="$router.push('/login')">
        Go to Login
      </p>
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
      email: '',
      password: '',
      role: 'member',
      error: ''
    };
  },

  methods: {
    async register() {
      // ✅ VALIDATION FIRST
      if (!this.email || !this.password) {
        toast.error('Email and password are required');
        return;
      }

      this.error = '';

      try {
        await api.post('/auth/register', {
          username: this.username?.trim() || null,
          email: this.email,
          password: this.password,
          role: this.role
        });

        toast.success('Registered successfully');
        this.$router.push('/login');

      } catch (err) {
        toast.error(err.response?.data?.message || 'Register failed');
      }
    }
  }
};
</script>

<style scoped>
.auth-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
}

.auth-box {
  background: white;
  padding: 28px;
  width: 360px;
  border-radius: 16px;
  border: 1px solid #e2e8f0;
  box-shadow: 0 14px 30px rgba(15, 23, 42, 0.08);
}

.auth-box h2 {
  margin-bottom: 6px;
}

.subtitle {
  color: #64748b;
  margin-bottom: 18px;
}

.form-group {
  margin-bottom: 14px;
}

.form-group label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #475569;
}

select {
  width: 100%;
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #cbd5e1;
  font-size: 15px;
  outline: none;
  background: white;
}

select:focus {
  border-color: #6366f1;
}

.submit-btn {
  width: 100%;
  margin-top: 4px;
}

.link {
  margin-top: 16px;
  color: #4338ca;
  font-weight: 600;
  cursor: pointer;
  text-align: center;
}
.error {
  color: #dc2626;
  margin-top: 4px;
  margin-bottom: 12px;
}
</style>