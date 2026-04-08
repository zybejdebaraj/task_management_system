<template>
  <div class="page-shell">
    <div class="page-header">
      <h2>Kanban Board</h2>
      <p class="page-subtitle">Trello/Jira-style workflow by status.</p>
    </div>

    <div class="card glass-card">
      <TaskForm
        v-if="user?.role === 'admin'"
        :editingTask="editingTask"
        :projects="projects"
        @taskCreated="getTasks"
        @taskUpdated="handleUpdated"
        @cancelEdit="cancelEdit"
      />

      <p v-else class="helper">
        You can view tasks from projects you joined. Ask admin to create or update tasks.
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
          @deleted="getTasks"
          @edit="handleEdit"
          @move="handleMove"
        />
      </section>
    </div>
  </div>
</template>

<script>
import TaskCard from '../components/taskcard.vue';
import TaskForm from '../components/taskform.vue';
import api from '../api/api';
import { getUser } from '@/utils/auth';

export default {
  components: { TaskCard, TaskForm },
  data() {
    return {
      tasks: [],
      projects: [],
      editingTask: null,
      user: null,
      search: '',
      selectedProject: ''
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
    async handleMove({ task, status }) {
      if (this.user?.role !== 'admin') return;
      try {
        await api.put(`/tasks/${task.id}`, {
          title: task.title,
          status,
          project_id: task.project_id
        });
        this.getTasks();
      } catch (err) {
        console.error(err);
      }
    },
    cancelEdit() {
      this.editingTask = null;
    }
  }
};
</script>

<style scoped>
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
  .toolbar {
    grid-template-columns: 1fr;
  }

  .board {
    grid-template-columns: 1fr;
  }
}
</style>
