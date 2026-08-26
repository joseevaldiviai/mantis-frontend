import { ApiClient } from './client';
import { DashboardSummary } from '../../types';

export class DashboardApi {
  constructor(protected client: ApiClient) {}

  public async getDashboardSummary(desde?: string, hasta?: string): Promise<DashboardSummary> {
    const query = new URLSearchParams();
    if (desde) query.append('desde', desde);
    if (hasta) query.append('hasta', hasta);
    return this.client.request<DashboardSummary>(`/dashboard/resumen?${query.toString()}`);
  }
}
