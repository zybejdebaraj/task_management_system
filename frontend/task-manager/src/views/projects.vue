<template>
  <div class="page-shell">
    <div class="page-header">
      <h2>Projects</h2>
      <p class="page-subtitle">
        {{ isAdminUser ? 'Create and manage all projects' : 'Join a project to access its tasks' }}
      </p>
    </div>

    <div v-if="isAdminUser" class="form card glass-card">
      <input v-model="name" placeholder="Project name" />
      <input v-model="description" placeholder="Description" />
      <button @click="saveProject">{{ editingProjectId ? 'Update' : 'Add' }} Project</button>
      <button v-if="editingProjectId" @click="cancelEdit" class="cancel">Cancel</button>
    </div>

    <p v-else class="helper">Join projects to see their tasks.</p>

    <ul class="project-list">
      <li v-for="project in projects" :key="project.id" class="card glass-card project-item">
        <strong class="name">{{ project.name }}</strong>
        <p class="desc">{{ project.description || 'No description' }}</p>
        <div class="actions">
          <button v-if="isAdminUser" @click="startEdit(project)">Edit</button>
          <button v-if="isAdminUser" class="danger" @click="deleteProject(project.id)">Delete</button>
          <button v-else @click="joinProject(project.id)">Join</button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import api from '../api/api';
import { isAdmin } from '@/utils/auth';

export default {
  data() {
    return {
      name: '',
      description: '',
      projects: [],
      editingProjectId: null,
      isAdminUser: false
    };
  },

  mounted() {
    this.isAdminUser = isAdmin();
    this.fetchProjects();
  },

  methods: {
    async fetchProjects() {
      const res = await api.get('/projects');
      this.projects = res.data;
    },

    async saveProject() {
      if (!this.name) {
        alert('Project name is required');
        return;
      }

      if (this.editingProjectId) {
        await api.put(`/projects/${this.editingProjectId}`, {
          name: this.name,
          description: this.description
        });
      } else {
        await api.post('/projects', {
          name: this.name,
          description: this.description
        });
      }

      this.name = '';
      this.description = '';
      this.editingProjectId = null;
      this.fetchProjects();
    },

    async deleteProject(id) {
      await api.delete(`/projects/${id}`);
      this.fetchProjects();
    },

    async joinProject(id) {
      await api.post(`/projects/${id}/join`);
      alert('Joined project');
      this.fetchProjects();
    },

    startEdit(project) {
      this.editingProjectId = project.id;
      this.name = project.name;
      this.description = project.description || '';
    },

    cancelEdit() {
      this.editingProjectId = null;
      this.name = '';
      this.description = '';
    }
  }
};
</script>

<style scoped>
.form {
  display: grid;
  grid-template-columns: 1fr 1fr auto auto;
  gap: 10px;
  margin-bottom: 20px;
}

.card {
  background: rgba(255, 255, 255, 0.9);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 14px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.project-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 12px;
}

.project-item {
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
}

.name {
  font-size: 18px;
}

.desc {
  margin-top: 8px;
  color: #64748b;
}

.actions {
  display: flex;
  gap: 8px;
  margin-top: 12px;
}

.cancel {
  background: #64748b;
}

.helper {
  margin-bottom: 16px;
  color: #666;
}

.danger {
  background: #dc2626;
}

.danger:hover {
  background: #b91c1c;
}

@media (max-width: 860px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
