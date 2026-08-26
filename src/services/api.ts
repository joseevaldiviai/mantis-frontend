/**
 * Re-export barrel — el servicio API ahora vive en src/services/api/ por dominio.
 * Este archivo se mantiene por compatibilidad con imports existentes.
 */
export { MantisApiService, api } from './api/index';
