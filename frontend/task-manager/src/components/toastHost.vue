<template>
  <div
    class="fixed right-4 top-4 z-[9999] flex flex-col gap-2.5 w-80 max-w-[calc(100vw-2rem)]"
    aria-live="polite"
    aria-relevant="additions removals"
  >
    <div
      v-for="t in toasts"
      :key="t.id"
      class="flex items-start overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl cursor-pointer"
      role="status"
      @click="dismiss(t.id)"
      title="Click to dismiss"
    >
      <!-- Color bar -->
      <div class="w-1.5 shrink-0 self-stretch" :class="barClass(t.type)"></div>

      <!-- Content -->
      <div class="flex-1 px-3 py-3 min-w-0">
        <strong v-if="t.title" class="block text-xs font-bold text-slate-800 mb-0.5">{{ t.title }}</strong>
        <p class="text-xs text-slate-600 leading-snug m-0">{{ t.message }}</p>
      </div>

      <!-- Dismiss -->
      <button
        class="shrink-0 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-slate-700 text-lg border-none bg-transparent cursor-pointer"
        type="button"
        aria-label="Dismiss"
        @click.stop="dismiss(t.id)"
      >×</button>
    </div>
  </div>
</template>

<script>
import { toastStore, removeToast } from '@/utils/toast';

export default {
  computed: {
    toasts() { return toastStore.toasts; }
  },
  methods: {
    dismiss(id) { removeToast(id); },
    barClass(type) {
      if (type === 'success') return 'bg-green-500';
      if (type === 'error') return 'bg-red-500';
      if (type === 'info') return 'bg-blue-500';
      return 'bg-slate-400';
    }
  }
};
</script>
