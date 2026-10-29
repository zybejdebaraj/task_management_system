<template>
  <div class="space-y-4">

    <!-- Template picker -->
    <div v-if="!editingTask && templates.length" class="flex items-center gap-2">
      <select v-model="selectedTemplate" @change="applyTemplate" class="flex-1 block rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
        <option value="">Load a template...</option>
        <option v-for="t in templates" :key="t.id" :value="t.id">{{ t.name }}</option>
      </select>
    </div>

    <div class="grid gap-4">
      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Title</label>
        <input v-model="title" placeholder="New task..." class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Project</label>
        <select v-model="projectId" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option disabled value="">Select project</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">{{ project.name }}</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Assign to member</label>
        <select v-model="assigneeId" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option disabled value="">{{ projectId ? (assigneeOptions.length ? 'Assign to member' : 'No members in this project') : 'Select project first' }}</option>
          <option v-for="member in assigneeOptions" :key="member.id" :value="member.id">{{ member.email }}</option>
        </select>
      </div>

      <div v-if="canEditStatus">
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Status</label>
        <select v-model="status" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Priority</label>
        <select v-model="priority" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Description</label>
        <textarea v-model="description" rows="3" placeholder="Add extra details..." class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 resize-y"></textarea>
      </div>

      <label class="flex items-center gap-3 cursor-pointer">
        <input id="is-big-task" v-model="isBig" type="checkbox" class="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
        <span class="text-sm font-medium text-slate-700">Big task (with checklist)</span>
      </label>

      <div v-if="!editingTask">
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Attachments</label>
        <input type="file" multiple @change="handleAttachments" class="block w-full text-sm text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-indigo-50 file:text-indigo-600 file:font-semibold hover:file:bg-indigo-100" />
        <p class="text-xs text-slate-400 mt-1">Optional. Up to 5 files.</p>
      </div>

      <div>
        <label class="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Due Date</label>
        <input v-model="dueDate" type="datetime-local" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
      </div>
    </div>

    <p v-if="error" class="text-red-600 text-sm">{{ error }}</p>

    <div class="flex gap-3 justify-between pt-2">
      <button v-if="!editingTask && isAdminUser" type="button" class="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 font-semibold text-xs border-none cursor-pointer" @click="saveAsTemplate">Save as template</button>
      <div class="flex gap-3 ml-auto">
        <button v-if="editingTask" type="button" class="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition border-none cursor-pointer" @click="cancelEdit">Cancel</button>
        <button type="button" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" @click="createTask">
          {{ editingTask ? 'Update' : 'Add task' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import { getUser } from '@/utils/auth';
import { toLocalDateTime } from '@/utils/date';
import { toast } from '@/utils/toast';

export default {
  props: ['editingTask', 'projects'],
  data() {
    return {
      title: '', projectId: '', assigneeId: '', users: [], projectMembers: [],
      status: 'todo', priority: 'medium', dueDate: '', description: '', isBig: false,
      attachments: [], error: '', user: null,
      templates: [], selectedTemplate: '',
    };
  },
  computed: {
    isAdminUser() { return this.user?.role === 'admin'; },
    assigneeOptions() {
      const memberIdSet = new Set(this.projectMembers.map(m => Number(m.id)));
      return this.users.filter(u => u.role !== 'admin').filter(u => memberIdSet.has(Number(u.id)));
    },
    canEditStatus() {
      if (!this.editingTask) return false;
      if (!this.editingTask.user_id) return false;
      return Number(this.editingTask.user_id) === Number(this.user?.id);
    }
  },
  mounted() {
    this.user = getUser();
    if (!this.isAdminUser && this.user?.id) this.assigneeId = this.user.id;
    if (this.isAdminUser) {
      this.loadTemplates();
      if (this.projectId) this.refreshAssigneeData();
    }
  },
  watch: {
    editingTask: {
      immediate: true,
      handler(newTask) {
        if (newTask) {
          this.title = newTask.title;
          this.status = newTask.status;
          this.projectId = newTask.project_id;
          this.assigneeId = newTask.user_id || '';
          this.priority = newTask.priority || 'medium';
          this.description = newTask.description || '';
          this.isBig = !!newTask.is_big;
          this.dueDate = toLocalDateTime(newTask.due_date);
          if (this.isAdminUser) this.refreshAssigneeData();
        }
      }
    },
    projectId(projectId) {
      if (this.isAdminUser) {
        if (!this.editingTask || Number(projectId) !== Number(this.editingTask.project_id)) {
          this.assigneeId = '';
        }
        this.refreshAssigneeData();
      }
      else if (this.user?.id) this.assigneeId = this.user.id;
    }
  },
  methods: {
    async loadTemplates() {
      try { const res = await api.get('/tasks/templates'); this.templates = res.data; }
      catch { /* silent */ }
    },
    applyTemplate() {
      const t = this.templates.find(t => t.id === Number(this.selectedTemplate));
      if (!t) return;
      this.title = t.title;
      this.description = t.description || '';
      this.priority = t.priority;
      this.isBig = t.is_big;
    },
    async saveAsTemplate() {
      if (!this.title.trim()) { toast.error('Add a title first'); return; }
      const name = prompt('Template name:');
      if (!name) return;
      try {
        await api.post('/tasks/templates', { name, title: this.title, description: this.description, priority: this.priority, is_big: this.isBig });
        toast.success('Template saved');
        await this.loadTemplates();
      } catch { toast.error('Failed to save template'); }
    },
    async refreshAssigneeData() {
      this.users = []; this.projectMembers = [];
      if (!this.projectId) return;
      try {
        const [usersResult, membersResult] = await Promise.allSettled([api.get('/auth/users'), api.get(`/projects/${this.projectId}/members`)]);
        if (usersResult.status === 'fulfilled') this.users = usersResult.value.data || [];
        if (membersResult.status === 'fulfilled') this.projectMembers = membersResult.value.data || [];
      } catch (err) { this.error = 'Failed to load assignee data'; }
    },
    async createTask() {
      if (!this.title.trim()) { this.error = 'Title is required'; return; }
      if (!this.projectId && !this.editingTask) { this.error = 'Project is required'; return; }
      if (!this.assigneeId && this.editingTask && this.isAdminUser && this.user?.id) this.assigneeId = this.user.id;
      if (!this.assigneeId && !this.editingTask) { this.error = 'Assignee is required'; return; }
      try {
        this.error = '';
        if (this.editingTask) {
          const payload = { title: this.title, description: this.description || null, priority: this.priority, due_date: this.dueDate || null, is_big: this.isBig };
          if (this.canEditStatus) payload.status = this.status;
          if (this.projectId) payload.project_id = this.projectId;
          if (this.assigneeId) payload.user_id = this.assigneeId;
          await api.put(`/tasks/${this.editingTask.id}`, payload);
          toast.success('Task updated'); this.$emit('taskUpdated');
        } else {
          const formData = new FormData();
          formData.append('title', this.title);
          formData.append('description', this.description || '');
          formData.append('project_id', this.projectId);
          formData.append('user_id', this.assigneeId);
          formData.append('priority', this.priority);
          formData.append('is_big', this.isBig);
          if (this.dueDate) formData.append('due_date', this.dueDate);
          this.attachments.forEach(file => formData.append('attachments', file));
          await api.post('/tasks', formData);
          toast.success('Task created'); this.$emit('taskCreated');
        }
        this.resetForm();
      } catch (err) { this.error = err.response?.data?.message || 'Failed to save task'; toast.error(this.error); }
    },
    cancelEdit() { this.resetForm(); this.$emit('cancelEdit'); },
    handleAttachments(event) { this.attachments = Array.from(event.target.files).slice(0, 5); },
    resetForm() {
      this.title = ''; this.status = 'todo'; this.priority = 'medium'; this.description = '';
      this.isBig = false; this.dueDate = ''; this.attachments = [];
      this.projectId = ''; this.assigneeId = this.isAdminUser ? '' : (this.user?.id || '');
      this.users = []; this.projectMembers = []; this.error = ''; this.selectedTemplate = '';
    }
  }
};
</script>
