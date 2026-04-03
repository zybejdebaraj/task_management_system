<template>
  <div>
    <h2>Projects</h2>

    <!-- Create Project -->
    <div class="form">
      <input v-model="name" placeholder="Project name" />
      <input v-model="description" placeholder="Description" />
      <button @click="createProject">Add Project</button>
    </div>

    <!-- Projects List -->
    <ul>
      <li v-for="project in projects" :key="project.id">
        <strong>{{ project.name }}</strong>
        <p>{{ project.description }}</p>

        <button @click="deleteProject(project.id)">Delete</button>
      </li>
    </ul>
  </div>
</template>

<script>
import api from '../api/api';

export default {
  data() {
    return {
      name: '',
      description: '',
      projects: []
    };
  },

  mounted() {
    this.fetchProjects();
  },

  methods: {
    async fetchProjects() {
      const res = await api.get('/projects', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      this.projects = res.data;
    },

    async createProject() {
      if (!this.name) {
        alert('Project name is required');
        return;
      }

      await api.post(
        '/projects',
        {
          name: this.name,
          description: this.description
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      this.name = '';
      this.description = '';
      this.fetchProjects();
    },

    async deleteProject(id) {
      await api.delete(`/projects/${id}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });

      this.fetchProjects();
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

li {
  margin-bottom: 15px;
}
</style>
