<template>
  <div
    class="bg-white rounded-xl border p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all relative"
    :class="isOverdue ? 'border-red-300 bg-red-50/30' : 'border-slate-200'"
  >

    <!-- Edit button -->
    <button
      v-if="canManage"
      class="absolute top-3 right-3 w-7 h-7 rounded-lg bg-transparent border-none text-slate-400 hover:bg-slate-100 hover:text-slate-700 flex items-center justify-center transition cursor-pointer"
      type="button"
      @click="$emit('edit', task)"
      aria-label="Edit task"
    >
      <Pencil class="w-3.5 h-3.5" />
    </button>

    <!-- Meta -->
    <div class="space-y-1.5 mb-3">
      <div class="flex items-start justify-between gap-2 pr-6">
        <div>
          <span :class="statusClass(task.status)" class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">{{ readableStatus(task.status) }}</span>
          <p class="font-semibold text-slate-800 text-sm mt-1.5 leading-snug">{{ task.title }}</p>
        </div>
        <span v-if="task.priority" :class="priorityClass(task.priority)" class="text-[10px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full whitespace-nowrap shrink-0 mt-4">{{ task.priority }}</span>
      </div>
      <div v-if="task.due_date" class="flex items-center gap-2 flex-wrap">
        <p class="text-xs font-medium" :class="isOverdue ? 'text-red-600' : 'text-violet-600'">{{ formatDueDate(task.due_date) }}</p>
        <span v-if="isOverdue" class="text-[10px] font-bold uppercase tracking-wide bg-red-100 text-red-600 px-2 py-0.5 rounded-full">Overdue</span>
      </div>
      <p v-if="task.attachments?.length" class="text-xs text-slate-400">{{ task.attachments.length }} attachment{{ task.attachments.length > 1 ? 's' : '' }}</p>
    </div>

    <!-- Subtasks -->
    <div v-if="task.is_big" class="bg-slate-50 rounded-xl border border-slate-100 p-3 mb-3 space-y-2">
      <div class="flex items-center justify-between mb-1">
        <span class="text-xs font-bold text-slate-600">Checklist</span>
        <span class="text-xs text-slate-400">{{ doneSubtaskCount }}/{{ subtasks.length }}</span>
      </div>
      <div v-for="subtask in subtasks" :key="subtask.id" class="flex items-center justify-between gap-2">
        <label class="flex items-center gap-2 flex-1 min-w-0 cursor-pointer">
          <input type="checkbox" :checked="subtask.is_done" @change="toggleSubtask(subtask)" class="w-3.5 h-3.5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" />
          <span :class="subtask.is_done ? 'line-through text-slate-400' : 'text-slate-700'" class="text-xs truncate">{{ subtask.title }}</span>
        </label>
        <button class="text-[10px] font-semibold text-red-400 hover:text-red-600 bg-transparent border-none cursor-pointer p-0 shrink-0" @click="deleteSubtask(subtask.id)">Delete</button>
      </div>
      <div class="flex items-center gap-2 pt-1">
        <input v-model="newSubtask" placeholder="Add subtask..." @keyup.enter="createSubtask" class="flex-1 text-xs rounded-lg border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 py-1.5 px-2" />
        <button class="text-xs px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold border-none cursor-pointer transition shrink-0" @click="createSubtask" :disabled="!newSubtask.trim()">Add</button>
      </div>
    </div>

    <!-- Comments -->
    <div class="space-y-2 mb-3">
      <div v-for="comment in comments" :key="comment.id" class="bg-slate-50 rounded-lg p-2.5 text-xs">
        <span class="font-semibold text-slate-800">{{ comment.username }}</span>
        <span class="text-slate-600">: {{ comment.content }}</span>
        <p class="text-slate-400 text-[10px] mt-0.5">{{ formatDate(comment.created_at) }}</p>
      </div>
      <div class="flex items-center gap-2">
        <input v-model="newComment" placeholder="Add a comment..." @keyup.enter="addComment" class="flex-1 text-xs rounded-lg border-slate-200 focus:border-indigo-400 focus:ring-indigo-400 py-1.5 px-2" />
        <button class="text-xs px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold border-none cursor-pointer transition shrink-0" @click="addComment" :disabled="!newComment.trim()">Add</button>
      </div>
    </div>

    <!-- Actions -->
    <div class="flex items-center gap-1.5 pt-2 border-t border-slate-100">
      <button class="action-btn" @click="$emit('details', task)" aria-label="Details" data-tip="Details">
        <Info class="w-3.5 h-3.5" />
      </button>
      <button v-if="canMove && task.status === 'in-progress'" class="action-btn" @click="$emit('move', { task, status: 'todo' })" aria-label="Move left" data-tip="Move left">
        <ArrowLeft class="w-3.5 h-3.5" />
      </button>
      <button v-if="canMove && task.status !== 'done'" class="action-btn" @click="$emit('move', { task, status: nextStatus(task.status) })" aria-label="Move right" data-tip="Move right">
        <ArrowRight class="w-3.5 h-3.5" />
      </button>
      <button v-if="canManage" class="action-btn danger ml-auto" @click="showConfirm = true" aria-label="Delete" data-tip="Delete">
        <Trash2 class="w-3.5 h-3.5" />
      </button>
    </div>

    <ConfirmModal
      v-model="showConfirm"
      title="Delete task?"
      :message="`'${task.title}' will be permanently deleted.`"
      @confirm="deleteTask"
    />
  </div>
</template>

<script>
import api from '../api/api';
import { ArrowLeft, ArrowRight, Info, Pencil, Trash2 } from 'lucide-vue-next';
import { toast } from '@/utils/toast';
import ConfirmModal from '@/components/confirmModal.vue';

export default {
  components: { Pencil, ArrowLeft, ArrowRight, Trash2, Info, ConfirmModal },
  props: ['task', 'canManage', 'viewerUserId'],
  data() {
    return { comments: [], newComment: '', subtasks: [], newSubtask: '', showConfirm: false };
  },
  mounted() { this.loadComments(); this.loadSubtasks(); },
  computed: {
    canMove() {
      if (this.canManage) return true;
      if (!this.viewerUserId) return false;
      return String(this.task.user_id) === String(this.viewerUserId);
    },
    doneSubtaskCount() { return this.subtasks.filter(s => s.is_done).length; },
    isOverdue() {
      if (!this.task.due_date || this.task.status === 'done') return false;
      return new Date(this.task.due_date) < new Date();
    }
  },
  watch: {
    'task.id'() { this.loadComments(); this.loadSubtasks(); },
    'task.is_big'(isBig) { if (isBig) this.loadSubtasks(); else this.subtasks = []; }
  },
  methods: {
    statusClass(s) {
      if (s === 'done') return 'bg-green-100 text-green-700';
      if (s === 'in-progress') return 'bg-amber-100 text-amber-700';
      return 'bg-slate-100 text-slate-500';
    },
    priorityClass(p) {
      if (p === 'high') return 'bg-red-100 text-red-700';
      if (p === 'medium') return 'bg-amber-100 text-amber-700';
      return 'bg-slate-100 text-slate-500';
    },
    readableStatus(s) { if (s === 'in-progress') return 'In Progress'; if (s === 'done') return 'Done'; return 'Todo'; },
    nextStatus(s) { if (s === 'todo') return 'in-progress'; return 'done'; },
    formatDueDate(d) { const date = new Date(d); return `Due: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`; },
    formatDate(d) { return new Date(d).toLocaleString(); },
    async loadComments() {
      try { const r = await api.get(`/tasks/${this.task.id}/comments`); this.comments = r.data; }
      catch (err) { console.error(err); }
    },
    async loadSubtasks() {
      if (!this.task.is_big) { this.subtasks = []; return; }
      try { const r = await api.get(`/tasks/${this.task.id}/subtasks`); this.subtasks = r.data; }
      catch (err) { console.error(err); }
    },
    async createSubtask() {
      if (!this.newSubtask.trim()) return;
      try { await api.post(`/tasks/${this.task.id}/subtasks`, { title: this.newSubtask }); this.newSubtask = ''; await this.loadSubtasks(); toast.success('Subtask added'); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to add subtask'); }
    },
    async toggleSubtask(subtask) {
      try { await api.put(`/subtasks/${subtask.id}`, { is_done: !subtask.is_done }); await this.loadSubtasks(); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to update subtask'); }
    },
    async deleteSubtask(subtaskId) {
      try { await api.delete(`/subtasks/${subtaskId}`); await this.loadSubtasks(); toast.success('Subtask deleted'); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to delete subtask'); }
    },
    async addComment() {
      if (!this.newComment.trim()) return;
      try { await api.post(`/tasks/${this.task.id}/comments`, { content: this.newComment }); this.newComment = ''; this.loadComments(); toast.success('Comment added'); }
      catch (err) { toast.error('Failed to add comment'); }
    },
    async deleteTask() {
      try { await api.delete(`/tasks/${this.task.id}`); this.$emit('deleted'); toast.success('Task deleted'); }
      catch (err) { toast.error(err.response?.data?.message || 'Failed to delete task'); }
    }
  }
};
</script>

<style scoped>
.action-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 8px;
  border: none;
  background: #f1f5f9;
  color: #475569;
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  position: relative;
}
.action-btn:hover { background: #e2e8f0; color: #0f172a; }
.action-btn.danger { background: #fee2e2; color: #b91c1c; }
.action-btn.danger:hover { background: #fecaca; }
.action-btn::after {
  content: attr(data-tip);
  position: absolute;
  bottom: calc(100% + 6px);
  left: 50%;
  transform: translateX(-50%);
  background: #0f172a;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  padding: 3px 7px;
  border-radius: 5px;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.15s;
}
.action-btn:hover::after { opacity: 1; }
</style>
