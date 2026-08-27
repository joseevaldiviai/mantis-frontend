import { ApiClient } from './client';
import { WorkOrder, ChecklistItem, MaterialRequest, WorkOrderComment, WorkOrderCollaborator } from '../../types';

export class WorkOrdersApi {
  constructor(protected client: ApiClient) {}

  public async getWorkOrders(params: { prioridad?: string; q?: string } = {}): Promise<WorkOrder[]> {
    const q = new URLSearchParams();
    q.append('per_page', '100');
    if (params.prioridad) q.append('prioridad', params.prioridad);
    if (params.q) q.append('q', params.q);
    return this.client.request<WorkOrder[]>(`/ordenes-trabajo?${q.toString()}`);
  }

  public async getWorkOrder(id: number): Promise<WorkOrder> {
    return this.client.request<WorkOrder>(`/ordenes-trabajo/${id}`);
  }

  public async createWorkOrder(data: {
    maquina_id: number;
    tipo_solicitud_id?: number | string;
    categoria_mantenimiento_id?: number;
    prioridad: any;
    fecha_programada?: string;
    descripcion_problema_inicial?: string;
    foto_inicial_url?: string;
    reportado_por_nombre?: string;
    reportado_por_contacto?: string;
    operarios_ids?: number[];
    hora_termino?: string;
  }): Promise<WorkOrder> {
    const { operarios_ids, ...payload } = data;
    const created = await this.client.request<WorkOrder>('/ordenes-trabajo', {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    if (operarios_ids && operarios_ids.length > 0) {
      await this.client.request(`/ordenes-trabajo/${created.id}/colaboradores`, {
        method: 'POST',
        body: JSON.stringify({ user_ids: operarios_ids })
      });
      return this.getWorkOrder(created.id);
    }
    return created;
  }

  public async changeWorkOrderStatus(workOrderId: number, estadoId: number): Promise<WorkOrder> {
    return this.client.request<WorkOrder>(`/ordenes-trabajo/${workOrderId}/estado`, {
      method: 'PATCH',
      body: JSON.stringify({ estado_id: estadoId })
    });
  }

  public async addChecklistItem(workOrderId: number, texto: string): Promise<ChecklistItem> {
    return this.client.request<ChecklistItem>(`/ordenes-trabajo/${workOrderId}/checklist`, {
      method: 'POST',
      body: JSON.stringify({ texto })
    });
  }

  public async toggleChecklistItem(workOrderId: number, itemId: string | number, completado: boolean): Promise<ChecklistItem> {
    return this.client.request<ChecklistItem>(`/ordenes-trabajo/${workOrderId}/checklist/${itemId}`, {
      method: 'PATCH',
      body: JSON.stringify({ completado })
    });
  }

  public async addMaterialRequest(workOrderId: number, data: {
    spare_part_id?: number | null;
    nombre: string;
    cantidad: number;
    unidad_medida: string;
    costo_unitario?: number | null;
  }): Promise<MaterialRequest> {
    return this.client.request<MaterialRequest>(`/ordenes-trabajo/${workOrderId}/materiales`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async addComment(workOrderId: number, mensaje: string, imagen_url?: string | null, tiempo_utilizado?: number | null): Promise<WorkOrderComment> {
    return this.client.request<WorkOrderComment>(`/ordenes-trabajo/${workOrderId}/comentarios`, {
      method: 'POST',
      body: JSON.stringify({ mensaje, imagen_url, tipo: 'general', tiempo_utilizado: tiempo_utilizado || null })
    });
  }

  public async addCollaborator(workOrderId: number, userId: number): Promise<WorkOrderCollaborator> {
    const result = await this.client.request<{ user_id: number }[]>(`/ordenes-trabajo/${workOrderId}/colaboradores`, {
      method: 'POST',
      body: JSON.stringify({ user_ids: [userId] })
    });
    return (Array.isArray(result) ? result[result.length - 1] : result) as unknown as WorkOrderCollaborator;
  }

  public async removeCollaborator(workOrderId: number, collaboratorId: string | number): Promise<void> {
    await this.client.request<void>(`/ordenes-trabajo/${workOrderId}/colaboradores/${collaboratorId}`, {
      method: 'DELETE'
    });
  }

  public async finalizeWorkOrder(workOrderId: number, data: {
    fecha_termino?: string;
    hora_termino?: string;
    foto_termino_url?: string | null;
    fecha_siguiente_mantenimiento?: string | null;
    mensaje_adicional?: string | null;
    genera_tiempo_inactivo?: boolean;
    minutos_inactividad?: number;
    costo_mano_obra?: number;
  }): Promise<WorkOrder> {
    if (data.genera_tiempo_inactivo !== undefined || data.costo_mano_obra !== undefined) {
      await this.client.request<WorkOrder>(`/ordenes-trabajo/${workOrderId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          genera_tiempo_inactivo: data.genera_tiempo_inactivo,
          costo_mano_obra: data.costo_mano_obra
        })
      });
    }
    return this.client.request<WorkOrder>(`/ordenes-trabajo/${workOrderId}/finalizar`, {
      method: 'POST',
      body: JSON.stringify({
        fecha_termino: data.fecha_termino,
        hora_termino: data.hora_termino,
        foto_termino_url: data.foto_termino_url,
        fecha_siguiente_mantenimiento: data.fecha_siguiente_mantenimiento,
        mensaje_adicional: data.mensaje_adicional
      })
    });
  }
}
