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

      <div class="field" v-if="canEditStatus">
        <label>Status</label>
        <select v-model="status">
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
      </div>

      <div class="field">
        <label>Priority</label>
        <select v-model="priority">
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
      </div>

      <div class="field">
        <label>Description</label>
        <textarea v-model="description" rows="3" placeholder="Add extra details for this task..."></textarea>
      </div>

      <div class="field toggle-field">
        <input id="is-big-task" v-model="isBig" type="checkbox" />
        <label class="toggle-text" for="is-big-task">Big task</label>
      </div>

      <div class="field" v-if="!editingTask">
        <label>Attachments</label>
        <input type="file" multiple @change="handleAttachments" />
        <small>Optional. Add up to 5 files.</small>
      </div>

      <div class="field">
        <label>Due Date</label>
        <input v-model="dueDate" type="datetime-local" />
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
      priority: 'medium',
      dueDate: '',
      description: '',
      isBig: false,
      attachments: [],
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
    },
    canEditStatus() {
      if (!this.editingTask) return false; // Cannot set status on creation
      if (!this.editingTask.user_id) return false;
      return Number(this.editingTask.user_id) === Number(this.user?.id);
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
        this.priority = newTask.priority || 'medium';
        this.description = newTask.description || '';
        this.isBig = !!newTask.is_big;
        this.dueDate = newTask.due_date ? new Date(newTask.due_date).toISOString().slice(0, 16) : '';
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
          const payload = {
            title: this.title,
            description: this.description || null,
            priority: this.priority,
            due_date: this.dueDate || null,
            is_big: this.isBig
          };
          if (this.canEditStatus) payload.status = this.status;
          if (this.projectId) payload.project_id = this.projectId;
          if (this.assigneeId) payload.user_id = this.assigneeId;
          await api.put(`/tasks/${this.editingTask.id}`, payload);
          toast.success('Task updated');
          this.$emit('taskUpdated');
        } else {
          const formData = new FormData();
          formData.append('title', this.title);
          formData.append('description', this.description || '');
          formData.append('project_id', this.projectId);
          formData.append('user_id', this.assigneeId);
          formData.append('priority', this.priority);
          formData.append('is_big', this.isBig);
          if (this.dueDate) formData.append('due_date', this.dueDate);
          this.attachments.forEach((file) => {
            formData.append('attachments', file);
          });

          await api.post('/tasks', formData);
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

    handleAttachments(event) {
      this.attachments = Array.from(event.target.files).slice(0, 5);
    },

    resetForm() {
      this.title = '';
      this.status = 'todo';
      this.priority = 'medium';
      this.description = '';
      this.isBig = false;
      this.dueDate = '';
      this.attachments = [];
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

.field textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
  font: inherit;
  color: #0f172a;
  background: #fff;
  resize: vertical;
  min-height: 88px;
  outline: none;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;
}

.field textarea:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.14);
}

.toggle-field {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 8px;
}

.toggle-field input[type='checkbox'] {
  width: auto;
  flex: 0 0 auto;
  margin: 0;
}

.toggle-text {
  margin: 0;
  display: inline-block;
  cursor: pointer;
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