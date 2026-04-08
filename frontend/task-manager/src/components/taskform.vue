<template>
  <div>
    <div class="form">
      <input v-model="title" placeholder="New task..." />
      <select v-model="projectId">
        <option disabled value="">Select project</option>
        <option v-for="project in projects" :key="project.id" :value="project.id">
          {{ project.name }}
        </option>
      </select>

      <select v-model="status">
        <option value="todo">Todo</option>
        <option value="in-progress">In Progress</option>
        <option value="done">Done</option>
      </select>

      <button @click="createTask">
        {{ editingTask ? 'Update' : 'Add' }}
      </button>

      <button v-if="editingTask" @click="cancelEdit" class="cancel">
        Cancel
      </button>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import api from '../api/api';

export default {
  props: ['editingTask', 'projects'],

  data() {
    return {
      title: '',
      projectId: '',
      status: 'todo',
      error: ''
    };
  },

  watch: {
    editingTask(newTask) {
      if (newTask) {
        this.title = newTask.title;
        this.status = newTask.status;
        this.projectId = newTask.project_id;
      }
    }
  },

  methods: {
    async createTask() {
      if (!this.title.trim()) {
        this.error = 'Title is required';
        return;
      }
      if (!this.projectId) {
        this.error = 'Project is required';
        return;
      }

      try {
        this.error = '';
        if (this.editingTask) {
          await api.put(`/tasks/${this.editingTask.id}`, {
            title: this.title,
            status: this.status,
            project_id: this.projectId
          });
          this.$emit('taskUpdated');
        } else {
          await api.post('/tasks', {
            title: this.title,
            status: this.status,
            project_id: this.projectId
          });
          this.$emit('taskCreated');
        }

        this.resetForm();

      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save task';
      }
    },

    cancelEdit() {
      this.resetForm();
      this.$emit('cancelEdit');
    },

    resetForm() {
      this.title = '';
      this.status = 'todo';
      this.projectId = '';
      this.error = '';
    }
  }
};
</script>

<style scoped>
.form {
  display: grid;
  grid-template-columns: 1.2fr 1fr 1fr auto auto;
  gap: 10px;
  margin-bottom: 10px;
  padding: 4px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.cancel {
  background: #64748b;
}

.error {
  color: #dc2626;
  font-size: 14px;
}

@media (max-width: 920px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>