<template>
  <div class="p-4 space-y-5">

    <!-- Header + search -->
    <div class="flex items-center justify-between gap-4 flex-wrap">
      <p class="text-sm text-slate-500">All activity across every task in the system.</p>
      <input
        v-model="search"
        placeholder="Search by task, user or action..."
        class="block w-72 rounded-xl border-slate-300 text-sm focus:border-indigo-500 focus:ring-indigo-500"
      />
    </div>

    <!-- Table card -->
    <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div class="overflow-auto">
        <table class="w-full text-sm border-collapse">
          <thead>
            <tr class="bg-slate-50 border-b border-slate-100 text-slate-400 text-xs uppercase tracking-wide">
              <th class="text-left px-5 py-3 font-semibold">When</th>
              <th class="text-left px-5 py-3 font-semibold">Task</th>
              <th class="text-left px-5 py-3 font-semibold">Action</th>
              <th class="text-left px-5 py-3 font-semibold">Detail</th>
              <th class="text-left px-5 py-3 font-semibold">By</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-50">
            <tr v-if="loading">
              <td colspan="5" class="px-5 py-8 text-center text-slate-400 text-sm">Loading activity...</td>
            </tr>
            <tr v-else-if="!filteredRows.length">
              <td colspan="5" class="px-5 py-8 text-center text-slate-400 text-sm">No activity found.</td>
            </tr>
            <tr
              v-else
              v-for="row in filteredRows"
              :key="row.id"
              class="hover:bg-slate-50 transition"
            >
              <td class="px-5 py-3 text-slate-400 text-xs whitespace-nowrap">{{ formatDate(row.created_at) }}</td>
              <td class="px-5 py-3">
                <span class="font-semibold text-slate-800">{{ row.task_title || '—' }}</span>
                <span class="text-slate-400 text-xs ml-1">#{{ row.task_id }}</span>
              </td>
              <td class="px-5 py-3">
                <span :class="actionClass(row.action)" class="text-xs font-bold uppercase tracking-wide px-2 py-0.5 rounded-full">
                  {{ row.action }}
                </span>
              </td>
              <td class="px-5 py-3 text-slate-600 text-xs max-w-xs truncate">{{ row.detail || '—' }}</td>
              <td class="px-5 py-3 text-slate-500 text-xs">{{ row.username || row.email || 'System' }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

  </div>
</template>

<script>
import api from '../api/api';

export default {
  data() {
    return { rows: [], loading: true, search: '' };
  },
  computed: {
    filteredRows() {
      const q = this.search.trim().toLowerCase();
      if (!q) return this.rows;
      return this.rows.filter(r =>
        (r.task_title || '').toLowerCase().includes(q) ||
        (r.action || '').toLowerCase().includes(q) ||
        (r.detail || '').toLowerCase().includes(q) ||
        (r.username || r.email || '').toLowerCase().includes(q)
      );
    }
  },
  async mounted() {
    try {
      const res = await api.get('/tasks/activity/all');
      this.rows = res.data;
    } catch (err) {
      console.error(err);
    } finally {
      this.loading = false;
    }
  },
  methods: {
    formatDate(value) {
      return new Date(value).toLocaleString();
    },
    actionClass(action) {
      if (!action) return 'bg-slate-100 text-slate-500';
      const a = action.toLowerCase();
      if (a.includes('creat')) return 'bg-green-100 text-green-700';
      if (a.includes('delet')) return 'bg-red-100 text-red-700';
      if (a.includes('complet') || a.includes('done')) return 'bg-blue-100 text-blue-700';
      if (a.includes('updat') || a.includes('edit') || a.includes('mov')) return 'bg-amber-100 text-amber-700';
      return 'bg-slate-100 text-slate-500';
    }
  }
};
</script>

