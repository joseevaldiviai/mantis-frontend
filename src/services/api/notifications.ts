import { ApiClient } from './client';
import { NotificationItem } from '../../types';

export interface CreateNotificationParams {
  tipo: string;
  mensaje: string;
  data?: Record<string, unknown>;
}

export class NotificationsApi {
  constructor(protected client: ApiClient) {}

  public async getNotifications(): Promise<NotificationItem[]> {
    return this.client.request<NotificationItem[]>('/notificaciones?per_page=100');
  }

  public async getUnreadNotificationCount(): Promise<number> {
    const res = await this.client.request<{ no_leidas: number }>('/notificaciones/no-leidas/count');
    return res.no_leidas;
  }

  public async markAllNotificationsAsRead(): Promise<void> {
    await this.client.request<void>('/notificaciones/leer-todas', { method: 'POST' });
  }

  public async createNotification(params: CreateNotificationParams): Promise<NotificationItem> {
    return this.client.request<NotificationItem>('/notificaciones', {
      method: 'POST',
      body: JSON.stringify({
        tipo: params.tipo,
        mensaje: params.mensaje,
        data: params.data ? JSON.stringify(params.data) : null
      })
    });
  }

  public async createBulkNotifications(params: CreateNotificationParams & { user_ids: number[] }): Promise<void> {
    await this.client.request<void>('/notificaciones/bulk', {
      method: 'POST',
      body: JSON.stringify({
        tipo: params.tipo,
        mensaje: params.mensaje,
        data: params.data ? JSON.stringify(params.data) : null,
        user_ids: params.user_ids
      })
    });
  }

  public async markAsRead(notificationId: string): Promise<void> {
    await this.client.request<void>(`/notificaciones/${notificationId}/leer`, { method: 'POST' });
  }

  public async deleteNotification(notificationId: string): Promise<void> {
    await this.client.request<void>(`/notificaciones/${notificationId}`, { method: 'DELETE' });
  }
}
