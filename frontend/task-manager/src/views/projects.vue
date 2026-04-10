<template>
  <div>
    <div class="page-shell">
      <div class="page-header">
        <div class="header-row">
          <p class="page-subtitle">
            {{ isAdminUser ? 'Create and manage all projects' : 'Join a project to access its tasks' }}
          </p>
          <button v-if="isAdminUser" class="add-btn" type="button" @click="openAddModal">Add project</button>
        </div>
      </div>

      <div class="panel-head">
        <p v-if="!isAdminUser" class="helper">Join projects to see their tasks.</p>
      </div>

      <ul class="project-grid">
        <li v-for="project in projects" :key="project.id" class="card glass-card project-card">
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
            <button v-if="isAdminUser" class="danger" @click="deleteProject(project.id)">Delete</button>
            <button v-if="!isAdminUser" class="join-btn" @click="joinProject(project.id)">
              <Users class="icon" aria-hidden="true" />
              Join
            </button>
          </div>
        </li>
      </ul>
    </div>

    <BaseModal v-model="showProjectModal" :title="editingProjectId ? 'Update project' : 'Add project'">
      <div class="modal-grid">
        <div>
          <label>Project name</label>
          <input v-model="name" placeholder="Project name" />
        </div>
        <div>
          <label>Description</label>
          <input v-model="description" placeholder="Description" />
        </div>
        <div v-if="isAdminUser">
          <label>Project members</label>
          <div class="member-choices" role="group" aria-label="Project members">
            <label v-for="m in members" :key="m.id" class="member-choice">
              <input type="checkbox" :value="String(m.id)" v-model="selectedMemberIds" />
              <span class="choice-text">
                {{ m.email }}<span v-if="m.username" class="muted"> ({{ m.username }})</span>
              </span>
            </label>
          </div>
          <p class="hint">Select one or more members to include in this project.</p>
        </div>
      </div>
      <template #footer>
        <button class="cancel" type="button" @click="closeProjectModal">Cancel</button>
        <button type="button" @click="saveProject">{{ editingProjectId ? 'Update' : 'Add' }}</button>
      </template>
    </BaseModal>
  </div>
</template>

<script>
import api from '../api/api';
import { isAdmin } from '@/utils/auth';
import { Pencil, Users } from 'lucide-vue-next';
import { toast } from '@/utils/toast';
import BaseModal from '@/components/baseModal.vue';

export default {
  components: { Pencil, Users, BaseModal },
  data() {
    return {
      name: '',
      description: '',
      projects: [],
      members: [],
      selectedMemberIds: [],
      editingProjectId: null,
      isAdminUser: false,
      showProjectModal: false
    };
  },

  mounted() {
    this.isAdminUser = isAdmin();
    this.fetchProjects();
    if (this.isAdminUser) this.fetchMembers();
  },

  methods: {
    async fetchMembers() {
      try {
        const res = await api.get('/auth/members');
        this.members = res.data || [];
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load members');
      }
    },
    async fetchProjectMembers(projectId) {
      try {
        const res = await api.get(`/projects/${projectId}/members`);
        this.selectedMemberIds = (res.data || []).map((u) => String(u.id));
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load project members');
      }
    },
    async saveSelectedMembers(projectId) {
      const desired = new Set((this.selectedMemberIds || []).map(String));
      await Promise.allSettled(
        [...desired].map((id) => api.post(`/projects/${projectId}/members`, { user_id: id }))
      );
    },
    async fetchProjects() {
      try {
        const res = await api.get('/projects');
        this.projects = res.data;
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to load projects');
      }
    },

    async saveProject() {
      if (!this.name) {
        toast.error('Project name is required');
        return;
      }

      try {
        if (this.editingProjectId) {
          await api.put(`/projects/${this.editingProjectId}`, {
            name: this.name,
            description: this.description
          });
          await this.saveSelectedMembers(this.editingProjectId);
          toast.success('Project updated');
        } else {
          const created = await api.post('/projects', {
            name: this.name,
            description: this.description
          });
          const newId = created.data?.id;
          if (newId) {
            await this.saveSelectedMembers(newId);
          }
          toast.success('Project created');
        }

        this.closeProjectModal();
        this.fetchProjects();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to save project');
      }
    },

    async deleteProject(id) {
      try {
        await api.delete(`/projects/${id}`);
        toast.success('Project deleted');
        this.fetchProjects();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to delete project');
      }
    },

    async joinProject(id) {
      try {
        await api.post(`/projects/${id}/join`);
        toast.success('Joined project');
        this.fetchProjects();
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to join project');
      }
    },

    startEdit(project) {
      this.editingProjectId = project.id;
      this.name = project.name;
      this.description = project.description || '';
      this.selectedMemberIds = [];
      this.fetchProjectMembers(project.id);
      this.showProjectModal = true;
    },

    cancelEdit() {
      this.closeProjectModal();
    },
    openAddModal() {
      this.editingProjectId = null;
      this.name = '';
      this.description = '';
      this.selectedMemberIds = [];
      this.showProjectModal = true;
    },
    closeProjectModal() {
      this.showProjectModal = false;
      this.editingProjectId = null;
      this.name = '';
      this.description = '';
      this.selectedMemberIds = [];
    }
  }
};
</script>

<style scoped>
.header-row {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 12px;
}

.header-row .page-subtitle {
  margin: 0;
  margin-right: auto;
}

.panel-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
}

.add-btn {
  white-space: nowrap;
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

.helper {
  color: #666;
}

.cancel {
  background: #e2e8f0;
  color: #0f172a;
}

.cancel:hover {
  background: #cbd5e1;
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
  .panel-head {
    flex-direction: column;
    align-items: stretch;
  }

  .header-row {
    flex-direction: column;
    align-items: stretch;
  }
}

.modal-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
}

.member-choices {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 10px 12px;
  background: white;
  max-height: 220px;
  overflow: auto;
  display: grid;
  gap: 8px;
}

.member-choice {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  user-select: none;
}

.member-choice input {
  width: 16px;
  height: 16px;
}

.choice-text {
  font-size: 14px;
  color: #0f172a;
}

.muted {
  color: #64748b;
}

.hint {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 12px;
}
</style>
