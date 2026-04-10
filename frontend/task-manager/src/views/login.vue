<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>Login</h2>
      <p class="subtitle">Welcome back! Enter your credentials to continue.</p>

      <div class="form-group">
        <label>Email</label>
        <input v-model="email" placeholder="Email" />
      </div>
      <div class="form-group">
        <label>Password</label>
        <input v-model="password" type="password" placeholder="Password" />
      </div>

      <button class="submit-btn" @click="login">Login</button>

      <p class="link" @click="$router.push('/register')">
        Go to Register
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
      email: '',
      password: '',
      error: ''
    };
  },

  methods: {
    async login() {
      if (!this.email || !this.password) {
        toast.error('Email and password are required');
        return;
      }

      this.error = '';

      try {
        const res = await api.post('/auth/login', {
          email: this.email,
          password: this.password
        });

        localStorage.setItem('token', res.data.token);
        toast.success('Logged in');
        this.$router.push('/dashboard');

      } catch (err) {
        toast.error(err.response?.data?.message || 'Login failed');
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