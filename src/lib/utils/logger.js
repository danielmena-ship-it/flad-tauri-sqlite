/**
 * Sistema de logging condicional
 * Logs solo en desarrollo, errores siempre visibles
 */

const isDev = import.meta.env.DEV;

export const logger = {
  log: (...args) => {
    if (isDev) console.log(...args);
  },
  
  info: (...args) => {
    if (isDev) console.info(...args);
  },
  
  warn: (...args) => {
    if (isDev) console.warn(...args);
  },
  
  error: (...args) => {
    // Errores siempre visibles
    console.error(...args);
  },
  
  // Para debugging condicional
  debug: (...args) => {
    if (isDev) {
      console.log('%c[DEBUG]', 'color: #667eea; font-weight: bold', ...args);
    }
  }
};

// Exports directos para usar como: import { log, error } from './logger'
export const { log, info, warn, error, debug } = logger;
