<script>
  import { getContext } from 'svelte';
  import { fade } from 'svelte/transition';
  import FormularioIngreso from '$lib/components/FormularioIngreso.svelte';
  import TablaRequerimientos from '$lib/components/TablaRequerimientos.svelte';
  import CrearOrdenTrabajo from '$lib/components/CrearOrdenTrabajo.svelte';
  import TablaOrdenTrabajo from '$lib/components/TablaOrdenTrabajo.svelte';
  import RecepcionIngreso from '$lib/components/RecepcionIngreso.svelte';
  import ListaRecepcion from '$lib/components/ListaRecepcion.svelte';
  import IngresarPago from '$lib/components/IngresarPago.svelte';
  import ListaPago from '$lib/components/ListaPago.svelte';

  const tabActual = getContext('tabActual');
</script>

<div class="container">
  {#if $tabActual === 'ingreso'}
    <div in:fade="{{ duration: 200 }}">
      <FormularioIngreso />
    </div>
  {:else if $tabActual === 'listado'}
    <div in:fade="{{ duration: 200 }}">
      <TablaRequerimientos />
    </div>
  {:else if $tabActual === 'crear-ot'}
    <div in:fade="{{ duration: 200 }}">
      <CrearOrdenTrabajo />
    </div>
  {:else if $tabActual === 'lista-ot'}
    <div in:fade="{{ duration: 200 }}">
      <TablaOrdenTrabajo />
    </div>
  {:else if $tabActual === 'recepcion'}
    <div in:fade="{{ duration: 200 }}">
      <RecepcionIngreso />
    </div>
  {:else if $tabActual === 'lista-recepcion'}
    <div in:fade="{{ duration: 200 }}">
      <ListaRecepcion />
    </div>
  {:else if $tabActual === 'ingresar-pago'}
    <div in:fade="{{ duration: 200 }}">
      <IngresarPago />
    </div>
  {:else if $tabActual === 'lista-pago'}
    <div in:fade="{{ duration: 200 }}">
      <ListaPago />
    </div>
  {/if}
</div>

<style>
  .container {
    max-width: 1200px;
    margin: 0 auto;
  }
</style>
