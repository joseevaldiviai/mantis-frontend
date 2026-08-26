import { ApiClient } from './client';
import { Machine, MachineKpi, MeterReading } from '../../types';

export class MachinesApi {
  constructor(protected client: ApiClient) {}

  public async getMachines(params: { q?: string; area?: string } = {}): Promise<Machine[]> {
    const q = new URLSearchParams();
    q.append('per_page', '100');
    if (params.area) q.append('area', params.area);
    if (params.q) q.append('q', params.q);
    return this.client.request<Machine[]>(`/maquinas?${q.toString()}`);
  }

  public async getMachine(machineId: number): Promise<Machine> {
    return this.client.request<Machine>(`/maquinas/${machineId}`);
  }

  public async getMachineByCode(codigo: string): Promise<Machine> {
    return this.client.request<Machine>(`/maquinas/codigo/${codigo}`);
  }

  public async createMachine(data: Omit<Machine, 'id' | 'qr_token' | 'activo' | 'fecha_registro'>): Promise<Machine> {
    return this.client.request<Machine>('/maquinas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async regenerateMachineQr(machineId: number): Promise<void> {
    await this.client.request<void>(`/maquinas/${machineId}/qr/regenerar`, { method: 'POST' });
  }

  public async getMachineKpis(machineId: number): Promise<MachineKpi> {
    return this.client.request<MachineKpi>(`/maquinas/${machineId}/kpis`);
  }

  public async addMeterReading(machineId: number, tipo: string, valor: number): Promise<MeterReading> {
    return this.client.request<MeterReading>(`/maquinas/${machineId}/lecturas-contador`, {
      method: 'POST',
      body: JSON.stringify({ tipo, valor })
    });
  }
}
