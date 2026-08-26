import { ApiClient } from './client';
import { MaintenancePlan } from '../../types';

export class MaintenanceApi {
  constructor(protected client: ApiClient) {}

  public async getMaintenancePlans(): Promise<MaintenancePlan[]> {
    return this.client.request<MaintenancePlan[]>('/planes-mantenimiento?per_page=100');
  }

  public async createMaintenancePlan(data: {
    maquina_id: number;
    categoria_mantenimiento_id: number;
    tipo_solicitud_id: number;
    procedure_id?: number | null;
    nombre: string;
    prioridad: any;
    tipo_disparador: 'calendario' | 'contador';
    frecuencia_dias?: number;
    intervalo_contador?: number;
    meter_type?: string;
  }): Promise<MaintenancePlan> {
    return this.client.request<MaintenancePlan>('/planes-mantenimiento', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
