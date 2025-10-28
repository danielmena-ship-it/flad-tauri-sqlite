import { writable } from 'svelte/store';
import { db } from '$lib/api/tauri';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutos

class CachedStore {
  constructor(loadFn) {
    this.loadFn = loadFn;
    this.store = writable([]);
    this.lastFetch = 0;
  }

  async load(force = false) {
    const now = Date.now();
    if (!force && (now - this.lastFetch) < CACHE_DURATION) return;
    
    const data = await this.loadFn();
    this.store.set(data);
    this.lastFetch = now;
    return data;
  }

  subscribe(fn) {
    return this.store.subscribe(fn);
  }

  invalidate() {
    this.lastFetch = 0;
  }
}

export const jardines = new CachedStore(() => db.jardines.getAll());
export const partidas = new CachedStore(() => db.partidas.getAll());

export async function cargarJardines(force = false) {
  return await jardines.load(force);
}

export async function cargarPartidas(force = false) {
  const data = await partidas.load(force);
  
  if (data) {
    const sorted = data.sort((a, b) => {
      const matchA = a.item.match(/^([A-Z]+)(\d+)/);
      const matchB = b.item.match(/^([A-Z]+)(\d+)/);
      
      if (!matchA || !matchB) return a.item.localeCompare(b.item);
      
      const [, letraA, numA] = matchA;
      const [, letraB, numB] = matchB;
      
      if (letraA !== letraB) return letraA.localeCompare(letraB);
      return parseInt(numA) - parseInt(numB);
    });
    
    partidas.store.set(sorted);
    return sorted;
  }
}

export async function cargarRecintos(jardinCodigo) {
  const data = await db.recintos.getByJardin(jardinCodigo);
  
  return data.sort((a, b) => {
    const numA = parseInt(a.nombre.match(/^\d+/)?.[0] || '999');
    const numB = parseInt(b.nombre.match(/^\d+/)?.[0] || '999');
    return numA - numB;
  });
}

export function invalidarCatalogos() {
  jardines.invalidate();
  partidas.invalidate();
}
