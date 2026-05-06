<template>
  <div class="p-4 space-y-6">

    <!-- Hero banner -->
    <section class="bg-gradient-to-r from-indigo-700 via-indigo-600 to-violet-600 text-white rounded-2xl px-6 py-5 shadow-lg">
      <p class="text-indigo-100 text-sm">
        {{ isAdminUser ? 'Track team output, project load, and completion speed.' : 'Track your joined-project workload and delivery speed.' }}
      </p>
    </section>

    <!-- KPI cards -->
    <section class="grid grid-cols-2 lg:grid-cols-4 gap-4">
      <article v-for="kpi in kpiCards" :key="kpi.label" class="bg-white rounded-2xl border border-slate-200 shadow-sm px-5 py-4 hover:shadow-md transition">
        <p class="text-xs font-semibold text-slate-400 uppercase tracking-wide mb-2">{{ kpi.label }}</p>
        <p class="text-3xl font-black text-slate-900">{{ kpi.value }}</p>
      </article>
    </section>

    <!-- Charts row -->
    <section class="grid lg:grid-cols-2 gap-5">
      <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 class="font-bold text-slate-800 mb-4">Tasks by Status</h3>
        <div class="h-56"><canvas ref="statusChartRef"></canvas></div>
      </article>
      <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 class="font-bold text-slate-800 mb-4">{{ isAdminUser ? 'Tasks by Project' : 'Your Tasks by Project' }}</h3>
        <div class="h-56"><canvas ref="projectChartRef"></canvas></div>
      </article>
    </section>

    <!-- Throughput -->
    <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
      <h3 class="font-bold text-slate-800 mb-4">Task Throughput (Last 7 Days)</h3>
      <div class="h-52"><canvas ref="throughputChartRef"></canvas></div>
    </article>

    <!-- Admin-only reports -->
    <section v-if="isAdminUser" class="grid lg:grid-cols-2 gap-5">
      <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 class="font-bold text-slate-800 mb-4">Team Productivity</h3>
        <div class="overflow-auto rounded-xl border border-slate-100">
          <table class="w-full text-sm border-collapse">
            <thead>
              <tr class="bg-slate-50 text-slate-500 text-xs uppercase tracking-wide">
                <th class="text-left px-4 py-3 font-semibold">Member</th>
                <th class="text-left px-4 py-3 font-semibold">Total</th>
                <th class="text-left px-4 py-3 font-semibold">Done</th>
                <th class="text-left px-4 py-3 font-semibold">In Progress</th>
                <th class="text-left px-4 py-3 font-semibold">Overdue</th>
                <th class="text-left px-4 py-3 font-semibold">Avg Complete</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100">
              <tr v-for="row in teamProductivity" :key="row.assignee" class="hover:bg-slate-50 transition">
                <td class="px-4 py-3 font-medium text-slate-800">{{ row.assignee }}</td>
                <td class="px-4 py-3 text-slate-600">{{ row.total }}</td>
                <td class="px-4 py-3"><span class="bg-green-100 text-green-700 text-xs font-semibold px-2 py-0.5 rounded-full">{{ row.done }}</span></td>
                <td class="px-4 py-3"><span class="bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full">{{ row.inProgress }}</span></td>
                <td class="px-4 py-3"><span class="bg-red-100 text-red-700 text-xs font-semibold px-2 py-0.5 rounded-full">{{ row.overdue }}</span></td>
                <td class="px-4 py-3 text-slate-500 text-xs">{{ row.avgCompletionText }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </article>

      <article class="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
        <h3 class="font-bold text-slate-800 mb-4">Project Progress</h3>
        <div class="h-56"><canvas ref="projectProgressChartRef"></canvas></div>
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
    return { user: null, tasks: [], projects: [], statusChart: null, projectChart: null, throughputChart: null, projectProgressChart: null };
  },
  computed: {
    isAdminUser() { return this.user?.role === 'admin'; },
    kpiCards() {
      return [
        { label: 'Total Tasks', value: this.stats.totalTasks },
        { label: this.isAdminUser ? 'Completed Tasks' : 'Your Completed Tasks', value: this.stats.doneTasks },
        { label: 'Avg Completion Time', value: this.stats.avgCompletionText },
        { label: this.isAdminUser ? 'Total Projects' : 'Joined Projects', value: this.stats.totalProjects },
      ];
    },
    stats() {
      const totalTasks = this.tasks.length;
      const doneTasks = this.tasks.filter(t => t.status === 'done').length;
      const completionHours = this.tasks.filter(t => t.completed_at && t.created_at)
        .map(t => (new Date(t.completed_at) - new Date(t.created_at)) / (1000 * 60 * 60))
        .filter(h => Number.isFinite(h) && h >= 0);
      const avgCompletionHours = completionHours.length ? completionHours.reduce((a, v) => a + v, 0) / completionHours.length : 0;
      return { totalTasks, doneTasks, totalProjects: this.projects.length, avgCompletionText: completionHours.length ? `${avgCompletionHours.toFixed(1)} hrs` : 'N/A' };
    },
    teamProductivity() {
      const members = {};
      const now = new Date();
      this.tasks.forEach(task => {
        const name = task.assignee_username || task.assignee_email || 'Unassigned';
        if (!members[name]) members[name] = { total: 0, done: 0, inProgress: 0, overdue: 0, completedCount: 0, totalCompletionHours: 0 };
        members[name].total += 1;
        if (task.status === 'done') members[name].done += 1;
        if (task.status === 'in-progress') members[name].inProgress += 1;
        if (task.due_date && task.status !== 'done' && new Date(task.due_date) < now) members[name].overdue += 1;
        if (task.status === 'done' && task.completed_at && task.created_at) {
          const hours = (new Date(task.completed_at) - new Date(task.created_at)) / (1000 * 60 * 60);
          if (Number.isFinite(hours) && hours >= 0) { members[name].completedCount += 1; members[name].totalCompletionHours += hours; }
        }
      });
      return Object.entries(members).map(([assignee, s]) => ({ assignee, total: s.total, done: s.done, inProgress: s.inProgress, overdue: s.overdue, avgCompletionText: s.completedCount ? `${(s.totalCompletionHours / s.completedCount).toFixed(1)} hrs` : 'N/A' })).filter(r => r.assignee !== this.user?.username && r.assignee !== this.user?.email).sort((a, b) => b.total - a.total);
    },
    projectProgress() {
      const projects = {};
      const now = new Date();
      this.projects.forEach(p => { projects[p.name] = { total: 0, done: 0, overdue: 0, completedCount: 0, totalCompletionHours: 0 }; });
      this.tasks.forEach(task => {
        const name = task.project_name || 'Unassigned';
        if (!projects[name]) projects[name] = { total: 0, done: 0, overdue: 0, completedCount: 0, totalCompletionHours: 0 };
        projects[name].total += 1;
        if (task.status === 'done') projects[name].done += 1;
        if (task.due_date && task.status !== 'done' && new Date(task.due_date) < now) projects[name].overdue += 1;
        if (task.status === 'done' && task.completed_at && task.created_at) {
          const hours = (new Date(task.completed_at) - new Date(task.created_at)) / (1000 * 60 * 60);
          if (Number.isFinite(hours) && hours >= 0) { projects[name].completedCount += 1; projects[name].totalCompletionHours += hours; }
        }
      });
      return Object.entries(projects).map(([projectName, s]) => ({ projectName, total: s.total, done: s.done, progressText: s.total ? `${((s.done / s.total) * 100).toFixed(0)}%` : '0%' })).sort((a, b) => b.total - a.total);
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
      } catch (err) { console.error(err); }
    },
    destroyCharts() {
      [this.statusChart, this.projectChart, this.throughputChart, this.projectProgressChart].forEach(c => c?.destroy());
    },
    renderCharts() {
      this.destroyCharts();
      if (!this.$refs.statusChartRef || !this.$refs.projectChartRef || !this.$refs.throughputChartRef) return;
      const statusCounts = { todo: this.tasks.filter(t => t.status === 'todo').length, inProgress: this.tasks.filter(t => t.status === 'in-progress').length, done: this.tasks.filter(t => t.status === 'done').length };
      this.statusChart = new Chart(this.$refs.statusChartRef, { type: 'doughnut', data: { labels: ['Todo', 'In Progress', 'Done'], datasets: [{ data: [statusCounts.todo, statusCounts.inProgress, statusCounts.done], backgroundColor: ['#94a3b8', '#f59e0b', '#22c55e'] }] }, options: { responsive: true, maintainAspectRatio: false } });
      const projectMap = {};
      this.projects.forEach(p => { projectMap[p.name] = { todo: 0, 'in-progress': 0, done: 0 }; });
      this.tasks.forEach(task => { const key = task.project_name || 'Unassigned'; if (!projectMap[key]) projectMap[key] = { todo: 0, 'in-progress': 0, done: 0 }; if (task.status === 'todo') projectMap[key].todo += 1; else if (task.status === 'in-progress') projectMap[key]['in-progress'] += 1; else if (task.status === 'done') projectMap[key].done += 1; });
      this.projectChart = new Chart(this.$refs.projectChartRef, { type: 'bar', data: { labels: Object.keys(projectMap), datasets: [{ label: 'Todo', data: Object.values(projectMap).map(p => p.todo), backgroundColor: '#94a3b8' }, { label: 'In Progress', data: Object.values(projectMap).map(p => p['in-progress']), backgroundColor: '#f59e0b' }, { label: 'Done', data: Object.values(projectMap).map(p => p.done), backgroundColor: '#22c55e' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } }, plugins: { legend: { position: 'bottom' } } } });
      const days = [...Array(7)].map((_, i) => { const d = new Date(); d.setDate(d.getDate() - (6 - i)); d.setHours(0, 0, 0, 0); return d; });
      const labels = days.map(d => d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }));
      const createdCounts = days.map(d => { const next = new Date(d); next.setDate(next.getDate() + 1); return this.tasks.filter(t => { const c = new Date(t.created_at); return c >= d && c < next; }).length; });
      const doneCounts = days.map(d => { const next = new Date(d); next.setDate(next.getDate() + 1); return this.tasks.filter(t => { if (!t.completed_at) return false; const c = new Date(t.completed_at); return c >= d && c < next; }).length; });
      this.throughputChart = new Chart(this.$refs.throughputChartRef, { type: 'line', data: { labels, datasets: [{ label: 'Created', data: createdCounts, borderColor: '#6366f1', backgroundColor: 'rgba(99,102,241,0.1)', tension: 0.3 }, { label: 'Completed', data: doneCounts, borderColor: '#22c55e', backgroundColor: 'rgba(34,197,94,0.1)', tension: 0.3 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } } });
      if (this.isAdminUser && this.$refs.projectProgressChartRef) {
        this.projectProgressChart = new Chart(this.$refs.projectProgressChartRef, { type: 'bar', data: { labels: this.projectProgress.map(p => p.projectName), datasets: [{ label: 'Progress (%)', data: this.projectProgress.map(p => parseFloat(p.progressText)), backgroundColor: '#6366f1' }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true, max: 100, ticks: { callback: v => v + '%' } } } } });
      }
    }
  }
};
</script>

