import { writable } from 'svelte/store';

export const dbReady = writable(false);
export const dbError = writable(null);
export const loading = writable(false);

export function setDbReady(value) {
  dbReady.set(value);
}

export function setDbError(error) {
  dbError.set(error);
}

export function setLoading(value) {
  loading.set(value);
}
