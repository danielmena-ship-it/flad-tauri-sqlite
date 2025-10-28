<script>
  import { onMount } from 'svelte';
  import { db } from '$lib/api/tauri';

  export let value = '';
  export let onChange = null;
  export let placeholder = 'Seleccionar jardín...';

  let jardines = [];
  let abierto = false;
  let jardinSeleccionado = null;

  onMount(async () => {
    jardines = await db.jardines.getAll();
    if (value) {
      jardinSeleccionado = jardines.find(j => j.codigo === value);
    }
  });

  function seleccionar(jardin) {
    value = jardin.codigo;
    jardinSeleccionado = jardin;
    abierto = false;
    if (onChange) onChange();
  }

  function toggleDropdown() {
    abierto = !abierto;
  }

  function handleClickOutside(event) {
    if (abierto && !event.target.closest('.dropdown-wrapper')) {
      abierto = false;
    }
  }

  $: displayText = jardinSeleccionado 
    ? `${jardinSeleccionado.codigo} - ${jardinSeleccionado.nombre}`
    : placeholder;
</script>

<svelte:window on:click={handleClickOutside} />

<div class="dropdown-wrapper">
  <button type="button" class="dropdown-trigger" on:click|stopPropagation={toggleDropdown}>
    <span class="display-text">{displayText}</span>
    <span class="arrow">{abierto ? '▲' : '▼'}</span>
  </button>
  
  {#if abierto}
    <div class="dropdown-panel">
      <div class="jardines-list">
        {#each jardines as jardin}
          <button
            type="button"
            class="jardin-btn"
            class:selected={value === jardin.codigo}
            on:click={() => seleccionar(jardin)}
          >
            <span class="jardin-codigo">{jardin.codigo}</span>
            <span class="jardin-nombre">{jardin.nombre}</span>
          </button>
        {/each}
      </div>
    </div>
  {/if}
</div>

<style>
  .dropdown-wrapper {
    position: relative;
    min-width: 300px;
  }
  
  .dropdown-trigger {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #2d3e50;
    border-radius: 6px;
    background: #0f1419;
    color: #a8c5e0;
    font-family: 'Inter', sans-serif;
    cursor: pointer;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: all 0.2s;
  }
  
  .dropdown-trigger:hover {
    border-color: #5a8fc4;
    background: #1a2332;
  }

  .display-text {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .arrow {
    color: #8b9eb3;
    font-size: 0.7rem;
    margin-left: 0.5rem;
  }
  
  .dropdown-panel {
    position: absolute;
    top: calc(100% + 0.25rem);
    left: 0;
    right: 0;
    background: #1a2332;
    border: 1px solid #2d3e50;
    border-radius: 6px;
    z-index: 1000;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    max-height: 300px;
    overflow-y: auto;
  }
  
  .jardines-list {
    display: flex;
    flex-direction: column;
    padding: 0.25rem;
  }
  
  .jardin-btn {
    width: 100%;
    padding: 0.75rem;
    border: none;
    background: transparent;
    color: #a8c5e0;
    cursor: pointer;
    text-align: left;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 0.9rem;
    transition: all 0.2s;
    display: flex;
    gap: 0.5rem;
  }
  
  .jardin-btn:hover {
    background: #0f1419;
  }

  .jardin-btn.selected {
    background: linear-gradient(135deg, #5a8fc4 0%, #4a7ba7 100%);
    color: #fff;
  }

  .jardin-codigo {
    font-weight: 600;
    min-width: 60px;
  }

  .jardin-nombre {
    flex: 1;
  }

  /* Scrollbar styling */
  .dropdown-panel::-webkit-scrollbar {
    width: 8px;
  }

  .dropdown-panel::-webkit-scrollbar-track {
    background: #0f1419;
    border-radius: 4px;
  }

  .dropdown-panel::-webkit-scrollbar-thumb {
    background: #2d3e50;
    border-radius: 4px;
  }

  .dropdown-panel::-webkit-scrollbar-thumb:hover {
    background: #3a4f66;
  }
</style>
