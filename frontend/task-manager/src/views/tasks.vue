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
  </div>
</template>

<script>
import TaskCard from '../components/taskcard.vue';
import TaskForm from '../components/taskform.vue';
import api from '../api/api';
import { getUser } from '@/utils/auth';
import BaseModal from '@/components/baseModal.vue';

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
      error: '',
      refreshTimer: null,
      onFocus: null,
      showTaskModal: false
    };
  },
  computed: {
    filteredTasks() {
      const q = this.search.trim().toLowerCase();
      return this.tasks.filter((task) => {
        const matchesSearch = !q || task.title.toLowerCase().includes(q);
        const matchesProject = !this.selectedProject || task.project_name === this.selectedProject;
        return matchesSearch && matchesProject;
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
      } catch (err) {
        // avoid noisy errors during background refresh; keep last good list
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
  grid-template-columns: 1fr 260px;
  gap: 10px;
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
}
</style>
