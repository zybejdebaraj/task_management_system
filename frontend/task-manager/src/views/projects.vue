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

    <ul class="project-grid">
      <li v-for="project in projects" :key="project.id" class="card glass-card project-card">
        <button
          v-if="isAdminUser"
          class="icon-btn trash-icon"
          type="button"
          aria-label="Delete project"
          @click="deleteProject(project.id)"
        >
          <Trash2 class="icon" aria-hidden="true" />
        </button>
        <button
          v-if="isAdminUser"
          class="icon-btn edit-icon"
          type="button"
          aria-label="Edit project"
          @click="startEdit(project)"
        >
          <Pencil class="icon" aria-hidden="true" />
        </button>

        <div>
          <strong class="name">{{ project.name }}</strong>
          <p class="desc">{{ project.description || 'No description' }}</p>
        </div>

        <div class="actions">
          <button v-if="!isAdminUser" class="join-btn" @click="joinProject(project.id)">
            <Users class="icon" aria-hidden="true" />
            Join
          </button>
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import api from '../api/api';
import { isAdmin } from '@/utils/auth';
import { Pencil, Trash2, Users } from 'lucide-vue-next';

export default {
  components: { Pencil, Trash2, Users },
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

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
  padding: 0;
  margin: 0;
  list-style: none;
}

.project-card {
  box-shadow: 0 6px 18px rgba(15, 23, 42, 0.04);
  position: relative;
  display: grid;
  gap: 10px;
  min-height: 140px;
}

.name {
  font-size: 18px;
}

.desc {
  color: #64748b;
  font-size: 13px;
  line-height: 1.35;
  margin: 0;
}

.actions {
  display: flex;
  gap: 10px;
  margin-top: auto;
  align-items: center;
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

.trash-icon {
  position: absolute;
  top: 10px;
  right: 44px;
  color: #b91c1c;
}

.trash-icon:hover {
  background: rgba(220, 38, 38, 0.12);
  color: #dc2626;
}

.icon {
  width: 18px;
  height: 18px;
  display: block;
}

.join-btn {
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

@media (max-width: 860px) {
  .form {
    grid-template-columns: 1fr;
  }
}
</style>
