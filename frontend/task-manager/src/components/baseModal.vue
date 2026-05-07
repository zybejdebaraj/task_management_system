<template>
  <div
    v-if="modelValue"
    class="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9998] flex items-center justify-center p-4"
    @click.self="onBackdrop"
  >
    <div
      class="w-full max-w-2xl bg-white dark:bg-slate-800 rounded-2xl shadow-2xl overflow-hidden border border-slate-200 dark:border-slate-700"
      role="dialog"
      aria-modal="true"
      :aria-label="title || 'Dialog'"
    >
      <!-- Header -->
      <header class="flex items-center justify-between px-5 py-4 border-b border-slate-100 dark:border-slate-700 bg-gradient-to-r from-slate-50 to-white dark:from-slate-800 dark:to-slate-800">
        <strong class="text-sm font-bold text-slate-900 dark:text-slate-100">{{ title }}</strong>
        <button
          class="w-8 h-8 rounded-xl border-none bg-transparent text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center text-lg leading-none transition cursor-pointer"
          type="button"
          aria-label="Close"
          @click="close"
        >×</button>
      </header>

      <!-- Body -->
      <section class="p-5 max-h-[70vh] overflow-auto dark:bg-slate-800">
        <slot />
      </section>

      <!-- Footer -->
      <footer v-if="$slots.footer" class="flex items-center justify-end gap-3 px-5 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/80">
        <slot name="footer" />
      </footer>
    </div>
  </div>
</template>

<script>
export default {
  props: {
    modelValue: { type: Boolean, default: false },
    title: { type: String, default: '' },
    closeOnBackdrop: { type: Boolean, default: true }
  },
  emits: ['update:modelValue'],
  mounted() { window.addEventListener('keydown', this.onKeyDown); },
  beforeUnmount() { window.removeEventListener('keydown', this.onKeyDown); },
  methods: {
    close() { this.$emit('update:modelValue', false); },
    onBackdrop() { if (this.closeOnBackdrop) this.close(); },
    onKeyDown(e) { if (!this.modelValue) return; if (e.key === 'Escape') this.close(); }
  }
};
</script>
