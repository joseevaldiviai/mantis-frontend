/**
 * Re-export barrel — todos los tipos ahora viven en src/types/ por dominio.
 * Este archivo se mantiene por compatibilidad con imports existentes.
 */
export type { Priority, PurchaseOrderStatus, UserRole } from './types/common';
export type { Specialty, User, Company, AuthSessionToken } from './types/user';
export type { Machine, MachineDocument, MeterReading, MachineKpi } from './types/machine';
export type {
  CategoryMantenimiento,
  TipoSolicitud,
  EstadoOT,
  ChecklistItem,
  MaterialRequest,
  WorkOrderComment,
  WorkOrderCollaborator,
  StatusHistory,
  WorkOrder
} from './types/workOrder';
export type { SparePart } from './types/inventory';
export type { ProcedureItem, Procedure, MaintenancePlan } from './types/maintenance';
export type { Vendor, PurchaseOrderItem, PurchaseOrder } from './types/purchasing';
export type { NotificationItem } from './types/notification';
export type { DashboardSummary } from './types/dashboard';
export type { QrPublicInfo, QrDocument } from './types/qr';
