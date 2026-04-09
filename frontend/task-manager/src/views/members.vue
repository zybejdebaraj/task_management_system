<template>
  <div class="page-shell">
    <div class="card glass-card">
      <h2>Members</h2>
      <p v-if="!isAdminUser">Only admins can add members to the system.</p>

      <div v-else class="members-panel">
        <h3>Add New Member</h3>
        <div class="form-grid">
          <input v-model="email" type="email" placeholder="Member email" />
          <input v-model="password" type="password" placeholder="Temporary password" />
          <button @click="createMember">Add Member</button>
        </div>
        <p v-if="message" class="success">{{ message }}</p>
        <p v-if="error" class="error">{{ error }}</p>

        <h3 class="list-title">System Members</h3>
        <div class="table-wrap">
          <table>
            <thead>
              <tr>
                <th>ID</th>
                <th>Email</th>
                <th>Role</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="user in users" :key="user.id">
                <td>{{ user.id }}</td>
                <td>{{ user.email }}</td>
                <td>
                  <span class="role" :class="user.role">{{ user.role }}</span>
                </td>
                <td>{{ formatDate(user.created_at) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import { isAdmin } from '@/utils/auth';

export default {
  data() {
    return {
      email: '',
      password: '',
      users: [],
      error: '',
      message: '',
      isAdminUser: false
    };
  },
  async mounted() {
    this.isAdminUser = isAdmin();
    if (this.isAdminUser) {
      await this.fetchUsers();
    }
  },
  methods: {
    async fetchUsers() {
      try {
        const res = await api.get('/auth/members');
        this.users = res.data;
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to load users';
      }
    },
    async createMember() {
      this.error = '';
      this.message = '';

      if (!this.email || !this.password) {
        this.error = 'Email and password are required';
        return;
      }

      try {
        await api.post('/auth/admin/members', {
          email: this.email,
          password: this.password
        });

        this.message = 'Member added successfully';
        this.email = '';
        this.password = '';
        await this.fetchUsers();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to add member';
      }
    },
    formatDate(value) {
      if (!value) return '-';
      return new Date(value).toLocaleString();
    }
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

.card p {
  color: #64748b;
}

.members-panel {
  margin-top: 16px;
}

.members-panel h3 {
  margin-bottom: 10px;
}

.form-grid {
  display: grid;
  grid-template-columns: 1fr 1fr auto;
  gap: 10px;
  margin-bottom: 10px;
}

.success {
  color: #166534;
  margin-bottom: 8px;
}

.error {
  color: #dc2626;
  margin-bottom: 8px;
}

.list-title {
  margin-top: 16px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  text-align: left;
  padding: 10px;
  border-bottom: 1px solid #e2e8f0;
}

th {
  color: #475569;
  font-size: 13px;
}

.role {
  display: inline-block;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 600;
}

.role.admin {
  background: #fee2e2;
  color: #991b1b;
}

.role.member {
  background: #dcfce7;
  color: #166534;
}

@media (max-width: 900px) {
  .form-grid {
    grid-template-columns: 1fr;
  }
}
</style>
