import { Priority } from './common';
import { User } from './user';
import { Machine } from './machine';

export interface CategoryMantenimiento {
  id: number;
  nombre: string;
  es_correctivo: boolean;
  activo: boolean;
}

export interface TipoSolicitud {
  id: string | number;
  nombre: string;
  activo: boolean | string;
}

export interface EstadoOT {
  id: number;
  nombre: string;
  orden: number;
  es_estado_final: boolean;
  activo: boolean;
}

export interface ChecklistItem {
  id: string | number;
  work_order_id: string | number;
  texto: string;
  orden: number | string;
  completado: boolean | string;
  completado_en?: string | null;
  completado_por?: User | null;
}

export interface MaterialRequest {
  id: number;
  work_order_id: number;
  spare_part_id: number | null;
  codigo: string | null;
  nombre: string;
  cantidad: number;
  unidad_medida: string;
  descripcion: string | null;
  costo_unitario: number | null;
  costo_total: number | null;
  solicitado_por_id: number;
  created_at: string | null;
}

export interface WorkOrderComment {
  id: number;
  work_order_id: number;
  user_id: number;
  tipo: string;
  mensaje: string;
  imagen_url: string | null;
  created_at: string;
  usuario?: User;
}

export interface WorkOrderCollaborator {
  id: string | number;
  user_id: string | number;
  created_at: string;
  usuario?: User;
}

export interface StatusHistory {
  id: string | number;
  created_at: string;
  estado: EstadoOT;
  cambiado_por: User;
}

export interface WorkOrder {
  id: number;
  numero: string;
  maquina: Machine;
  tipo_solicitud?: TipoSolicitud;
  categoria_mantenimiento?: CategoryMantenimiento;
  estado: EstadoOT;
  prioridad: Priority;
  fecha_programada: string | null;
  generado_por: User | null;
  reportado_por_nombre: string | null;
  reportado_por_contacto: string | null;
  maintenance_plan_id: number | null;
  fecha_inicio: string | null;
  created_at: string;
  descripcion_problema_inicial: string | null;
  foto_inicial_url: string | null;
  fecha_termino: string | null;
  hora_termino: string | null;
  foto_termino_url: string | null;
  fecha_siguiente_mantenimiento: string | null;
  mensaje_adicional: string | null;
  genera_tiempo_inactivo: boolean;
  minutos_inactividad: number | string;
  costo_mano_obra: number;
  costo_total: number | string;
  comentarios: WorkOrderComment[];
  colaboradores: WorkOrderCollaborator[];
  solicitudes_material: MaterialRequest[];
  historial_estados: StatusHistory[];
  checklist_items: ChecklistItem[];
}
