<template>
  <div class="p-5 space-y-5">

    <!-- Header -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <p class="text-sm text-slate-500">
        {{ isAdminUser ? 'Create and manage all projects.' : 'Join a project to access its tasks.' }}
      </p>
      <button v-if="isAdminUser" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" type="button" @click="openAddModal">
        + Add project
      </button>
    </div>

    <p v-if="!isAdminUser" class="text-sm text-slate-400">Join projects below to see their tasks in the board.</p>

    <!-- Project grid -->
    <ul class="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 p-0 m-0 list-none">
      <li
        v-for="project in projects"
        :key="project.id"
        class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col gap-3 relative hover:shadow-md transition group"
      >
        <!-- Edit button -->
        <button
          v-if="isAdminUser"
          class="absolute top-3 right-3 w-7 h-7 rounded-lg border-none bg-transparent text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
          type="button"
          aria-label="Edit project"
          @click="startEdit(project)"
        >
          <Pencil class="w-3.5 h-3.5" />
        </button>

        <div class="flex-1">
          <p class="font-bold text-slate-900 text-base mb-1 pr-6">{{ project.name }}</p>
          <p class="text-sm text-slate-400 leading-snug">{{ project.description || 'No description' }}</p>
        </div>

        <div class="flex gap-2 pt-1 border-t border-slate-100">
          <button v-if="isAdminUser" class="px-3 py-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-xs transition border-none cursor-pointer" @click="confirmDelete(project)">Delete</button>
          <button v-if="!isAdminUser" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 font-semibold text-xs transition border-none cursor-pointer" @click="joinProject(project.id)">
            <Users class="w-3.5 h-3.5" /> Join
          </button>
        </div>
      </li>
    </ul>

    <ConfirmModal
      v-model="showConfirm"
      title="Delete project?"
      :message="confirmTarget ? `'${confirmTarget.name}' and all its tasks will be permanently deleted.` : ''"
      @confirm="runDelete"
    />

    <!-- Project modal -->
    <BaseModal v-model="showProjectModal" :title="editingProjectId ? 'Update project' : 'Add project'">
      <div class="space-y-4">
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Project name</label>
          <input v-model="name" placeholder="Project name" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div>
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
          <input v-model="description" placeholder="Description" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
        </div>
        <div v-if="isAdminUser">
          <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Project members</label>
          <div class="border border-slate-200 rounded-xl p-3 bg-white max-h-52 overflow-auto space-y-2">
            <label v-for="m in members" :key="m.id" class="flex items-center gap-3 cursor-pointer select-none">
              <input type="checkbox" :value="String(m.id)" v-model="selectedMemberIds" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span class="text-sm text-slate-800">{{ m.email }}<span v-if="m.username" class="text-slate-400"> ({{ m.username }})</span></span>
            </label>
          </div>
          <p class="text-xs text-slate-400 mt-1">Select members to include in this project.</p>
        </div>
      </div>
      <template #footer>
        <button class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border-none cursor-pointer" type="button" @click="closeProjectModal">Cancel</button>
        <button class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" type="button" @click="saveProject">{{ editingProjectId ? 'Update' : 'Add' }}</button>
      </template>
    </BaseModal>

  </div>
</template>

<script>
import api from '../api/api';
import { isAdmin } from '@/utils/auth';
import { Pencil, Users } from 'lucide-vue-next';
import { toast } from '@/utils/toast';
import BaseModal from '@/components/baseModal.vue';
import ConfirmModal from '@/components/confirmModal.vue';

export default {
  components: { Pencil, Users, BaseModal, ConfirmModal },
  data() {
    return { name: '', description: '', projects: [], members: [], selectedMemberIds: [], editingProjectId: null, isAdminUser: false, showProjectModal: false, showConfirm: false, confirmTarget: null };
  },
  mounted() {
    this.isAdminUser = isAdmin();
    this.fetchProjects();
    if (this.isAdminUser) this.fetchMembers();
  },
  methods: {
    async fetchMembers() {
      try { const res = await api.get('/auth/members'); this.members = res.data || []; }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to load members'); }
    },
    async fetchProjectMembers(projectId) {
      try { const res = await api.get(`/projects/${projectId}/members`); this.selectedMemberIds = (res.data || []).map(u => String(u.id)); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to load project members'); }
    },
    async saveSelectedMembers(projectId) {
      const desired = new Set((this.selectedMemberIds || []).map(String));
      await Promise.allSettled([...desired].map(id => api.post(`/projects/${projectId}/members`, { user_id: id })));
    },
    async fetchProjects() {
      try { const res = await api.get('/projects'); this.projects = res.data; }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to load projects'); }
    },
    async saveProject() {
      if (!this.name) { toast.error('Project name is required'); return; }
      try {
        if (this.editingProjectId) {
          await api.put(`/projects/${this.editingProjectId}`, { name: this.name, description: this.description });
          await this.saveSelectedMembers(this.editingProjectId);
          toast.success('Project updated');
        } else {
          const created = await api.post('/projects', { name: this.name, description: this.description });
          const newId = created.data?.id;
          if (newId) await this.saveSelectedMembers(newId);
          toast.success('Project created');
        }
        this.closeProjectModal();
        this.fetchProjects();
      } catch (err) { toast.error(err.response?.data?.message || 'Failed to save project'); }
    },
    confirmDelete(project) { this.confirmTarget = project; this.showConfirm = true; },
    async runDelete() {
      if (!this.confirmTarget) return;
      try { await api.delete(`/projects/${this.confirmTarget.id}`); toast.success('Project deleted'); this.confirmTarget = null; this.fetchProjects(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to delete project'); }
    },
    async deleteProject(id) {
      try { await api.delete(`/projects/${id}`); toast.success('Project deleted'); this.fetchProjects(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to delete project'); }
    },
    async joinProject(id) {
      try { await api.post(`/projects/${id}/join`); toast.success('Joined project'); this.fetchProjects(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to join project'); }
    },
    startEdit(project) {
      this.editingProjectId = project.id; this.name = project.name; this.description = project.description || '';
      this.selectedMemberIds = []; this.fetchProjectMembers(project.id); this.showProjectModal = true;
    },
    openAddModal() { this.editingProjectId = null; this.name = ''; this.description = ''; this.selectedMemberIds = []; this.showProjectModal = true; },
    closeProjectModal() { this.showProjectModal = false; this.editingProjectId = null; this.name = ''; this.description = ''; this.selectedMemberIds = []; }
  }
};
</script>
