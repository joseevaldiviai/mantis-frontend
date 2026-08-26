import { ApiClient } from './client';
import { SparePart } from '../../types';

export class InventoryApi {
  constructor(protected client: ApiClient) {}

  public async getSpareParts(params: { q?: string; activo?: boolean } = {}): Promise<SparePart[]> {
    const q = new URLSearchParams();
    q.append('per_page', '100');
    if (params.activo !== undefined) q.append('activo', String(params.activo));
    if (params.q) q.append('q', params.q);
    return this.client.request<SparePart[]>(`/repuestos?${q.toString()}`);
  }

  public async getSparePart(id: number): Promise<SparePart> {
    return this.client.request<SparePart>(`/repuestos/${id}`);
  }

  public async createSparePart(part: Omit<SparePart, 'id' | 'activo'> & { activo?: boolean }): Promise<SparePart> {
    return this.client.request<SparePart>('/repuestos', {
      method: 'POST',
      body: JSON.stringify(part)
    });
  }

  public async updateSparePart(id: number, part: Partial<SparePart>): Promise<SparePart> {
    return this.client.request<SparePart>(`/repuestos/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(part)
    });
  }

  public async setSparePartStock(id: number, deltaQuantity: number): Promise<SparePart> {
    const part = await this.getSparePart(id);
    const newStock = Math.max(0, part.stock_actual + deltaQuantity);
    return this.updateSparePart(id, { stock_actual: newStock });
  }

  public async toggleSparePartStatus(id: number, active: boolean): Promise<SparePart> {
    const action = active ? 'activar' : 'desactivar';
    return this.client.request<SparePart>(`/repuestos/${id}/${action}`, { method: 'POST' });
  }

  public async deleteSparePart(id: number): Promise<void> {
    await this.client.request<void>(`/repuestos/${id}`, { method: 'DELETE' });
  }
}
