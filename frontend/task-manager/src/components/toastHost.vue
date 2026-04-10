<template>
  <div class="toast-host" aria-live="polite" aria-relevant="additions removals">
    <div
      v-for="t in toasts"
      :key="t.id"
      class="toast"
      :class="t.type"
      role="status"
      @click="dismiss(t.id)"
      title="Click to dismiss"
    >
      <div class="bar" />
      <div class="body">
        <strong v-if="t.title" class="title">{{ t.title }}</strong>
        <p class="msg">{{ t.message }}</p>
      </div>
      <button class="close" type="button" aria-label="Dismiss" @click.stop="dismiss(t.id)">×</button>
    </div>
  </div>
</template>

<script>
import { toastStore, removeToast } from '@/utils/toast';

export default {
  computed: {
    toasts() {
      return toastStore.toasts;
    }
  },
  methods: {
    dismiss(id) {
      removeToast(id);
    }
  }
};
</script>

<style scoped>
.toast-host {
  position: fixed;
  right: 14px;
  top: 14px;
  z-index: 9999;
  display: grid;
  gap: 10px;
  width: min(380px, calc(100vw - 28px));
}

.toast {
  position: relative;
  overflow: hidden;
  border-radius: 14px;
  border: 1px solid rgba(226, 232, 240, 0.9);
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.12);
  backdrop-filter: blur(6px);
  display: grid;
  grid-template-columns: 6px 1fr auto;
  align-items: start;
  cursor: pointer;
}

.bar {
  height: 100%;
  background: #64748b;
}

.toast.success .bar {
  background: #16a34a;
}
.toast.error .bar {
  background: #dc2626;
}
.toast.info .bar {
  background: #2563eb;
}

.body {
  padding: 10px 10px;
}

.title {
  display: block;
  color: #0f172a;
  font-size: 13px;
  margin-bottom: 2px;
}

.msg {
  margin: 0;
  color: #334155;
  font-size: 13px;
  line-height: 1.25;
}

.close {
  border: none;
  background: transparent;
  color: #64748b;
  padding: 6px 10px;
  font-size: 18px;
  cursor: pointer;
}

.close:hover {
  color: #0f172a;
}

@media (max-width: 520px) {
  .toast-host {
    left: 14px;
    right: 14px;
  }
}
</style>

