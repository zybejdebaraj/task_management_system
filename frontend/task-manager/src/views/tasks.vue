<template>
  <div class="p-4 space-y-4">

    <!-- Toolbar -->
    <div class="flex items-center justify-end gap-3 flex-wrap">
      <div v-if="user?.role !== 'admin'" class="bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm rounded-xl px-4 py-2 font-medium">
        You can view tasks from projects you joined. Admins manage task creation.
      </div>

      <button
        class="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold text-sm transition border-none cursor-pointer flex items-center gap-2"
        type="button"
        @click="exportCSV"
      >
        <Download class="w-4 h-4" /> Export CSV
      </button>
      <button v-if="user?.role === 'admin'" class="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition border-none cursor-pointer" type="button" @click="openAddTaskModal">
        + Add task
      </button>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 grid sm:grid-cols-2 lg:grid-cols-6 gap-3">
      <input v-model="search" placeholder="Search tasks..." class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500 lg:col-span-2" />
      <select v-model="selectedProject" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
        <option value="">All projects</option>
        <option v-for="project in projects" :key="project.id" :value="project.name">{{ project.name }}</option>
      </select>
      <select v-model="selectedPriority" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
        <option value="">All priorities</option>
        <option value="low">Low</option>
        <option value="medium">Medium</option>
        <option value="high">High</option>
      </select>
      <select v-model="selectedStatus" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
        <option value="">All statuses</option>
        <option value="todo">Todo</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>
      <select v-if="user?.role === 'admin'" v-model="selectedAssignee" class="block w-full rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500">
        <option value="">All assignees</option>
        <option v-for="a in uniqueAssignees" :key="a.id" :value="a.id">{{ a.label }}</option>
      </select>
      <div class="flex items-center gap-4">
        <label class="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap">
          <input v-model="showOnlyOverdue" type="checkbox" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          Overdue
        </label>
        <label class="flex items-center gap-1.5 text-xs font-medium text-slate-600 cursor-pointer whitespace-nowrap">
          <input v-model="showOnlyBig" type="checkbox" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          Big tasks
        </label>
      </div>
    </div>

    <p v-if="error" class="text-red-600 text-sm font-medium">{{ error }}</p>

    <!-- Empty state for members not yet added to any project -->
    <div v-if="user?.role !== 'admin' && !tasks.length && !projects.length" class="bg-indigo-50 border border-indigo-100 rounded-2xl px-6 py-10 text-center space-y-2">
      <p class="text-indigo-700 font-semibold text-base">You haven't been added to any project yet.</p>
      <p class="text-indigo-500 text-sm">Ask your admin to add you to a project so your tasks will appear here.</p>
    </div>

    <!-- Kanban board -->
    <div class="grid lg:grid-cols-3 gap-4">
      <section
        v-for="col in columns"
        :key="col.status"
        class="rounded-2xl border-2 p-3 min-h-64 transition-all"
        :class="columnClass(col.status, dragOverColumn === col.status)"
        @dragover.prevent="dragOverColumn = col.status"
        @dragleave="dragOverColumn = null"
        @drop.prevent="onDrop(col.status)"
      >
        <!-- Column header -->
        <div class="flex items-center justify-between mb-3 px-1">
          <div class="flex items-center gap-2">
            <span class="w-2.5 h-2.5 rounded-full shrink-0" :class="colDotClass(col.status)"></span>
            <h3 class="font-bold text-sm text-slate-700">{{ col.label }}</h3>
          </div>
          <span class="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{{ groupedTasks[col.status].length }}</span>
        </div>

        <!-- Cards -->
        <div
          v-for="task in groupedTasks[col.status]"
          :key="task.id"
          draggable="true"
          class="transition-all mb-3"
          :class="draggingTask?.id === task.id ? 'opacity-40 scale-95' : 'cursor-grab active:cursor-grabbing'"
          @dragstart="onDragStart(task)"
          @dragend="onDragEnd"
        >
          <TaskCard
            :task="task"
            :canManage="user?.role === 'admin'"
            :viewerUserId="user?.id"
            @deleted="getTasks"
            @updated="getTasks"
            @edit="handleEdit"
            @move="handleMove"
            @details="openDetails"
          />
        </div>

        <!-- Empty drop zone -->
        <div v-if="groupedTasks[col.status].length === 0" class="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center text-slate-400 text-xs font-medium pointer-events-none">
          Drop tasks here
        </div>
      </section>
    </div>

    <!-- Task modal -->
    <BaseModal v-model="showTaskModal" :title="editingTask ? 'Update task' : 'Add task'">
      <TaskForm
        v-if="user?.role === 'admin'"
        :editingTask="editingTask"
        :projects="projects"
        @taskCreated="() => { showTaskModal = false; getTasks(); }"
        @taskUpdated="handleUpdated"
        @cancelEdit="cancelEdit"
      />
    </BaseModal>

    <!-- Details modal -->
    <BaseModal v-model="showDetailsModal" :title="selectedTask ? `Task: ${selectedTask.title}` : 'Task Details'">
      <div v-if="selectedTask" class="space-y-4">
        <div class="grid md:grid-cols-2 gap-4">
          <div class="bg-slate-50 rounded-xl p-4 space-y-2">
            <h4 class="font-bold text-slate-800 mb-3">Overview</h4>
            <p class="text-sm"><span class="font-semibold text-slate-500">Status:</span> {{ selectedTask.status }}</p>
            <p class="text-sm"><span class="font-semibold text-slate-500">Priority:</span> {{ selectedTask.priority || 'medium' }}</p>
            <p class="text-sm"><span class="font-semibold text-slate-500">Assignee:</span> {{ selectedTask.assignee_username || selectedTask.assignee_email || 'Unassigned' }}</p>
            <p class="text-sm"><span class="font-semibold text-slate-500">Project:</span> {{ selectedTask.project_name || 'N/A' }}</p>
            <p class="text-sm"><span class="font-semibold text-slate-500">Due:</span> {{ selectedTask.due_date ? formatDate(selectedTask.due_date) : 'No due date' }}</p>
            <p class="text-sm"><span class="font-semibold text-slate-500">Description:</span> {{ selectedTask.description || 'No description' }}</p>
            <div v-if="selectedTask.attachments?.length" class="pt-2">
              <p class="text-sm font-semibold text-slate-500 mb-2">Attachments</p>
              <ul class="space-y-2">
                <li v-for="att in selectedTask.attachments" :key="att.id || att.url">
                  <a :href="attachmentUrl(att.url)" target="_blank" rel="noopener noreferrer" class="text-sm text-indigo-600 font-semibold hover:underline">{{ att.original_name || att.file_name || 'Attachment' }}</a>
                  <img v-if="att.mime_type?.startsWith('image/')" :src="attachmentUrl(att.url)" :alt="att.original_name || 'attachment'" class="mt-2 w-full max-h-32 object-cover rounded-lg border border-slate-200" />
                </li>
              </ul>
            </div>
          </div>
          <div class="bg-slate-50 rounded-xl p-4">
            <h4 class="font-bold text-slate-800 mb-3">Activity</h4>
            <p v-if="loadingActivity" class="text-sm text-slate-400">Loading...</p>
            <p v-else-if="!taskActivity.length" class="text-sm text-slate-400">No activity yet.</p>
            <ul v-else class="space-y-3 max-h-52 overflow-auto">
              <li v-for="item in taskActivity" :key="item.id" class="border-b border-slate-100 pb-2 last:border-0">
                <p class="text-sm text-slate-700">{{ item.detail || item.action }}</p>
                <small class="text-xs text-slate-400">{{ item.username || item.email || 'System' }} · {{ formatDate(item.created_at) }}</small>
              </li>
            </ul>
          </div>
        </div>

        <!-- Subtasks (only for big tasks) -->
        <div v-if="selectedTask.is_big" class="bg-slate-50 rounded-xl p-4">
          <h4 class="font-bold text-slate-800 mb-3">Checklist</h4>
          <p v-if="loadingSubtasks" class="text-sm text-slate-400">Loading...</p>
          <div v-else class="space-y-2">
            <div v-for="subtask in detailSubtasks" :key="subtask.id" class="flex items-center gap-2">
              <input type="checkbox" :checked="subtask.is_done" @change="toggleDetailSubtask(subtask)" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
              <span :class="subtask.is_done ? 'line-through text-slate-400' : 'text-slate-700'" class="text-sm flex-1">{{ subtask.title }}</span>
            </div>
            <p v-if="!detailSubtasks.length" class="text-sm text-slate-400">No checklist items yet.</p>
          </div>
        </div>

        <!-- Comments -->
        <div class="bg-slate-50 rounded-xl p-4">
          <h4 class="font-bold text-slate-800 mb-3">Comments</h4>
          <p v-if="loadingComments" class="text-sm text-slate-400">Loading...</p>
          <div v-else class="space-y-3 max-h-52 overflow-auto mb-3">
            <div v-for="c in detailComments" :key="c.id" class="bg-white rounded-lg border border-slate-100 p-3">
              <div class="flex items-start justify-between gap-2">
                <p class="text-sm text-slate-800"><span class="font-semibold">{{ c.username || c.email }}</span>: {{ c.content }}</p>
                <button
                  v-if="user?.role === 'admin' || String(c.user_id) === String(user?.id)"
                  class="text-slate-300 hover:text-red-500 bg-transparent border-none cursor-pointer p-0 text-base leading-none shrink-0 transition"
                  @click="deleteDetailComment(c.id)"
                >✕</button>
              </div>
              <p class="text-xs text-slate-400 mt-1">{{ formatDate(c.created_at) }}</p>
            </div>
            <p v-if="!detailComments.length" class="text-sm text-slate-400">No comments yet.</p>
          </div>
          <div class="flex gap-2">
            <input v-model="newDetailComment" placeholder="Add a comment..." @keyup.enter="addDetailComment" class="flex-1 rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500" />
            <button class="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm border-none cursor-pointer transition" @click="addDetailComment">Send</button>
          </div>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script>
import TaskCard from '../components/taskcard.vue';
import TaskForm from '../components/taskform.vue';
import api from '../api/api';
import { uploadUrl } from '../api/config';
import { toCsv } from '@/utils/csv';
import { getUser } from '@/utils/auth';
import BaseModal from '@/components/baseModal.vue';
import { toast } from '@/utils/toast';
import { Download } from 'lucide-vue-next';

export default {
  components: { TaskCard, TaskForm, BaseModal, Download },
  data() {
    return {
      tasks: [], projects: [], editingTask: null, user: null, search: '', selectedProject: '', selectedPriority: '', selectedStatus: '', selectedAssignee: '',
      showOnlyOverdue: false, showOnlyBig: false,
      error: '', refreshTimer: null, onFocus: null,
      showTaskModal: false, notifications: [], showDetailsModal: false, selectedTask: null,
      taskActivity: [], loadingActivity: false,
      detailComments: [], loadingComments: false, newDetailComment: '',
      detailSubtasks: [], loadingSubtasks: false,
      pendingTaskIdFromRoute: null,
      draggingTask: null, dragOverColumn: null,
      columns: [
        { status: 'todo', label: 'Todo' },
        { status: 'in-progress', label: 'In Progress' },
        { status: 'done', label: 'Done' }
      ]
    };
  },
  watch: {
    '$route.query.taskId': {
      immediate: true,
      handler(value) { this.pendingTaskIdFromRoute = value ? String(value) : null; this.tryOpenTaskFromRoute(); }
    }
  },
  computed: {
    uniqueAssignees() {
      const seen = new Set();
      return this.tasks
        .filter(t => t.user_id)
        .reduce((acc, t) => {
          if (!seen.has(t.user_id)) {
            seen.add(t.user_id);
            acc.push({ id: t.user_id, label: t.assignee_username || t.assignee_email || `#${t.user_id}` });
          }
          return acc;
        }, []);
    },
    filteredTasks() {
      const q = this.search.trim().toLowerCase();
      const now = new Date();
      return this.tasks.filter(task => {
        const matchesSearch = !q || task.title.toLowerCase().includes(q);
        const matchesProject = !this.selectedProject || task.project_name === this.selectedProject;
        const matchesPriority = !this.selectedPriority || task.priority === this.selectedPriority;
        const matchesStatus = !this.selectedStatus || task.status === this.selectedStatus;
        const matchesAssignee = !this.selectedAssignee || String(task.user_id) === String(this.selectedAssignee);
        const matchesOverdue = !this.showOnlyOverdue || (task.due_date && task.status !== 'done' && new Date(task.due_date) < now);
        const matchesBig = !this.showOnlyBig || !!task.is_big;
        return matchesSearch && matchesProject && matchesPriority && matchesStatus && matchesAssignee && matchesOverdue && matchesBig;
      });
    },
    groupedTasks() {
      return {
        todo: this.filteredTasks.filter(t => t.status === 'todo'),
        'in-progress': this.filteredTasks.filter(t => t.status === 'in-progress'),
        done: this.filteredTasks.filter(t => t.status === 'done')
      };
    }
  },
  mounted() {
    this.user = getUser();
    this.getProjects();
    this.getTasks();
    this.refreshTimer = window.setInterval(() => this.getTasks(), 8000);
    this.onFocus = () => this.getTasks();
    window.addEventListener('focus', this.onFocus);
  },
  beforeUnmount() {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    if (this.onFocus) window.removeEventListener('focus', this.onFocus);
  },
  methods: {
    columnClass(_status, isDragOver) {
      return isDragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 bg-slate-50';
    },
    colDotClass(status) {
      if (status === 'done') return 'bg-green-500';
      if (status === 'in-progress') return 'bg-amber-400';
      return 'bg-slate-400';
    },
    async getProjects() {
      try { const res = await api.get('/projects'); this.projects = res.data; }
      catch (err) { console.error(err); }
    },
    async getTasks() {
      try {
        const res = await api.get('/tasks');
        this.tasks = res.data;
        if (this.selectedTask) {
          this.selectedTask = this.tasks.find((task) => task.id === this.selectedTask.id) || this.selectedTask;
        }
        await this.getNotifications();
        this.tryOpenTaskFromRoute();
      }
      catch (err) { console.error(err); }
    },
    async getNotifications() {
      try {
        const res = await api.get('/notifications');
        this.notifications = res.data;
        const unread = this.notifications.filter(n => !n.is_read);
        if (unread.length) {
          await Promise.all(unread.map(async n => { toast.info(n.message, { title: 'New Notification', timeoutMs: 7000 }); await api.put(`/notifications/${n.id}/read`); }));
        }
      } catch (err) { console.error(err); }
    },
    handleEdit(task) { this.editingTask = task; this.showTaskModal = true; },
    handleUpdated() { this.editingTask = null; this.showTaskModal = false; this.getTasks(); },
    async handleMove({ task, status }) {
      try { this.error = ''; await api.put(`/tasks/${task.id}`, { status }); this.getTasks(); }
      catch (err) { this.error = err.response?.data?.message || 'Failed to move task'; }
    },
    cancelEdit() { this.editingTask = null; this.showTaskModal = false; },
    openAddTaskModal() { this.editingTask = null; this.showTaskModal = true; },
    onDragStart(task) { this.draggingTask = task; },
    onDragEnd() { this.draggingTask = null; this.dragOverColumn = null; },
    async onDrop(targetStatus) {
      this.dragOverColumn = null;
      if (!this.draggingTask || this.draggingTask.status === targetStatus || this.draggingTask.status === 'done') return;
      await this.handleMove({ task: this.draggingTask, status: targetStatus });
      this.draggingTask = null;
    },
    async openDetails(task) {
      this.selectedTask = task;
      this.detailComments = []; this.detailSubtasks = []; this.newDetailComment = '';
      this.showDetailsModal = true;
      await Promise.all([
        this.loadTaskActivity(task.id),
        this.loadDetailComments(task.id),
        task.is_big ? this.loadDetailSubtasks(task.id) : Promise.resolve(),
      ]);
    },
    async loadDetailComments(taskId) {
      this.loadingComments = true;
      try { const res = await api.get(`/tasks/${taskId}/comments`); this.detailComments = res.data || []; }
      catch (err) { console.error(err); }
      finally { this.loadingComments = false; }
    },
    async loadDetailSubtasks(taskId) {
      this.loadingSubtasks = true;
      try { const res = await api.get(`/tasks/${taskId}/subtasks`); this.detailSubtasks = res.data || []; }
      catch (err) { console.error(err); }
      finally { this.loadingSubtasks = false; }
    },
    async addDetailComment() {
      if (!this.newDetailComment.trim() || !this.selectedTask) return;
      try {
        await api.post(`/tasks/${this.selectedTask.id}/comments`, { content: this.newDetailComment });
        this.newDetailComment = '';
        await this.loadDetailComments(this.selectedTask.id);
      } catch (err) { toast.error('Failed to add comment'); }
    },
    async deleteDetailComment(commentId) {
      try {
        await api.delete(`/comments/${commentId}`);
        await this.loadDetailComments(this.selectedTask.id);
      } catch (err) { toast.error('Failed to delete comment'); }
    },
    async toggleDetailSubtask(subtask) {
      try {
        await api.put(`/subtasks/${subtask.id}`, { is_done: !subtask.is_done });
        await this.loadDetailSubtasks(this.selectedTask.id);
        await this.getTasks();
      } catch (err) { toast.error('Failed to update subtask'); }
    },
    tryOpenTaskFromRoute() {
      if (!this.pendingTaskIdFromRoute || !this.tasks.length) return;
      const match = this.tasks.find(t => String(t.id) === this.pendingTaskIdFromRoute);
      if (!match) return;
      this.pendingTaskIdFromRoute = null;
      this.openDetails(match);
    },
    async loadTaskActivity(taskId) {
      try { this.loadingActivity = true; const res = await api.get(`/tasks/${taskId}/activity`); this.taskActivity = res.data || []; }
      catch (err) { console.error(err); this.taskActivity = []; }
      finally { this.loadingActivity = false; }
    },
    exportCSV() {
      const headers = ['ID', 'Title', 'Status', 'Priority', 'Project', 'Assignee', 'Due Date', 'Created'];
      const rows = this.filteredTasks.map(t => [
        t.id,
        t.title || '',
        t.status,
        t.priority || '',
        t.project_name || '',
        t.assignee_username || t.assignee_email || '',
        t.due_date ? new Date(t.due_date).toLocaleString() : '',
        t.created_at ? new Date(t.created_at).toLocaleString() : ''
      ]);
      const csv = toCsv([headers, ...rows]);
      const blob = new Blob(['\uFEFF', csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `tasks-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    },
    formatDate(value) { return new Date(value).toLocaleString(); },
    attachmentUrl(path) {
      return uploadUrl(path) || '#';
    }
  }
};
</script>

