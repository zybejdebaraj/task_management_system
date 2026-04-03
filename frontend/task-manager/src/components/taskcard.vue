<template>
  <div class="card">
    <div>
      <strong>{{ task.title }}</strong>
      <p :class="task.status">Status: {{ task.status }}</p>
    </div>

    <div class="actions">
      <button @click="$emit('edit', task)">Edit</button>
      <button @click="deleteTask">Delete</button>
    </div>
  </div>
</template>

<script>
import api from '../api/api';

export default {
  props: ['task'],

  methods: {
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
  background: white;
  padding: 15px;
  margin: 10px 0;
  border-radius: 6px;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.actions {
  display: flex;
  gap: 10px;
}

.todo { color: gray; }
.in-progress { color: orange; }
.done { color: green; }
</style>