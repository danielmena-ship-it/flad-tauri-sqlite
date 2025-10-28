<script>
  import { toast } from '$lib/utils/toast.js';
  import { fade, fly } from 'svelte/transition';
  import { flip } from 'svelte/animate';

  let toasts = [];
  toast.subscribe(value => { toasts = value; });

  const icons = {
    success: '✓',
    danger: '✕',
    warning: '⚠',
    info: 'ℹ'
  };

  function handleClose(id) {
    toast.remove(id);
  }
</script>

<div class="toast-container">
  {#each toasts as t (t.id)}
    <div 
      class="toast toast-{t.type}"
      transition:fly={{ y: -20, duration: 300 }}
      animate:flip={{ duration: 300 }}
    >
      <span class="toast-icon">{icons[t.type]}</span>
      <span class="toast-message">{t.message}</span>
      <button class="toast-close" on:click={() => handleClose(t.id)}>×</button>
    </div>
  {/each}
</div>

<style>
  .toast-container {
    position: fixed;
    top: 1.5rem;
    right: 1.5rem;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-width: 400px;
  }

  .toast {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 1rem 1.25rem;
    background: #1a2332;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3), 0 2px 4px rgba(0, 0, 0, 0.2);
    border-left: 4px solid;
    backdrop-filter: blur(10px);
    font-family: 'Inter', sans-serif;
  }

  .toast-success {
    border-left-color: #4ade80;
  }

  .toast-danger {
    border-left-color: #f87171;
  }

  .toast-warning {
    border-left-color: #fbbf24;
  }

  .toast-info {
    border-left-color: #60a5fa;
  }

  .toast-icon {
    font-size: 1.25rem;
    font-weight: bold;
    flex-shrink: 0;
  }

  .toast-success .toast-icon {
    color: #4ade80;
  }

  .toast-danger .toast-icon {
    color: #f87171;
  }

  .toast-warning .toast-icon {
    color: #fbbf24;
  }

  .toast-info .toast-icon {
    color: #60a5fa;
  }

  .toast-message {
    flex: 1;
    color: #e0e6ed;
    font-size: 0.9rem;
    line-height: 1.4;
  }

  .toast-close {
    background: transparent;
    border: none;
    color: #8b9eb3;
    font-size: 1.5rem;
    cursor: pointer;
    padding: 0;
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 4px;
    transition: all 0.2s;
    flex-shrink: 0;
  }

  .toast-close:hover {
    background: rgba(139, 158, 179, 0.1);
    color: #a8c5e0;
  }
</style>
