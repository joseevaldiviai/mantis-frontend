import { Priority } from './common';
import { Machine } from './machine';
import { CategoryMantenimiento, TipoSolicitud } from './workOrder';

export interface ProcedureItem {
  id: number;
  texto: string;
  orden: number;
}

export interface Procedure {
  id: number;
  nombre: string;
  descripcion: string | null;
  activo: boolean;
  items: ProcedureItem[];
}

export interface MaintenancePlan {
  id: number;
  nombre: string;
  descripcion: string | null;
  prioridad: Priority | string;
  tipo_disparador: 'calendario' | 'contador' | string;
  frecuencia_dias: number | null;
  meter_type: string | null;
  intervalo_contador: number | null;
  ultimo_valor_generacion: number | null;
  proxima_generacion: string | null;
  ultima_generacion: string | null;
  activo: boolean;
  maquina: Machine;
  categoria_mantenimiento: CategoryMantenimiento;
  tipo_solicitud?: TipoSolicitud;
  procedure?: Procedure;
}
