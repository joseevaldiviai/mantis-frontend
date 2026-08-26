import { ApiClient } from './client';
import { Machine, WorkOrder, QrPublicInfo } from '../../types';

export class QrApi {
  constructor(protected client: ApiClient) {}

  public async getPublicQrInfo(token: string): Promise<QrPublicInfo> {
    return this.client.request<QrPublicInfo>(`/qr/${token}`);
  }

  public async reportPublicBreakdown(token: string, data: {
    reportado_por_nombre: string;
    descripcion_problema_inicial: string;
    reportado_por_contacto?: string;
    foto_inicial_url?: string;
    prioridad: any;
  }): Promise<WorkOrder> {
    return this.client.request<WorkOrder>(`/qr/${token}/reportar`, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
