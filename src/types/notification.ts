export interface NotificationItem {
  id: string;
  tipo: string;
  mensaje: string | null;
  data: string | null;
  leida: boolean;
  created_at: string;
}
