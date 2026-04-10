<template>
  <div v-if="modelValue" class="overlay" @click.self="onBackdrop">
    <div class="modal" role="dialog" aria-modal="true" :aria-label="title || 'Dialog'">
      <header class="head">
        <strong class="title">{{ title }}</strong>
        <button class="icon-btn" type="button" aria-label="Close" @click="close">×</button>
      </header>
      <section class="body">
        <slot />
      </section>
      <footer v-if="$slots.footer" class="foot">
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
  mounted() {
    window.addEventListener('keydown', this.onKeyDown);
  },
  beforeUnmount() {
    window.removeEventListener('keydown', this.onKeyDown);
  },
  methods: {
    close() {
      this.$emit('update:modelValue', false);
    },
    onBackdrop() {
      if (this.closeOnBackdrop) this.close();
    },
    onKeyDown(e) {
      if (!this.modelValue) return;
      if (e.key === 'Escape') this.close();
    }
  }
};
</script>

<style scoped>
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(2, 6, 23, 0.55);
  display: grid;
  place-items: center;
  padding: 18px;
  z-index: 9998;
}

.modal {
  width: min(720px, 100%);
  background: rgba(255, 255, 255, 0.95);
  border: 1px solid rgba(226, 232, 240, 0.9);
  border-radius: 16px;
  box-shadow: 0 22px 60px rgba(15, 23, 42, 0.28);
  overflow: hidden;
}

.head {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 14px 16px;
  border-bottom: 1px solid #e2e8f0;
  background: linear-gradient(90deg, rgba(238, 242, 255, 0.75) 0%, rgba(255, 255, 255, 0.9) 100%);
}

.title {
  font-size: 14px;
  color: #0f172a;
}

.body {
  padding: 16px;
}

.foot {
  padding: 12px 16px;
  border-top: 1px solid #e2e8f0;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

.icon-btn {
  border: none;
  background: transparent;
  color: #64748b;
  padding: 6px 10px;
  border-radius: 10px;
  cursor: pointer;
  font-size: 20px;
  line-height: 1;
}

.icon-btn:hover {
  background: #eef2f7;
  color: #0f172a;
}
</style>

