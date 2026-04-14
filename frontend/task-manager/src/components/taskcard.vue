<template>
  <div class="card">
    <button
      v-if="canManage && task.status !== 'done'"
      class="icon-btn edit-icon"
      type="button"
      @click="$emit('edit', task)"
      aria-label="Edit task"
    >
      <Pencil class="pencil" aria-hidden="true" />
    </button>

    <div class="meta">
      <div class="meta-header">
        <div>
          <p class="status" :class="task.status">{{ readableStatus(task.status) }}</p>
          <strong>{{ task.title }}</strong>
        </div>
        <p v-if="task.priority" class="priority" :class="task.priority">{{ task.priority }}</p>
      </div>
      <p v-if="task.due_date" class="due-date">{{ formatDueDate(task.due_date) }}</p>
      <p v-if="task.attachments?.length" class="attachment-count">
        {{ task.attachments.length }} attachment{{ task.attachments.length > 1 ? 's' : '' }}
      </p>
    </div>

    <div class="comments-section">
      <div v-for="comment in comments" :key="comment.id" class="comment">
        <strong>{{ comment.username }}</strong>: {{ comment.content }}
        <small>{{ formatDate(comment.created_at) }}</small>
      </div>
      <div class="add-comment">
        <input v-model="newComment" placeholder="Add a comment..." @keyup.enter="addComment" />
        <button @click="addComment" :disabled="!newComment.trim()">Add</button>
      </div>
    </div>

    <div class="actions">
      <button
        v-if="canMove && task.status === 'in-progress'"
        class="ghost"
        @click="$emit('move', { task, status: previousStatus(task.status) })"
      >
        Move Left
      </button>
      <button
        v-if="canMove && task.status !== 'done'"
        class="ghost"
        @click="$emit('move', { task, status: nextStatus(task.status) })"
      >
        Move Right
      </button>
      <button v-if="canManage" @click="deleteTask">Delete</button>
    </div>
  </div>
</template>

<script>
import api from '../api/api';
import { Pencil } from 'lucide-vue-next';
import { toast } from '@/utils/toast';

export default {
  components: { Pencil },
  props: ['task', 'canManage', 'viewerUserId'],

  data() {
    return {
      comments: [],
      newComment: ''
    };
  },

  mounted() {
    this.loadComments();
  },

  computed: {
    canMove() {
      if (this.canManage) return true;
      if (!this.viewerUserId) return false;
      return String(this.task.user_id) === String(this.viewerUserId);
    }
  },

  methods: {
    readableStatus(status) {
      if (status === 'in-progress') return 'In Progress';
      if (status === 'done') return 'Done';
      return 'Todo';
    },
    previousStatus(status) {
      if (status === 'done') return 'in-progress';
      if (status === 'in-progress') return 'todo';
      return 'todo';
    },
    nextStatus(status) {
      if (status === 'todo') return 'in-progress';
      if (status === 'in-progress') return 'done';
      return 'done';
    },
    formatDueDate(dueDate) {
      const date = new Date(dueDate);
      return `Due: ${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    },
    formatDate(date) {
      return new Date(date).toLocaleString();
    },
    async loadComments() {
      try {
        const response = await api.get(`/tasks/${this.task.id}/comments`);
        this.comments = response.data;
      } catch (err) {
        console.error('Failed to load comments', err);
      }
    },
    async addComment() {
      if (!this.newComment.trim()) return;
      try {
        await api.post(`/tasks/${this.task.id}/comments`, { content: this.newComment });
        this.newComment = '';
        this.loadComments();
        toast.success('Comment added');
      } catch (err) {
        toast.error('Failed to add comment');
      }
    },
    async deleteTask() {
      try {
        await api.delete(`/tasks/${this.task.id}`);
        this.$emit('deleted');
        toast.success('Task deleted');
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete task');
      }
    }
  }
};
</script>

<style scoped>
.card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  padding: 20px 15px 15px;
  border-radius: 12px;
  display: grid;
  gap: 12px;
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  position: relative;
}

.meta strong {
  display: block;
  margin-top: 6px;
  color: #1e1b4b;
  font-size: 15px;
}

.meta-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 10px;
}

.priority {
  font-size: 12px;
  font-weight: 600;
  margin-top: 20px;
  text-transform: uppercase;
}

.low { color: #64748b; }
.medium { color: #d97706; }
.high { color: #dc2626; }

.due-date {
  font-size: 12px;
  color: #7c3aed;
  margin-top: 10px;
}

.attachment-count {
  font-size: 12px;
  color: #475569;
  margin-top: 6px;
}

.comments-section {
  margin-top: 10px;
}

.comment {
  background: #f8fafc;
  padding: 8px;
  border-radius: 6px;
  margin-bottom: 6px;
  font-size: 13px;
}

.comment strong {
  color: #1e1b4b;
}

.comment small {
  color: #64748b;
  display: block;
  margin-top: 4px;
}

.add-comment {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

.add-comment input {
  flex: 1;
  padding: 6px;
  border: 1px solid #e2e8f0;
  border-radius: 6px;
}

.add-comment button {
  padding: 6px 12px;
  background: #3b82f6;
  color: white;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.add-comment button:disabled {
  background: #cbd5e1;
  cursor: not-allowed;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
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

.edit-icon {
  position: absolute;
  top: 10px;
  right: 10px;
}

.pencil {
  width: 18px;
  height: 18px;
  display: block;
}

.status {
  font-weight: 700;
  font-size: 13px;
}

.todo { color: #64748b; }
.in-progress { color: #d97706; }
.done { color: #16a34a; }

.ghost {
  background: #e2e8f0;
  color: #0f172a;
}

.ghost:hover {
  background: #cbd5e1;
}
</style>