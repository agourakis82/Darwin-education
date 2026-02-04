/**
 * Darwin-MFC Medical Data Stub
 *
 * Provides empty fallback data when @darwin-mfc/medical-data package is unavailable.
 * This enables deployment to Vercel while the package is only available locally.
 */

import type {
  Doenca,
  Medicamento,
  CategoriaDoenca,
} from '@darwin-mfc/medical-data';

// Re-export type for external use
export type { Doenca, Medicamento, CategoriaDoenca };

// Empty arrays as fallbacks
export const doencasConsolidadas: Doenca[] = [];
export const medicamentosConsolidados: Medicamento[] = [];

export function getDoencaById(_id: string): Doenca | undefined {
  return undefined;
}

export function getMedicamentoById(_id: string): Medicamento | undefined {
  return undefined;
}

export function searchDoencas(_query: string): Doenca[] {
  return [];
}

export function searchMedicamentos(_query: string): Medicamento[] {
  return [];
}
