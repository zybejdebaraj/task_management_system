<template>
  <div class="auth-container">
    <div class="auth-box">
      <h2>Login</h2>

      <input v-model="email" placeholder="Email" />
      <input v-model="password" type="password" placeholder="Password" />

      <p v-if="error" class="error">{{ error }}</p>

      <button @click="login">Login</button>

      <p class="link" @click="$router.push('/register')">
        Go to Register
      </p>
    </div>
  </div>
</template>

<script>
import api from '../api/api';

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
        this.error = 'All fields are required';
        return;
      }

      this.error = '';

      try {
        const res = await api.post('/auth/login', {
          email: this.email,
          password: this.password
        });

        localStorage.setItem('token', res.data.token);
        this.$router.push('/dashboard');

      } catch (err) {
        this.error = err.response?.data?.message || 'Login failed';
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
}

.auth-box {
  background: white;
  padding: 30px;
  width: 300px;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
}

.link {
  margin-top: 10px;
  color: blue;
  cursor: pointer;
  text-align: center;
}

.error {
  color: red;
  margin-top: 10px;
}
</style>