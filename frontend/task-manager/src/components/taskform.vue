<template>
  <div class="form">
    <input v-model="title" placeholder="New task..." />

    <select v-model="status">
      <option value="todo">Todo</option>
      <option value="in-progress">In Progress</option>
      <option value="done">Done</option>
    </select>

    <button @click="handleSubmit">
      {{ editingTask ? 'Update' : 'Add' }}
    </button>

    <button v-if="editingTask" @click="cancelEdit" class="cancel">
      Cancel
    </button>
  </div>
  <p v-if="error" class="error">{{ error }}</p>

</template>

<script>
import api from '../api/api';

export default {
  props: ['editingTask'],

  data() {
    return {
      title: '',
      status: 'todo',
      error: ''
    };
  },

  watch: {
    editingTask(newTask) {
      if (newTask) {
        this.title = newTask.title;
        this.status = newTask.status;
      }
    }
  },

  methods: {
   async handleSubmit() {
  // ❌ VALIDATION
  if (!this.title.trim()) {
    this.error = 'Task title is required';
    return;
  }

  this.error = '';

  try {
    if (this.editingTask) {
      await api.put(`/tasks/${this.editingTask.id}`, {
        title: this.title,
        status: this.status
      });

      this.$emit('taskUpdated');

    } else {
      await api.post('/tasks', {
        title: this.title,
        status: this.status
      });

      this.$emit('taskCreated');
    }

    this.resetForm();

  } catch (err) {
    console.error(err);
  }
},

    cancelEdit() {
      this.resetForm();
      this.$emit('cancelEdit');
    },

    resetForm() {
      this.title = '';
      this.status = 'todo';
    }
  }
};
</script>

<style scoped>
.form {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
}

.form input {
  flex: 1;
}

.cancel {
  background: gray;
}

.error {
  color: red;
  font-size: 14px;
}
</style>