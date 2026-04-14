<template>
  <div class="page-shell">
    <section class="hero glass-card">
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

    <section class="report-grid" v-if="isAdminUser">
      <article class="report-card glass-card">
        <h3>Team Productivity</h3>
        <table>
          <thead>
            <tr>
              <th>Member</th>
              <th>Total</th>
              <th>Done</th>
              <th>In Progress</th>
              <th>Overdue</th>
              <th>Avg Complete</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in teamProductivity" :key="row.assignee">
              <td>{{ row.assignee }}</td>
              <td>{{ row.total }}</td>
              <td>{{ row.done }}</td>
              <td>{{ row.inProgress }}</td>
              <td>{{ row.overdue }}</td>
              <td>{{ row.avgCompletionText }}</td>
            </tr>
          </tbody>
        </table>
      </article>

      <article class="report-card glass-card">
        <h3>Project Progress</h3>
        <canvas ref="projectProgressChartRef"></canvas>
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
      throughputChart: null,
      projectProgressChart: null
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
        avgCompletionText: completionHours.length ? `${avgCompletionHours.toFixed(1)} hrs` : 'N/A'
      };
    },
    teamProductivity() {
      const members = {};
      const now = new Date();

      this.tasks.forEach((task) => {
        const name = task.assignee_username || task.assignee_email || 'Unassigned';
        if (!members[name]) {
          members[name] = {
            total: 0,
            done: 0,
            inProgress: 0,
            overdue: 0,
            completedCount: 0,
            totalCompletionHours: 0
          };
        }

        members[name].total += 1;
        if (task.status === 'done') {
          members[name].done += 1;
        }
        if (task.status === 'in-progress') {
          members[name].inProgress += 1;
        }
        if (task.due_date && task.status !== 'done' && new Date(task.due_date) < now) {
          members[name].overdue += 1;
        }
        if (task.status === 'done' && task.completed_at && task.created_at) {
          const hours = (new Date(task.completed_at) - new Date(task.created_at)) / (1000 * 60 * 60);
          if (Number.isFinite(hours) && hours >= 0) {
            members[name].completedCount += 1;
            members[name].totalCompletionHours += hours;
          }
        }
      });

      return Object.entries(members)
        .map(([assignee, stats]) => ({
          assignee,
          total: stats.total,
          done: stats.done,
          inProgress: stats.inProgress,
          overdue: stats.overdue,
          avgCompletionText: stats.completedCount
            ? `${(stats.totalCompletionHours / stats.completedCount).toFixed(1)} hrs`
            : 'N/A'
        }))
        .filter(row => row.assignee !== this.user.username && row.assignee !== this.user.email)
        .sort((a, b) => b.total - a.total);
    },
    projectProgress() {
      const projects = {};
      const now = new Date();

      this.tasks.forEach((task) => {
        const name = task.project_name || 'Unassigned';
        if (!projects[name]) {
          projects[name] = {
            total: 0,
            done: 0,
            overdue: 0,
            completedCount: 0,
            totalCompletionHours: 0
          };
        }

        projects[name].total += 1;
        if (task.status === 'done') {
          projects[name].done += 1;
        }
        if (task.due_date && task.status !== 'done' && new Date(task.due_date) < now) {
          projects[name].overdue += 1;
        }
        if (task.status === 'done' && task.completed_at && task.created_at) {
          const hours = (new Date(task.completed_at) - new Date(task.created_at)) / (1000 * 60 * 60);
          if (Number.isFinite(hours) && hours >= 0) {
            projects[name].completedCount += 1;
            projects[name].totalCompletionHours += hours;
          }
        }
      });

      return Object.entries(projects)
        .map(([projectName, stats]) => ({
          projectName,
          total: stats.total,
          done: stats.done,
          overdue: stats.overdue,
          progressText: stats.total ? `${((stats.done / stats.total) * 100).toFixed(0)}%` : '0%',
          avgCompletionText: stats.completedCount
            ? `${(stats.totalCompletionHours / stats.completedCount).toFixed(1)} hrs`
            : 'N/A'
        }))
        .sort((a, b) => b.total - a.total);
    }
  },
  async mounted() {
    console.log('dashboard mounted');
    this.user = getUser();
    console.log('user', this.user);
    await this.loadData();
    this.renderCharts();
  },
  beforeUnmount() {
    this.destroyCharts();
  },
  methods: {
    async loadData() {
      try {
        console.log('loading data');
        const [tasksRes, projectsRes] = await Promise.all([api.get('/tasks'), api.get('/projects')]);
        this.tasks = tasksRes.data;
        this.projects = projectsRes.data;
        console.log('tasks loaded', this.tasks.length);
      } catch (err) {
        console.error(err);
      }
    },
    destroyCharts() {
      if (this.statusChart) this.statusChart.destroy();
      if (this.projectChart) this.projectChart.destroy();
      if (this.throughputChart) this.throughputChart.destroy();
      if (this.projectProgressChart) this.projectProgressChart.destroy();
    },
    renderCharts() {
      console.log('rendering charts');
      this.destroyCharts();
      // When navigating quickly, the component can unmount before Chart.js draws.
      if (!this.$refs.statusChartRef || !this.$refs.projectChartRef || !this.$refs.throughputChartRef) return;

      console.log('refs found');

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

      console.log('status chart created');

      const projectMap = {};
      this.tasks.forEach((task) => {
        const key = task.project_name || 'Unassigned';
        if (!projectMap[key]) {
          projectMap[key] = { todo: 0, 'in-progress': 0, done: 0 };
        }
        if (task.status === 'todo') projectMap[key].todo += 1;
        else if (task.status === 'in-progress') projectMap[key]['in-progress'] += 1;
        else if (task.status === 'done') projectMap[key].done += 1;
      });

      console.log('projectMap', projectMap);

      this.projectChart = new Chart(this.$refs.projectChartRef, {
        type: 'bar',
        data: {
          labels: Object.keys(projectMap),
          datasets: [
            {
              label: 'Todo',
              data: Object.values(projectMap).map(p => p.todo),
              backgroundColor: '#94a3b8'
            },
            {
              label: 'In Progress',
              data: Object.values(projectMap).map(p => p['in-progress']),
              backgroundColor: '#f59e0b'
            },
            {
              label: 'Done',
              data: Object.values(projectMap).map(p => p.done),
              backgroundColor: '#22c55e'
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          scales: {
            x: { stacked: true },
            y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } }
          },
          plugins: {
            legend: { position: 'bottom' }
          }
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

      const progressLabels = this.projectProgress.map((p) => p.projectName);
      const progressData = this.projectProgress.map((p) => parseFloat(p.progressText.replace('%', '')));

      if (this.isAdminUser && this.$refs.projectProgressChartRef) {
        this.projectProgressChart = new Chart(this.$refs.projectProgressChartRef, {
          type: 'bar',
          data: {
            labels: progressLabels,
            datasets: [
              {
                label: 'Progress (%)',
                data: progressData,
                backgroundColor: '#6366f1'
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true, max: 100, ticks: { callback: (value) => value + '%' } }
            }
          }
        });
      }
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

.report-grid {
  margin-top: 20px;
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
  gap: 16px;
}

.report-card {
  background: rgba(255, 255, 255, 0.94);
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 10px 24px rgba(15, 23, 42, 0.05);
}

.report-card h3 {
  margin-bottom: 12px;
}

.report-card canvas {
  width: 100% !important;
  height: 300px !important;
}

.report-card table {
  width: 100%;
  border-collapse: collapse;
  border-radius: 8px;
  overflow: hidden;
}

.report-card th,
.report-card td {
  text-align: left;
  padding: 10px 8px;
  border: 1px solid #e2e8f0;
  font-size: 13px;
}

.report-card th {
  color: #475569;
  font-weight: 700;
  background-color: #f1f5f9;
}
</style>