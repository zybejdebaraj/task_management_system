<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
    @click.self="$emit('update:modelValue', false)"
  >
    <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-full max-w-sm overflow-hidden">

      <!-- Header -->
      <div class="flex items-center gap-3 px-6 pt-6 pb-4">
        <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center shrink-0">
          <Trash2 class="w-5 h-5 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <h3 class="font-bold text-slate-900 dark:text-slate-100 text-base">{{ title }}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{{ message }}</p>
        </div>
      </div>

      <!-- Footer -->
      <div class="flex items-center justify-end gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-800/60 border-t border-slate-100 dark:border-slate-700">
        <button
          class="px-4 py-2 rounded-xl bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-semibold text-sm transition cursor-pointer"
          type="button"
          @click="$emit('update:modelValue', false)"
        >Cancel</button>
        <button
          class="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold text-sm transition cursor-pointer border-none"
          type="button"
          @click="confirm"
        >Delete</button>
      </div>
    </div>
  </div>
</template>

<script>
import { Trash2 } from 'lucide-vue-next';

export default {
  components: { Trash2 },
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: 'Delete this item?' },
    message: { type: String, default: 'This action cannot be undone.' },
  },
  emits: ['update:modelValue', 'confirm'],
  methods: {
    confirm() {
      this.$emit('confirm');
      this.$emit('update:modelValue', false);
    }
  }
};
</script>
