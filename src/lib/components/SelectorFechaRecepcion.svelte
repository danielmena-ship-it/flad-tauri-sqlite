<script>
  import { onMount } from 'svelte';
  import { log } from '$lib/utils/logger.js';
  
  export let value = '';
  export let fechaMinima = ''; // fecha_inicio del requerimiento
  export let fechaMaxima = new Date().toISOString().split('T')[0]; // Hoy
  export let disabled = false; // Nueva prop para deshabilitar el selector

  let año = '';
  let mes = '';
  let dia = '';
  let inicializado = false;
  let dropdownAbierto = null;

  // Verificar si el rango es válido (fecha máxima debe ser >= fecha mínima)
  $: rangoInvalido = fechaMinima && fechaMaxima && fechaMinima.length === 10 && fechaMaxima.length === 10 && new Date(fechaMaxima) < new Date(fechaMinima);

  // Parsear fecha mínima
  $: fechaMinParts = (fechaMinima && fechaMinima.length === 10) ? fechaMinima.split('-') : null;
  $: añoMin = fechaMinParts && fechaMinParts.length === 3 ? parseInt(fechaMinParts[0]) : 2020;
  $: mesMin = fechaMinParts && fechaMinParts.length === 3 ? parseInt(fechaMinParts[1]) : 1;
  $: diaMin = fechaMinParts && fechaMinParts.length === 3 ? parseInt(fechaMinParts[2]) : 1;

  // Parsear fecha máxima (hoy)
  $: fechaMaxParts = (fechaMaxima && fechaMaxima.length === 10) ? fechaMaxima.split('-') : null;
  $: añoMax = fechaMaxParts && fechaMaxParts.length === 3 ? parseInt(fechaMaxParts[0]) : new Date().getFullYear();
  $: mesMax = fechaMaxParts && fechaMaxParts.length === 3 ? parseInt(fechaMaxParts[1]) : new Date().getMonth() + 1;
  $: diaMax = fechaMaxParts && fechaMaxParts.length === 3 ? parseInt(fechaMaxParts[2]) : new Date().getDate();

  const meses = [
    { num: '01', nombre: 'Ene' }, { num: '02', nombre: 'Feb' }, { num: '03', nombre: 'Mar' },
    { num: '04', nombre: 'Abr' }, { num: '05', nombre: 'May' }, { num: '06', nombre: 'Jun' },
    { num: '07', nombre: 'Jul' }, { num: '08', nombre: 'Ago' }, { num: '09', nombre: 'Sep' },
    { num: '10', nombre: 'Oct' }, { num: '11', nombre: 'Nov' }, { num: '12', nombre: 'Dic' }
  ];

  onMount(() => {
    if (value && value.includes('-')) {
      const partes = value.split('-');
      año = partes[0];
      mes = partes[1];
      dia = partes[2];
    }
    inicializado = true;
  });

  // Resetear campos si el valor actual está fuera del rango válido
  $: {
    if (inicializado && value && fechaMinima && fechaMaxima) {
      const fechaActual = new Date(value);
      const fechaMin = new Date(fechaMinima);
      const fechaMax = new Date(fechaMaxima);
      
      if (fechaActual < fechaMin || fechaActual > fechaMax) {
        año = '';
        mes = '';
        dia = '';
        value = '';
      }
    }
  }

  // Años disponibles entre año mínimo y máximo
  $: años = Array.from({ length: añoMax - añoMin + 1 }, (_, i) => añoMin + i);

  // Meses disponibles según el año seleccionado (SIMPLIFICADO)
  $: mesesDisponibles = (() => {
    if (!año) return meses;
    const añoNum = parseInt(año);
    
    // Si es el año mínimo Y el año máximo (mismo año)
    if (añoNum === añoMin && añoNum === añoMax) {
      return meses.filter(m => {
        const mesNum = parseInt(m.num);
        return mesNum >= mesMin && mesNum <= mesMax;
      });
    }
    
    // Solo año mínimo
    if (añoNum === añoMin) {
      return meses.filter(m => parseInt(m.num) >= mesMin);
    }
    
    // Solo año máximo
    if (añoNum === añoMax) {
      return meses.filter(m => parseInt(m.num) <= mesMax);
    }
    
    // Año intermedio: todos los meses
    return meses;
  })();

  // Días en el mes seleccionado
  $: diasEnMes = mes && año ? new Date(parseInt(año), parseInt(mes), 0).getDate() : 31;
  $: dias = Array.from({ length: diasEnMes }, (_, i) => i + 1);

  // Días disponibles según restricciones (SIMPLIFICADO)
  $: diasDisponibles = (() => {
    if (!año || !mes) return dias;
    const añoNum = parseInt(año);
    const mesNum = parseInt(mes);
    
    // Mismo año Y mismo mes que mínimo y máximo
    if (añoNum === añoMin && mesNum === mesMin && añoNum === añoMax && mesNum === mesMax) {
      return dias.filter(d => d >= diaMin && d <= diaMax);
    }
    
    // Año mínimo y mes mínimo (solo límite inferior)
    if (añoNum === añoMin && mesNum === mesMin) {
      return dias.filter(d => d >= diaMin);
    }
    
    // Año máximo y mes máximo (solo límite superior)
    if (añoNum === añoMax && mesNum === mesMax) {
      return dias.filter(d => d <= diaMax);
    }
    
    // Cualquier otro caso: todos los días
    return dias;
  })();

  $: if (inicializado && año && mes && dia) {
    value = `${año}-${mes}-${String(dia).padStart(2, '0')}`;
  }

  function toggleDropdown(tipo) {
    dropdownAbierto = dropdownAbierto === tipo ? null : tipo;
  }

  function seleccionarAño(a) {
    año = String(a);
    mes = '';
    dia = '';
    dropdownAbierto = null;
  }

  function seleccionarMes(m) {
    mes = m;
    dia = '';
    dropdownAbierto = null;
  }

  function seleccionarDia(d) {
    dia = String(d);
    dropdownAbierto = null;
  }

  function getMesNombre(num) {
    return meses.find(m => m.num === num)?.nombre || '';
  }
</script>

<div class="fecha-selector">
  {#if rangoInvalido}
    <div class="error-rango">
      ⚠️ Partida no iniciada
    </div>
  {:else}
    <div class="fecha-grid">
      <!-- Año -->
      <div class="dropdown-wrapper">
        <button type="button" class="dropdown-trigger" disabled={disabled} on:click={() => toggleDropdown('año')}>
          {año || 'Año'}
          <span class="arrow">{dropdownAbierto === 'año' ? '▲' : '▼'}</span>
        </button>
        {#if dropdownAbierto === 'año'}
          <div class="dropdown-panel">
            <div class="grid-1col">
              {#each años as a}
                <button type="button" class="grid-btn" class:selected={año === String(a)} on:click={() => seleccionarAño(a)}>
                  {a}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Mes -->
      <div class="dropdown-wrapper">
        <button type="button" class="dropdown-trigger" disabled={disabled || !año} on:click={() => toggleDropdown('mes')}>
          {getMesNombre(mes) || 'Mes'}
          <span class="arrow">{dropdownAbierto === 'mes' ? '▲' : '▼'}</span>
        </button>
        {#if dropdownAbierto === 'mes'}
          <div class="dropdown-panel">
            <div class="grid-3col">
              {#each mesesDisponibles as m}
                <button type="button" class="grid-btn" class:selected={mes === m.num} on:click={() => seleccionarMes(m.num)}>
                  {m.nombre}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>

      <!-- Día -->
      <div class="dropdown-wrapper">
        <button type="button" class="dropdown-trigger" disabled={disabled || !mes} on:click={() => toggleDropdown('dia')}>
          {dia || 'Día'}
          <span class="arrow">{dropdownAbierto === 'dia' ? '▲' : '▼'}</span>
        </button>
        {#if dropdownAbierto === 'dia'}
          <div class="dropdown-panel dia-panel">
            <div class="grid-10col">
              {#each diasDisponibles as d}
                <button type="button" class="grid-btn" class:selected={dia === String(d)} on:click={() => seleccionarDia(d)}>
                  {d}
                </button>
              {/each}
            </div>
          </div>
        {/if}
      </div>
    </div>
  {/if}
</div>

<style>
  .fecha-selector {
    display: inline-block;
  }

  .error-rango {
    padding: 0.5rem 0.75rem;
    background: rgba(220, 53, 69, 0.15);
    border: 1px solid rgba(220, 53, 69, 0.3);
    border-radius: 4px;
    color: #ff6b6b;
    font-size: 0.85rem;
    font-weight: 500;
    text-align: center;
    white-space: nowrap;
  }

  .fecha-grid {
    display: grid;
    grid-template-columns: 1fr 1.2fr 0.8fr;
    gap: 0.3rem;
  }

  .dropdown-wrapper {
    position: relative;
  }

  .dropdown-trigger {
    width: 100%;
    padding: 0.4rem 0.5rem;
    border: 1px solid #2d3e50;
    border-radius: 4px;
    background: #0f1419;
    color: #a8c5e0;
    font-family: 'Inter', sans-serif;
    font-size: 0.85rem;
    cursor: pointer;
    text-align: left;
    display: flex;
    justify-content: space-between;
    align-items: center;
    transition: border-color 0.2s;
  }

  .dropdown-trigger:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .dropdown-trigger:hover:not(:disabled) {
    border-color: #5a8fc4;
  }

  .arrow {
    color: #6b7d8f;
    font-size: 0.65rem;
  }

  .dropdown-panel {
    position: absolute;
    top: 100%;
    left: 0;
    margin-top: 0.25rem;
    background: #1a2332;
    border: 1px solid #2d3e50;
    border-radius: 6px;
    padding: 0.5rem;
    z-index: 9999;
    box-shadow: 0 4px 12px rgba(0,0,0,0.3);
    min-width: 100%;
  }
  
  .dia-panel {
    min-width: 480px;
    width: max-content;
  }

  .grid-1col {
    display: grid;
    grid-template-columns: 1fr;
    gap: 0.25rem;
    max-height: 200px;
    overflow-y: auto;
  }

  .grid-3col {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 0.25rem;
  }

  .grid-10col {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    gap: 0.25rem;
  }

  .grid-btn {
    padding: 0.4rem;
    border: 1px solid #2d3e50;
    background: #0f1419;
    color: #a8c5e0;
    cursor: pointer;
    border-radius: 4px;
    font-family: 'Inter', sans-serif;
    font-size: 0.8rem;
    transition: all 0.15s;
    white-space: nowrap;
  }

  .grid-btn:hover {
    background: #1a2332;
    border-color: #5a8fc4;
  }

  .grid-btn.selected {
    background: #5a8fc4;
    color: #fff;
    border-color: #5a8fc4;
  }
</style>
