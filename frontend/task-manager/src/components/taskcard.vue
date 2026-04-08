<template>
  <div class="card">
    <div class="meta">
      <strong>{{ task.title }}</strong>
      <p class="status" :class="task.status">{{ readableStatus(task.status) }}</p>
      <p class="project">Project: {{ task.project_name || 'N/A' }}</p>
    </div>

    <div v-if="canManage" class="actions">
      <button @click="$emit('edit', task)">Edit</button>
      <button
        v-if="task.status !== 'todo'"
        class="ghost"
        @click="$emit('move', { task, status: previousStatus(task.status) })"
      >
        Move Left
      </button>
      <button
        v-if="task.status !== 'done'"
        class="ghost"
        @click="$emit('move', { task, status: nextStatus(task.status) })"
      >
        Move Right
      </button>
      <button @click="deleteTask">Delete</button>
    </div>
  </div>
</template>

<script>
import api from '../api/api';

export default {
  props: ['task', 'canManage'],

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
}

.meta strong {
  display: block;
  margin-bottom: 8px;
  color: #1e1b4b;
  font-size: 15px;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.status {
  font-weight: 700;
  font-size: 13px;
}

.project {
  color: #666;
  margin-top: 6px;
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