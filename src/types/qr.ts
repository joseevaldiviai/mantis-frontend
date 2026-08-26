import { Machine } from './machine';
import { WorkOrder } from './workOrder';

export interface QrPublicInfo {
  maquina: Machine;
  proximo_mantenimiento: string | null;
  total_mantenimientos: number;
  historial: WorkOrder[];
  manuales: QrDocument[];
  tutoriales: QrDocument[];
  otros_documentos: QrDocument[];
}

export interface QrDocument {
  id: number;
  titulo: string;
  url: string;
  tipo?: string;
  descripcion?: string | null;
  created_at?: string;
}
