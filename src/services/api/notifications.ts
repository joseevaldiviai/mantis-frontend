import { ApiClient } from './client';
import { NotificationItem } from '../../types';

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
}
