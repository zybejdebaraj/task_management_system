<template>
  <div class="card">
    <button v-if="canManage" class="icon-btn edit-icon" type="button" @click="$emit('edit', task)" aria-label="Edit task">
      <Pencil class="pencil" aria-hidden="true" />
    </button>

    <div class="meta">
      <p class="status" :class="task.status">{{ readableStatus(task.status) }}</p>
      <strong>{{ task.title }}</strong>
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

export default {
  components: { Pencil },
  props: ['task', 'canManage', 'viewerUserId'],

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
    async deleteTask() {
      try {
        await api.delete(`/tasks/${this.task.id}`);
        this.$emit('deleted');
      } catch (err) {
        console.error(err);
      }
    }
  }
};
</script>

<style scoped>
.card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #e2e8f0;
  padding: 15px;
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