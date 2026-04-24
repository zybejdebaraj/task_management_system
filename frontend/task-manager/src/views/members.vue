<template>
  <div class="p-5 space-y-5">

    <div v-if="!isAdminUser" class="bg-amber-50 border border-amber-200 text-amber-700 rounded-2xl px-5 py-4 text-sm font-medium">
      Only admins can manage members.
    </div>

    <div v-else class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <!-- Panel header -->
      <div class="flex items-center justify-between px-5 py-4 border-b border-slate-100">
        <h3 class="font-bold text-slate-800">Team members</h3>
        <button class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" type="button" @click="openAddModal">
          + Add member
        </button>
      </div>

      <p v-if="message" class="mx-5 mt-3 text-sm text-green-700 font-medium">{{ message }}</p>
      <p v-if="error" class="mx-5 mt-3 text-sm text-red-600 font-medium">{{ error }}</p>

      <!-- Table -->
      <div class="overflow-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 text-slate-400 text-xs uppercase tracking-wide border-b border-slate-100">
              <th class="text-left px-5 py-3 font-semibold">Email</th>
              <th class="text-left px-5 py-3 font-semibold">Role</th>
              <th class="text-left px-5 py-3 font-semibold">Created</th>
              <th class="px-5 py-3"></th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-for="user in users" :key="user.id" class="hover:bg-slate-50 transition">
              <td class="px-5 py-3 font-medium text-slate-800">{{ user.email }}</td>
              <td class="px-5 py-3">
                <span :class="user.role === 'admin' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'" class="text-xs font-bold px-2.5 py-0.5 rounded-full">{{ user.role }}</span>
              </td>
              <td class="px-5 py-3 text-slate-400 text-xs">{{ formatDate(user.created_at) }}</td>
              <td class="px-5 py-3">
                <div class="flex items-center justify-end gap-1">
                  <button class="w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition cursor-pointer" type="button" aria-label="Edit" @click="startEdit(user)">
                    <Pencil class="w-3.5 h-3.5" />
                  </button>
                  <button class="w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:bg-red-50 hover:text-red-600 flex items-center justify-center transition cursor-pointer" type="button" aria-label="Delete" @click="confirmDelete(user)">
                    <Trash2 class="w-3.5 h-3.5" />
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <ConfirmModal
      v-model="showConfirm"
      title="Delete member?"
      :message="confirmTarget ? `'${confirmTarget.email}' will be permanently removed from the system.` : ''"
      @confirm="runDelete"
    />

    <!-- Member modal -->
    <BaseModal v-model="showMemberModal" :title="editingMemberId ? 'Update member' : 'Add member'">
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Username</label>
          <input v-model="username" placeholder="Username" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Email</label>
          <input v-model="email" type="email" placeholder="member@example.com" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div class="sm:col-span-2">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">{{ editingMemberId ? 'New password (optional)' : 'Temporary password' }}</label>
          <input v-model="password" type="password" :placeholder="editingMemberId ? 'Leave blank to keep current' : 'Temporary password'" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
      </div>
      <template #footer>
        <button class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border-none cursor-pointer" type="button" @click="closeMemberModal">Cancel</button>
        <button class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" type="button" @click="submitMember">{{ editingMemberId ? 'Update' : 'Add' }}</button>
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
import ConfirmModal from '@/components/confirmModal.vue';

export default {
  components: { Pencil, Trash2, BaseModal, ConfirmModal },
  data() {
    return { username: '', email: '', password: '', users: [], error: '', message: '', isAdminUser: false, editingMemberId: null, showMemberModal: false, showConfirm: false, confirmTarget: null };
  },
  async mounted() {
    this.isAdminUser = isAdmin();
    if (this.isAdminUser) await this.fetchUsers();
  },
  methods: {
    async fetchUsers() {
      try { const res = await api.get('/auth/members'); this.users = res.data; }
      catch (err) { this.error = err.response?.data?.message || 'Failed to load users'; }
    },
    async createMember() {
      this.error = ''; this.message = '';
      if (!this.email || !this.password) { this.error = 'Email and password are required'; return; }
      try {
        await api.post('/auth/admin/members', { username: this.username || undefined, email: this.email, password: this.password });
        toast.success('Member added'); this.username = ''; this.email = ''; this.password = '';
        await this.fetchUsers();
      } catch (err) { this.error = err.response?.data?.message || 'Failed to add member'; toast.error(this.error); }
    },
    async updateMember() {
      this.error = ''; this.message = '';
      if (!this.email) { this.error = 'Email is required'; toast.error(this.error); return; }
      try {
        await api.put(`/auth/admin/members/${this.editingMemberId}`, { username: this.username || undefined, email: this.email, password: this.password || undefined });
        toast.success('Member updated'); this.cancelEdit(); await this.fetchUsers();
      } catch (err) { this.error = err.response?.data?.message || 'Failed to update member'; toast.error(this.error); }
    },
    submitMember() { if (this.editingMemberId) return this.updateMember(); return this.createMember(); },
    openAddModal() { this.editingMemberId = null; this.username = ''; this.email = ''; this.password = ''; this.showMemberModal = true; },
    startEdit(user) { this.editingMemberId = user.id; this.username = user.username || ''; this.email = user.email; this.password = ''; this.showMemberModal = true; },
    closeMemberModal() { this.showMemberModal = false; this.cancelEdit(); },
    cancelEdit() { this.editingMemberId = null; this.username = ''; this.email = ''; this.password = ''; },
    confirmDelete(user) { this.confirmTarget = user; this.showConfirm = true; },
    async runDelete() {
      if (!this.confirmTarget) return;
      this.error = ''; this.message = '';
      try { await api.delete(`/auth/admin/members/${this.confirmTarget.id}`); toast.success('Member deleted'); this.confirmTarget = null; await this.fetchUsers(); }
      catch (err) { this.error = err.response?.data?.message || 'Failed to delete member'; toast.error(this.error); }
    },
    async deleteMember(id) {
      this.error = ''; this.message = '';
      try { await api.delete(`/auth/admin/members/${id}`); toast.success('Member deleted'); await this.fetchUsers(); }
      catch (err) { this.error = err.response?.data?.message || 'Failed to delete member'; toast.error(this.error); }
    },
    formatDate(value) { if (!value) return '-'; return new Date(value).toLocaleString(); }
  }
};
</script>
