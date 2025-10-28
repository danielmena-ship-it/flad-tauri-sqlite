import { writable } from 'svelte/store';

function createToastStore() {
  const { subscribe, update } = writable([]);

  return {
    subscribe,
    show: (message, type = 'success', duration = 3000) => {
      const id = Date.now();
      update(toasts => [...toasts, { id, message, type, duration }]);
      
      if (duration > 0) {
        setTimeout(() => {
          update(toasts => toasts.filter(t => t.id !== id));
        }, duration);
      }
    },
    success: (message, duration = 3000) => {
      createToastStore().show(message, 'success', duration);
    },
    error: (message, duration = 4000) => {
      createToastStore().show(message, 'danger', duration);
    },
    warning: (message, duration = 3500) => {
      createToastStore().show(message, 'warning', duration);
    },
    remove: (id) => {
      update(toasts => toasts.filter(t => t.id !== id));
    }
  };
}

export const toast = createToastStore();
