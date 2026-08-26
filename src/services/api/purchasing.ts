import { ApiClient } from './client';
import { Vendor, PurchaseOrder } from '../../types';

export class PurchasingApi {
  constructor(protected client: ApiClient) {}

  public async getVendors(): Promise<Vendor[]> {
    return this.client.request<Vendor[]>('/proveedores?per_page=100');
  }

  public async createVendor(data: Omit<Vendor, 'id' | 'activo'>): Promise<Vendor> {
    return this.client.request<Vendor>('/proveedores', {
      method: 'POST',
      body: JSON.stringify({ ...data, activo: true })
    });
  }

  public async getPurchaseOrders(): Promise<PurchaseOrder[]> {
    return this.client.request<PurchaseOrder[]>('/ordenes-compra?per_page=100');
  }

  public async createPurchaseOrder(data: {
    vendor_id: number;
    items: Array<{ spare_part_id?: number | null; nombre: string; cantidad: number; costo_unitario: number }>;
    fecha_esperada?: string;
    notas?: string;
  }): Promise<PurchaseOrder> {
    return this.client.request<PurchaseOrder>('/ordenes-compra', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
