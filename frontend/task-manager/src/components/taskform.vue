<template>
  <div>
    <div class="form">
      <div class="field">
        <label>Title</label>
        <input v-model="title" placeholder="New task..." />
      </div>

      <div class="field">
        <label>Project</label>
        <select v-model="projectId">
          <option disabled value="">Select project</option>
          <option v-for="project in projects" :key="project.id" :value="project.id">
            {{ project.name }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Assign to member</label>
        <select v-model="assigneeId">
          <option disabled value="">
            {{ projectId ? (assigneeOptions.length ? 'Assign to member' : 'No members in this project') : 'Select project first' }}
          </option>
          <option v-for="member in assigneeOptions" :key="member.id" :value="member.id">
            {{ member.email }}
          </option>
        </select>
      </div>

      <div class="field">
        <label>Status</label>
        <select v-model="status">
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div class="actions">
        <button type="button" @click="createTask">
          {{ editingTask ? 'Update' : 'Add' }}
        </button>
        <button v-if="editingTask" type="button" @click="cancelEdit" class="cancel">
          Cancel
        </button>
      </div>
    </div>
    <p v-if="error" class="error">{{ error }}</p>
  </div>
</template>

<script>
import api from '../api/api';
import { getUser } from '@/utils/auth';
import { toast } from '@/utils/toast';

export default {
  props: ['editingTask', 'projects'],

  data() {
    return {
      title: '',
      projectId: '',
      assigneeId: '',
      users: [],
      projectMembers: [],
      status: 'todo',
      error: '',
      user: null
    };
  },

  computed: {
    isAdminUser() {
      return this.user?.role === 'admin';
    },
    assigneeOptions() {
      const memberIdSet = new Set(this.projectMembers.map((m) => Number(m.id)));
      return this.users
        .filter((u) => u.role !== 'admin')
        .filter((u) => memberIdSet.has(Number(u.id)));
    }
  },

  mounted() {
    this.user = getUser();
    if (!this.isAdminUser && this.user?.id) {
      this.assigneeId = this.user.id;
    }
  },

  watch: {
    editingTask(newTask) {
      if (newTask) {
        this.title = newTask.title;
        this.status = newTask.status;
        this.projectId = newTask.project_id;
        this.assigneeId = newTask.user_id || '';
        if (this.isAdminUser) this.refreshAssigneeData();
      }
    },
    projectId() {
      if (this.isAdminUser) {
        this.assigneeId = '';
        this.refreshAssigneeData();
      } else if (this.user?.id) {
        this.assigneeId = this.user.id;
      }
    }
  },

  methods: {
    async refreshAssigneeData() {
      this.users = [];
      this.projectMembers = [];
      if (!this.projectId) return;
      try {
        const [usersResult, membersResult] = await Promise.allSettled([
          api.get('/auth/users'),
          api.get(`/projects/${this.projectId}/members`)
        ]);

        if (usersResult.status === 'fulfilled') {
          this.users = usersResult.value.data || [];
        } else {
          // Common causes: not admin (403), not logged in (401), backend not restarted/running.
          console.error(usersResult.reason);
          this.error = 'Failed to load users (make sure you are logged in as admin).';
        }

        if (membersResult.status === 'fulfilled') {
          this.projectMembers = membersResult.value.data || [];
        } else {
          console.error(membersResult.reason);
          // 404 here usually means backend not restarted to include /projects/:id/members
          this.error = 'Failed to load project members (restart backend / check API route).';
        }
      } catch (err) {
        console.error(err);
        this.error = 'Failed to load assignee data';
      }
    },
    async createTask() {
      if (!this.title.trim()) {
        this.error = 'Title is required';
        return;
      }
      // Legacy tasks may have no project; allow editing them without forcing a project.
      if (!this.projectId && !this.editingTask) {
        this.error = 'Project is required';
        return;
      }

      // Legacy tasks may have no assignee; default to current admin when editing.
      if (!this.assigneeId && this.editingTask && this.isAdminUser && this.user?.id) {
        this.assigneeId = this.user.id;
      }

      if (!this.assigneeId && !this.editingTask) {
        this.error = 'Assignee is required';
        return;
      }

      try {
        this.error = '';

        if (this.editingTask) {
          const payload = { title: this.title, status: this.status };
          if (this.projectId) payload.project_id = this.projectId;
          if (this.assigneeId) payload.user_id = this.assigneeId;
          await api.put(`/tasks/${this.editingTask.id}`, payload);
          toast.success('Task updated');
          this.$emit('taskUpdated');
        } else {
          await api.post('/tasks', {
            title: this.title,
            status: this.status,
            project_id: this.projectId,
            user_id: this.assigneeId
          });
          toast.success('Task created');
          this.$emit('taskCreated');
        }

        this.resetForm();

      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to save task';
        toast.error(this.error);
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
      this.assigneeId = this.isAdminUser ? '' : (this.user?.id || '');
      this.users = [];
      this.projectMembers = [];
      this.error = '';
    }
  }
};
</script>

<style scoped>
.form {
  display: grid;
  grid-template-columns: 1fr;
  gap: 12px;
  margin-bottom: 10px;
  padding: 4px;
  border-radius: 12px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
}

.field label {
  display: block;
  margin-bottom: 6px;
  font-size: 13px;
  color: #475569;
}

.actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.cancel {
  background: #64748b;
}

.error {
  color: #dc2626;
  font-size: 14px;
}

</style>