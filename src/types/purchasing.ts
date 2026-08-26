import { PurchaseOrderStatus } from './common';
import { User } from './user';

export interface Vendor {
  id: number;
  nombre: string;
  contacto_nombre: string | null;
  telefono: string | null;
  email: string | null;
  direccion: string | null;
  notas: string | null;
  activo: boolean;
}

export interface PurchaseOrderItem {
  id: number;
  spare_part_id: number | null;
  nombre: string;
  cantidad: number;
  costo_unitario: number | null;
  subtotal: number | null;
}

export interface PurchaseOrder {
  id: number;
  numero: string;
  estado: PurchaseOrderStatus;
  fecha_esperada: string | null;
  notas: string | null;
  created_at: string | null;
  vendor: Vendor;
  creado_por: User;
  items: PurchaseOrderItem[];
  total: number | string;
}
