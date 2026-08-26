import { ApiClient } from './client';

export class DownloadsApi {
  constructor(protected client: ApiClient) {}

  public async getMachineQrImageUrl(machineId: number): Promise<string> {
    return this.client.fetchAuthenticatedBlobUrl(`/maquinas/${machineId}/qr`);
  }

  public async downloadMachineHistoryCsv(machineId: number, filename: string): Promise<void> {
    const url = await this.client.fetchAuthenticatedBlobUrl(`/maquinas/${machineId}/historial/exportar`);
    this.client.triggerDownload(url, filename);
    URL.revokeObjectURL(url);
  }

  public async downloadInventoryCsv(filename: string): Promise<void> {
    const url = await this.client.fetchAuthenticatedBlobUrl('/repuestos/exportar');
    this.client.triggerDownload(url, filename);
    URL.revokeObjectURL(url);
  }
}
