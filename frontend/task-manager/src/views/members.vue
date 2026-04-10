<template>
  <div>
    <div class="page-shell">
      <div class="card glass-card">
        <p v-if="!isAdminUser">Only admins can add members to the system.</p>

        <div v-else class="members-panel">
          <div class="panel-head">
            <button class="add-btn" type="button" @click="openAddModal">Add member</button>
          </div>
          <p v-if="message" class="success">{{ message }}</p>
          <p v-if="error" class="error">{{ error }}</p>

          <div class="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Created</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="user in users" :key="user.id">
                  <td>{{ user.email }}</td>
                  <td>
                    <span class="role" :class="user.role">{{ user.role }}</span>
                  </td>
                  <td>{{ formatDate(user.created_at) }}</td>
                  <td class="actions">
                    <button
                      class="icon-btn"
                      type="button"
                      aria-label="Edit member"
                      @click="startEdit(user)"
                    >
                      <Pencil class="icon" aria-hidden="true" />
                    </button>
                    <button
                      class="icon-btn danger-icon"
                      type="button"
                      aria-label="Delete member"
                      @click="deleteMember(user.id)"
                    >
                      <Trash2 class="icon" aria-hidden="true" />
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>

    <BaseModal v-model="showMemberModal" :title="editingMemberId ? 'Update member' : 'Add member'">
      <div class="modal-grid">
        <div>
          <label>Username</label>
          <input v-model="username" placeholder="Username" />
        </div>
        <div>
          <label>Email</label>
          <input v-model="email" type="email" placeholder="Member email" />
        </div>
        <div>
          <label>{{ editingMemberId ? 'New password (optional)' : 'Temporary password' }}</label>
          <input
            v-model="password"
            type="password"
            :placeholder="editingMemberId ? 'Leave blank to keep current' : 'Temporary password'"
          />
        </div>
      </div>
      <template #footer>
        <button class="ghost" type="button" @click="closeMemberModal">Cancel</button>
        <button type="button" @click="submitMember">{{ editingMemberId ? 'Update' : 'Add' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import api from '../api/api';
import { isAdmin } from '@/utils/auth';
import { toast } from '@/utils/toast';
import { Pencil, Trash2 } from 'lucide-vue-next';
import BaseModal from '@/components/baseModal.vue';

export default {
  components: { Pencil, Trash2, BaseModal },
  data() {
    return {
      username: '',
      email: '',
      password: '',
      users: [],
      error: '',
      message: '',
      isAdminUser: false,
      editingMemberId: null,
      showMemberModal: false
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
          username: this.username || undefined,
          email: this.email,
          password: this.password
        });

        toast.success('Member added');
        this.username = '';
        this.email = '';
        this.password = '';
        await this.fetchUsers();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to add member';
        toast.error(this.error);
      }
    },
    async updateMember() {
      this.error = '';
      this.message = '';

      if (!this.email) {
        this.error = 'Email is required';
        toast.error(this.error);
        return;
      }

      try {
        await api.put(`/auth/admin/members/${this.editingMemberId}`, {
          username: this.username || undefined,
          email: this.email,
          password: this.password || undefined
        });
        toast.success('Member updated');
        this.cancelEdit();
        await this.fetchUsers();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to update member';
        toast.error(this.error);
      }
    },
    submitMember() {
      if (this.editingMemberId) return this.updateMember();
      return this.createMember();
    },
    openAddModal() {
      this.editingMemberId = null;
      this.username = '';
      this.email = '';
      this.password = '';
      this.showMemberModal = true;
    },
    startEdit(user) {
      this.editingMemberId = user.id;
      this.username = user.username || '';
      this.email = user.email;
      this.password = '';
      this.showMemberModal = true;
    },
    closeMemberModal() {
      this.showMemberModal = false;
      this.cancelEdit();
    },
    cancelEdit() {
      this.editingMemberId = null;
      this.username = '';
      this.email = '';
      this.password = '';
    },
    async deleteMember(id) {
      this.error = '';
      this.message = '';
      try {
        await api.delete(`/auth/admin/members/${id}`);
        toast.success('Member deleted');
        await this.fetchUsers();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to delete member';
        toast.error(this.error);
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

.panel-head {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
}

.add-btn {
  white-space: nowrap;
}

.success {
  color: #166534;
  margin-bottom: 8px;
}

.error {
  color: #dc2626;
  margin-bottom: 8px;
}

.actions {
  text-align: right;
}

.icon-btn {
  border: none;
  background: transparent;
  padding: 6px;
  border-radius: 10px;
  cursor: pointer;
  color: #475569;
  transition: 0.2s ease;
}

.icon-btn:hover {
  background: #eef2f7;
  color: #0f172a;
}

.ghost {
  background: #e2e8f0;
  color: #0f172a;
}

.ghost:hover {
  background: #cbd5e1;
}

.danger-icon {
  color: #b91c1c;
}

.danger-icon:hover {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.icon {
  width: 16px;
  height: 16px;
  display: block;
}

.list-title {
  margin: 0;
}

.table-wrap {
  overflow: auto;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #fff;
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
  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }
}

.modal-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.modal-grid > div:last-child {
  grid-column: 1 / -1;
}

.modal-grid label {
  display: block;
  font-size: 13px;
  color: #475569;
  margin-bottom: 6px;
}
</style>
