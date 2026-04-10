import { reactive } from 'vue';

let nextId = 1;

export const toastStore = reactive({
  toasts: []
});

function pushToast({ type = 'info', title = '', message = '', timeoutMs = 3000 } = {}) {
  const id = nextId++;
  const toast = { id, type, title, message };
  toastStore.toasts.push(toast);

  if (timeoutMs > 0) {
    window.setTimeout(() => removeToast(id), timeoutMs);
  }

  return id;
}

export function removeToast(id) {
  const idx = toastStore.toasts.findIndex((t) => t.id === id);
  if (idx >= 0) toastStore.toasts.splice(idx, 1);
}

export const toast = {
  show: pushToast,
  success(message, opts = {}) {
    return pushToast({ type: 'success', message, ...opts });
  },
  error(message, opts = {}) {
    return pushToast({ type: 'error', message, timeoutMs: 4500, ...opts });
  },
  info(message, opts = {}) {
    return pushToast({ type: 'info', message, ...opts });
  }
};

export default {
  install(app) {
    app.config.globalProperties.$toast = toast;
  }
};

