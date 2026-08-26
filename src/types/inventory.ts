export interface SparePart {
  id: number;
  codigo: string;
  nombre: string;
  descripcion: string | null;
  unidad_medida: string;
  stock_actual: number;
  stock_minimo: number;
  costo_unitario: number | null;
  activo: boolean;
}
