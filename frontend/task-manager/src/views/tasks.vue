<template>
  <div>
    <div class="page-shell">
      <div class="page-header">
        <div class="header-row">
          <button v-if="user?.role === 'admin'" class="add-btn" type="button" @click="openAddTaskModal">
            Add task
          </button>
        </div>
      </div>

      <div v-if="user?.role !== 'admin'" class="card glass-card">
        <p class="helper">
          You can view tasks from projects you joined. Admins manage task creation and details.
        </p>
      </div>

      <div class="toolbar card glass-card">
        <input v-model="search" placeholder="Search tasks..." />
        <select v-model="selectedProject">
          <option value="">All projects</option>
          <option v-for="project in projects" :key="project.id" :value="project.name">
            {{ project.name }}
          </option>
        </select>
        <select v-model="selectedPriority">
          <option value="">All priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
        </select>
        <select v-model="selectedStatus">
          <option value="">All statuses</option>
          <option value="todo">Todo</option>
          <option value="in-progress">In Progress</option>
          <option value="done">Done</option>
        </select>
        <label class="inline-check">
          <input v-model="showOnlyOverdue" type="checkbox" />
          <span>Overdue only</span>
        </label>
        <label class="inline-check">
          <input v-model="showOnlyBig" type="checkbox" />
          <span>Big tasks only</span>
        </label>
      </div>
      <p v-if="error" class="error">{{ error }}</p>

      <div class="board">
        <section class="column">
          <div class="column-head">
            <h3>Todo</h3>
            <span>{{ groupedTasks.todo.length }}</span>
          </div>
          <TaskCard
            v-for="task in groupedTasks.todo"
            :key="task.id"
            :task="task"
            :canManage="user?.role === 'admin'"
            :viewerUserId="user?.id"
            @deleted="getTasks"
            @edit="handleEdit"
            @move="handleMove"
            @details="openDetails"
          />
        </section>

        <section class="column">
          <div class="column-head">
            <h3>In Progress</h3>
            <span>{{ groupedTasks['in-progress'].length }}</span>
          </div>
          <TaskCard
            v-for="task in groupedTasks['in-progress']"
            :key="task.id"
            :task="task"
            :canManage="user?.role === 'admin'"
            :viewerUserId="user?.id"
            @deleted="getTasks"
            @edit="handleEdit"
            @move="handleMove"
            @details="openDetails"
          />
        </section>

        <section class="column">
          <div class="column-head">
            <h3>Done</h3>
            <span>{{ groupedTasks.done.length }}</span>
          </div>
          <TaskCard
            v-for="task in groupedTasks.done"
            :key="task.id"
            :task="task"
            :canManage="user?.role === 'admin'"
            :viewerUserId="user?.id"
            @deleted="getTasks"
            @edit="handleEdit"
            @move="handleMove"
            @details="openDetails"
          />
        </section>
      </div>
    </div>

    <BaseModal v-model="showTaskModal" :title="editingTask ? 'Update task' : 'Add task'">
      <TaskForm
        v-if="user?.role === 'admin'"
        :editingTask="editingTask"
        :projects="projects"
        @taskCreated="
          () => {
            showTaskModal = false;
            getTasks();
          }
        "
        @taskUpdated="handleUpdated"
        @cancelEdit="cancelEdit"
      />
    </BaseModal>

    <BaseModal v-model="showDetailsModal" :title="selectedTask ? `Task Details: ${selectedTask.title}` : 'Task Details'">
      <div v-if="selectedTask" class="details-grid">
        <div class="detail-card">
          <h4>Overview</h4>
          <p><strong>Status:</strong> {{ selectedTask.status }}</p>
          <p><strong>Priority:</strong> {{ selectedTask.priority || 'medium' }}</p>
          <p><strong>Assignee:</strong> {{ selectedTask.assignee_username || selectedTask.assignee_email || 'Unassigned' }}</p>
          <p><strong>Project:</strong> {{ selectedTask.project_name || 'N/A' }}</p>
          <p><strong>Due:</strong> {{ selectedTask.due_date ? formatDate(selectedTask.due_date) : 'No due date' }}</p>
          <p><strong>Big task:</strong> {{ selectedTask.is_big ? 'Yes' : 'No' }}</p>
          <p><strong>Description:</strong> {{ selectedTask.description || 'No description' }}</p>
          <div class="attachments">
            <p><strong>Attachments:</strong></p>
            <p v-if="!selectedTask.attachments?.length" class="helper">No attachments</p>
            <ul v-else class="attachment-list">
              <li v-for="att in selectedTask.attachments" :key="att.id || att.url">
                <a :href="attachmentUrl(att.url)" target="_blank" rel="noopener noreferrer">
                  {{ att.original_name || att.file_name || 'Attachment' }}
                </a>
                <img
                  v-if="att.mime_type && att.mime_type.startsWith('image/')"
                  :src="attachmentUrl(att.url)"
                  :alt="att.original_name || 'task attachment'"
                  class="attachment-preview"
                />
              </li>
            </ul>
          </div>
        </div>
        <div class="detail-card">
          <h4>Activity</h4>
          <p v-if="loadingActivity" class="helper">Loading activity...</p>
          <p v-else-if="!taskActivity.length" class="helper">No activity yet.</p>
          <ul v-else class="activity-list">
            <li v-for="item in taskActivity" :key="item.id">
              <p>{{ item.detail || item.action }}</p>
              <small>
                {{ item.username || item.email || 'System' }} • {{ formatDate(item.created_at) }}
              </small>
            </li>
          </ul>
        </div>
      </div>
    </BaseModal>
  </div>
</template>

<script>
import TaskCard from '../components/taskcard.vue';
import TaskForm from '../components/taskform.vue';
import api from '../api/api';
import { getUser } from '@/utils/auth';
import BaseModal from '@/components/baseModal.vue';
import { toast } from '@/utils/toast';

export default {
  components: { TaskCard, TaskForm, BaseModal },
  data() {
    return {
      tasks: [],
      projects: [],
      editingTask: null,
      user: null,
      search: '',
      selectedProject: '',
      selectedPriority: '',
      selectedStatus: '',
      showOnlyOverdue: false,
      showOnlyBig: false,
      error: '',
      refreshTimer: null,
      onFocus: null,
      showTaskModal: false,
      notifications: [],
      showDetailsModal: false,
      selectedTask: null,
      taskActivity: [],
      loadingActivity: false,
      pendingTaskIdFromRoute: null
    };
  },
  watch: {
    '$route.query.taskId': {
      immediate: true,
      handler(value) {
        this.pendingTaskIdFromRoute = value ? String(value) : null;
        this.tryOpenTaskFromRoute();
      }
    }
  },
  computed: {
    filteredTasks() {
      const q = this.search.trim().toLowerCase();
      const now = new Date();
      return this.tasks.filter((task) => {
        const matchesSearch = !q || task.title.toLowerCase().includes(q);
        const matchesProject = !this.selectedProject || task.project_name === this.selectedProject;
        const matchesPriority = !this.selectedPriority || task.priority === this.selectedPriority;
        const matchesStatus = !this.selectedStatus || task.status === this.selectedStatus;
        const matchesOverdue = !this.showOnlyOverdue || (task.due_date && task.status !== 'done' && new Date(task.due_date) < now);
        const matchesBig = !this.showOnlyBig || !!task.is_big;
        return matchesSearch && matchesProject && matchesPriority && matchesStatus && matchesOverdue && matchesBig;
      });
    },
    groupedTasks() {
      return {
        todo: this.filteredTasks.filter((task) => task.status === 'todo'),
        'in-progress': this.filteredTasks.filter((task) => task.status === 'in-progress'),
        done: this.filteredTasks.filter((task) => task.status === 'done')
      };
    }
  },
  mounted() {
    this.user = getUser();
    this.getProjects();
    this.getTasks();

    // Keep member task list up-to-date (admin edits should reflect automatically).
    this.refreshTimer = window.setInterval(() => {
      this.getTasks();
    }, 8000);
    this.onFocus = () => this.getTasks();
    window.addEventListener('focus', this.onFocus);
  },
  beforeUnmount() {
    if (this.refreshTimer) window.clearInterval(this.refreshTimer);
    if (this.onFocus) window.removeEventListener('focus', this.onFocus);
  },
  methods: {
    async getProjects() {
      try {
        const res = await api.get('/projects');
        this.projects = res.data;
      } catch (err) {
        console.error(err);
      }
    },
    async getTasks() {
      try {
        const res = await api.get('/tasks');
        this.tasks = res.data;
        await this.getNotifications();
        this.tryOpenTaskFromRoute();
      } catch (err) {
        // avoid noisy errors during background refresh; keep last good list
        console.error(err);
      }
    },

    async getNotifications() {
      try {
        const res = await api.get('/notifications');
        this.notifications = res.data;

        const unread = this.notifications.filter((notification) => !notification.is_read);
        if (unread.length) {
          await Promise.all(
            unread.map(async (notification) => {
              toast.info(notification.message, { title: 'New Notification', timeoutMs: 7000 });
              await api.put(`/notifications/${notification.id}/read`);
            })
          );
        }
      } catch (err) {
        console.error(err);
      }
    },
    handleEdit(task) {
      this.editingTask = task;
      this.showTaskModal = true;
    },
    handleUpdated() {
      this.editingTask = null;
      this.showTaskModal = false;
      this.getTasks();
    },
    async handleMove({ task, status }) {
      try {
        this.error = '';
        await api.put(`/tasks/${task.id}`, { status });
        this.getTasks();
      } catch (err) {
        this.error = err.response?.data?.message || 'Failed to move task';
      }
    },
    cancelEdit() {
      this.editingTask = null;
      this.showTaskModal = false;
    },
    openAddTaskModal() {
      this.editingTask = null;
      this.showTaskModal = true;
    },
    async openDetails(task) {
      this.selectedTask = task;
      this.showDetailsModal = true;
      await this.loadTaskActivity(task.id);
    },
    tryOpenTaskFromRoute() {
      if (!this.pendingTaskIdFromRoute || !this.tasks.length) return;
      const match = this.tasks.find((task) => String(task.id) === this.pendingTaskIdFromRoute);
      if (!match) return;
      this.pendingTaskIdFromRoute = null;
      this.openDetails(match);
    },
    async loadTaskActivity(taskId) {
      try {
        this.loadingActivity = true;
        const res = await api.get(`/tasks/${taskId}/activity`);
        this.taskActivity = res.data || [];
      } catch (err) {
        console.error(err);
        this.taskActivity = [];
      } finally {
        this.loadingActivity = false;
      }
    },
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
    attachmentUrl(path) {
      if (!path) return '#';
      if (path.startsWith('http://') || path.startsWith('https://')) return path;
      return `http://localhost:5000${path}`;
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

.add-btn {
  white-space: nowrap;
}
.container {
  width: 100%;
}

.card {
  background: rgba(255, 255, 255, 0.88);
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  margin-bottom: 14px;
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.06);
}

.toolbar {
  display: grid;
  grid-template-columns: 1fr 220px 180px 180px auto auto;
  gap: 10px;
}

.inline-check {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 6px;
  color: #475569;
  white-space: nowrap;
}

.inline-check input[type='checkbox'] {
  width: auto;
  flex: 0 0 auto;
  margin: 0;
}

.inline-check span {
  font-size: 13px;
  display: inline-block;
}

.helper {
  color: #666;
}

.error {
  color: #dc2626;
  margin: 8px 0 12px;
  font-size: 14px;
}

.board {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.column {
  background: linear-gradient(180deg, #f8fafc 0%, #eef2ff 100%);
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  min-height: 300px;
  display: grid;
  align-content: start;
  gap: 10px;
}

.column-head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2px;
}

.column-head h3 {
  font-size: 15px;
}

.column-head span {
  background: #e2e8f0;
  color: #334155;
  border-radius: 999px;
  padding: 2px 10px;
  font-size: 12px;
  font-weight: 700;
}

.details-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.detail-card {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  background: #fff;
}

.detail-card h4 {
  margin-bottom: 10px;
}

.detail-card p {
  margin-bottom: 8px;
}

.attachments {
  margin-top: 8px;
}

.attachment-list {
  list-style: none;
  margin: 6px 0 0;
  padding: 0;
  display: grid;
  gap: 8px;
}

.attachment-list a {
  color: #4338ca;
  font-weight: 600;
  text-decoration: none;
}

.attachment-list a:hover {
  text-decoration: underline;
}

.attachment-preview {
  margin-top: 6px;
  width: 100%;
  max-height: 140px;
  object-fit: cover;
  border-radius: 8px;
  border: 1px solid #e2e8f0;
}

.activity-list {
  list-style: none;
  margin: 0;
  padding: 0;
  max-height: 320px;
  overflow: auto;
}

.activity-list li {
  padding: 8px 0;
  border-bottom: 1px solid #f1f5f9;
}

.activity-list small {
  color: #64748b;
}

@media (max-width: 980px) {
  .header-row {
    flex-direction: column;
    align-items: stretch;
  }
  .toolbar {
    grid-template-columns: 1fr;
  }

  .board {
    grid-template-columns: 1fr;
  }
  .details-grid {
    grid-template-columns: 1fr;
  }
}
</style>
