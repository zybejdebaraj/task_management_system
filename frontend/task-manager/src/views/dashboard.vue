<template>
  <div>
    <Navbar />

    <div class="container">
      <h2>Tasks</h2>

      <TaskForm
        :editingTask="editingTask"
        @taskCreated="getTasks"
        @taskUpdated="handleUpdated"
        @cancelEdit="cancelEdit"
      />

      <div class="task-list">
        <TaskCard
          v-for="task in tasks"
          :key="task.id"
          :task="task"
          @deleted="getTasks"
          @edit="handleEdit"
        />
      </div>
    </div>
  </div>
</template>

<script>
import Navbar from '../components/navbar.vue';
import TaskCard from '../components/taskcard.vue';
import TaskForm from '../components/taskform.vue';
import api from '../api/api';

export default {
  components: { Navbar, TaskCard, TaskForm },

  data() {
    return {
      tasks: [],
      editingTask: null
    };
  },

  mounted() {
    this.getTasks();
  },

  methods: {
    async getTasks() {
      try {
        const res = await api.get('/tasks');
        this.tasks = res.data;
      } catch (err) {
        console.error(err);
      }
    },

    handleEdit(task) {
      this.editingTask = task;
    },

    handleUpdated() {
      this.editingTask = null;
      this.getTasks();
    },

    cancelEdit() {
      this.editingTask = null;
    }
  }
};
</script>

<style scoped>
.container {
  padding: 20px;
}
</style>