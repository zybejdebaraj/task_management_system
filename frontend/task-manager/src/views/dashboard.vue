<template>
  <div class="page-shell">
    <section class="hero glass-card">
      <h2>{{ isAdminUser ? 'Admin Dashboard' : 'Member Dashboard' }}</h2>
      <p>
        {{ isAdminUser
          ? 'Track team output, project load, and completion speed.'
          : 'Track your joined-project workload and delivery speed.' }}
      </p>
    </section>

    <section class="kpi-grid">
      <article class="kpi-card glass-card">
        <h3>Total Tasks</h3>
        <p class="kpi-value">{{ stats.totalTasks }}</p>
      </article>
      <article class="kpi-card glass-card">
        <h3>{{ isAdminUser ? 'Completed Tasks' : 'Your Completed Tasks' }}</h3>
        <p class="kpi-value">{{ stats.doneTasks }}</p>
      </article>
      <article class="kpi-card glass-card">
        <h3>Avg Completion Time</h3>
        <p class="kpi-value">{{ stats.avgCompletionText }}</p>
      </article>
      <article class="kpi-card glass-card">
        <h3>{{ isAdminUser ? 'Total Projects' : 'Joined Projects' }}</h3>
        <p class="kpi-value">{{ stats.totalProjects }}</p>
      </article>
    </section>

    <section class="charts-grid">
      <article class="chart-card glass-card">
        <h3>Tasks by Status</h3>
        <canvas ref="statusChartRef"></canvas>
      </article>
      <article class="chart-card glass-card">
        <h3>{{ isAdminUser ? 'Tasks by Project' : 'Your Tasks by Project' }}</h3>
        <canvas ref="projectChartRef"></canvas>
      </article>
    </section>

    <section class="charts-grid single">
      <article class="chart-card glass-card">
        <h3>Task Throughput (Last 7 Days)</h3>
        <canvas ref="throughputChartRef"></canvas>
      </article>
    </section>
  </div>
</template>

<script>
import Chart from 'chart.js/auto';
import api from '../api/api';
import { getUser } from '@/utils/auth';

export default {
  data() {
    return {
      user: null,
      tasks: [],
      projects: [],
      statusChart: null,
      projectChart: null,
      throughputChart: null
    };
  },
  computed: {
    isAdminUser() {
      return this.user?.role === 'admin';
    },
    stats() {
      const totalTasks = this.tasks.length;
      const doneTasks = this.tasks.filter((t) => t.status === 'done').length;
      const completionHours = this.tasks
        .filter((t) => t.completed_at && t.created_at)
        .map((t) => (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60))
        .filter((h) => Number.isFinite(h) && h >= 0);
      const avgCompletionHours = completionHours.length
        ? completionHours.reduce((acc, val) => acc + val, 0) / completionHours.length
        : 0;
      return {
        totalTasks,
        doneTasks,
        totalProjects: this.projects.length,
        avgCompletionText: avgCompletionHours ? `${avgCompletionHours.toFixed(1)} hrs` : 'N/A'
      };
    }
  },
  async mounted() {
    this.user = getUser();
    await this.loadData();
    this.renderCharts();
  },
  beforeUnmount() {
    this.destroyCharts();
  },
  methods: {
    async loadData() {
      try {
        const [tasksRes, projectsRes] = await Promise.all([api.get('/tasks'), api.get('/projects')]);
        this.tasks = tasksRes.data;
        this.projects = projectsRes.data;
      } catch (err) {
        console.error(err);
      }
    },
    destroyCharts() {
      if (this.statusChart) this.statusChart.destroy();
      if (this.projectChart) this.projectChart.destroy();
      if (this.throughputChart) this.throughputChart.destroy();
    },
    renderCharts() {
      this.destroyCharts();
      // When navigating quickly, the component can unmount before Chart.js draws.
      if (!this.$refs.statusChartRef || !this.$refs.projectChartRef || !this.$refs.throughputChartRef) return;

      const statusCounts = {
        todo: this.tasks.filter((t) => t.status === 'todo').length,
        inProgress: this.tasks.filter((t) => t.status === 'in-progress').length,
        done: this.tasks.filter((t) => t.status === 'done').length
      };

      this.statusChart = new Chart(this.$refs.statusChartRef, {
        type: 'doughnut',
        data: {
          labels: ['Todo', 'In Progress', 'Done'],
          datasets: [
            {
              data: [statusCounts.todo, statusCounts.inProgress, statusCounts.done],
              backgroundColor: ['#94a3b8', '#f59e0b', '#22c55e']
            }
          ]
        },
        options: { responsive: true, maintainAspectRatio: false }
      });

      const projectMap = {};
      this.tasks.forEach((task) => {
        const key = task.project_name || 'Unassigned';
        projectMap[key] = (projectMap[key] || 0) + 1;
      });

      this.projectChart = new Chart(this.$refs.projectChartRef, {
        type: 'bar',
        data: {
          labels: Object.keys(projectMap),
          datasets: [
            {
              label: 'Tasks',
              data: Object.values(projectMap),
              backgroundColor: '#6366f1'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });

      const days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);
        return d;
      });

      const labels = days.map((d) =>
        d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
      );
      const createdCounts = days.map((d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        return this.tasks.filter((t) => {
          const created = new Date(t.created_at);
          return created >= d && created < next;
        }).length;
      });
      const doneCounts = days.map((d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        return this.tasks.filter((t) => {
          if (!t.completed_at) return false;
          const completed = new Date(t.completed_at);
          return completed >= d && completed < next;
        }).length;
      });

      this.throughputChart = new Chart(this.$refs.throughputChartRef, {
        type: 'line',
        data: {
          labels,
          datasets: [
            {
              label: 'Created',
              data: createdCounts,
              borderColor: '#6366f1',
              backgroundColor: 'rgba(99,102,241,0.2)',
              tension: 0.3
            },
            {
              label: 'Completed',
              data: doneCounts,
              borderColor: '#16a34a',
              backgroundColor: 'rgba(22,163,74,0.2)',
              tension: 0.3
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: { y: { beginAtZero: true, ticks: { precision: 0 } } }
        }
      });
    }
  }
};
</script>

<style scoped>
.hero {
  background: linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #0891b2 100%);
  color: #fff;
  border: none;
  border-radius: 16px;
  padding: 24px;
  box-shadow: 0 14px 30px rgba(49, 46, 129, 0.35);
}

.hero h2 {
  margin-bottom: 10px;
}

.hero p {
  color: #e2e8f0;
}

.kpi-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
}

.kpi-card {
  background: linear-gradient(180deg, #ffffff 0%, #f8fafc 100%);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 18px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.06);
}

.kpi-card h3 {
  font-size: 14px;
  color: #64748b;
  margin-bottom: 8px;
}

.kpi-value {
  font-size: 28px;
  font-weight: 700;
  color: #1e1b4b;
}

.charts-grid {
  margin-top: 16px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 16px;
}

.charts-grid.single {
  grid-template-columns: 1fr;
}

.chart-card {
  background: rgba(255, 255, 255, 0.92);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 16px;
  min-height: 320px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.chart-card h3 {
  margin-bottom: 12px;
}

.chart-card canvas {
  width: 100% !important;
  height: 250px !important;
}
</style>