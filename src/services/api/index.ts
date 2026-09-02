import { ApiClient } from './client';
import { AuthApi } from './auth';
import { UsersApi } from './users';
import { DashboardApi } from './dashboard';
import { InventoryApi } from './inventory';
import { WorkOrdersApi } from './workOrders';
import { MachinesApi } from './machines';
import { MaintenanceApi } from './maintenance';
import { PurchasingApi } from './purchasing';
import { NotificationsApi } from './notifications';
import { QrApi } from './qr';
import { DownloadsApi } from './downloads';
import {
  User, Company, AuthSessionToken, DashboardSummary,
  SparePart, WorkOrder, ChecklistItem, MaterialRequest, WorkOrderComment, WorkOrderCollaborator,
  Machine, MachineKpi, MeterReading, MaintenancePlan,
  Vendor, PurchaseOrder, NotificationItem
} from '../../types';

/**
 * Servicio API principal de Mantis CMMS.
 * Expone módulos de dominio organizados + métodos de compatibilidad.
 */
export class MantisApiService extends ApiClient {
  public auth: AuthApi;
  public users: UsersApi;
  public dashboard: DashboardApi;
  public inventory: InventoryApi;
  public workOrders: WorkOrdersApi;
  public machines: MachinesApi;
  public maintenance: MaintenanceApi;
  public purchasing: PurchasingApi;
  public notifications: NotificationsApi;
  public qr: QrApi;
  public downloads: DownloadsApi;

  constructor() {
    super();
    this.auth = new AuthApi(this);
    this.users = new UsersApi(this);
    this.dashboard = new DashboardApi(this);
    this.inventory = new InventoryApi(this);
    this.workOrders = new WorkOrdersApi(this);
    this.machines = new MachinesApi(this);
    this.maintenance = new MaintenanceApi(this);
    this.purchasing = new PurchasingApi(this);
    this.notifications = new NotificationsApi(this);
    this.qr = new QrApi(this);
    this.downloads = new DownloadsApi(this);
  }

  // ==========================================
  // PROXY METHODS — compatibilidad con imports existentes
  // ==========================================

  // Auth
  public login = (email: string, password: string) => this.auth.login(email, password);
  public logout = () => this.auth.logout();
  public getMe = () => this.auth.getMe();
  public getCurrentCompany = () => this.auth.getCurrentCompany();
  public getTokens = () => this.auth.getTokens();
  public revokeToken = (tokenId: string) => this.auth.revokeToken(tokenId);

  // Users & Companies
  public getCompanies = () => this.users.getCompanies();
  public createCompany = (data: { nombre: string; nit_ruc?: string }) => this.users.createCompany(data);
  public updateCompany = (id: number, data: Partial<Company>) => this.users.updateCompany(id, data);
  public getUsers = (companyId?: number) => this.users.getUsers(companyId);
  public createUser = (data: Partial<User> & { especialidad_ids?: number[]; password?: string }) => this.users.createUser(data);
  public updateUser = (id: number, data: Partial<User> & { especialidad_ids?: number[]; password?: string }) => this.users.updateUser(id, data);
  public deleteUser = (id: number) => this.users.deleteUser(id);

  // Dashboard
  public getDashboardSummary = (desde?: string, hasta?: string) => this.dashboard.getDashboardSummary(desde, hasta);

  // Inventory
  public getSpareParts = (params?: { q?: string; activo?: boolean }) => this.inventory.getSpareParts(params);
  public getSparePart = (id: number) => this.inventory.getSparePart(id);
  public createSparePart = (part: Omit<SparePart, 'id' | 'activo'> & { activo?: boolean }) => this.inventory.createSparePart(part);
  public updateSparePart = (id: number, part: Partial<SparePart>) => this.inventory.updateSparePart(id, part);
  public setSparePartStock = (id: number, delta: number) => this.inventory.setSparePartStock(id, delta);
  public toggleSparePartStatus = (id: number, active: boolean) => this.inventory.toggleSparePartStatus(id, active);
  public deleteSparePart = (id: number) => this.inventory.deleteSparePart(id);

  // Work Orders
  public getWorkOrders = (params?: { prioridad?: string; q?: string }) => this.workOrders.getWorkOrders(params);
  public getWorkOrder = (id: number) => this.workOrders.getWorkOrder(id);
  public createWorkOrder = (data: any) => this.workOrders.createWorkOrder(data);
  public changeWorkOrderStatus = (workOrderId: number, estadoId: number) => this.workOrders.changeWorkOrderStatus(workOrderId, estadoId);
  public addChecklistItem = (workOrderId: number, texto: string) => this.workOrders.addChecklistItem(workOrderId, texto);
  public toggleChecklistItem = (workOrderId: number, itemId: string | number, completado: boolean) => this.workOrders.toggleChecklistItem(workOrderId, itemId, completado);
  public addMaterialRequest = (workOrderId: number, data: any) => this.workOrders.addMaterialRequest(workOrderId, data);
  public addComment = (workOrderId: number, mensaje: string, imagen_url?: string | null, tiempo_utilizado?: number | null) => this.workOrders.addComment(workOrderId, mensaje, imagen_url, tiempo_utilizado);
  public addCollaborator = (workOrderId: number, userId: number) => this.workOrders.addCollaborator(workOrderId, userId);
  public removeCollaborator = (workOrderId: number, collaboratorId: string | number) => this.workOrders.removeCollaborator(workOrderId, collaboratorId);
  public finalizeWorkOrder = (workOrderId: number, data: any) => this.workOrders.finalizeWorkOrder(workOrderId, data);

  // Machines
  public getMachines = (params?: { q?: string; area?: string }) => this.machines.getMachines(params);
  public getMachine = (machineId: number) => this.machines.getMachine(machineId);
  public getMachineByCode = (codigo: string) => this.machines.getMachineByCode(codigo);
  public createMachine = (data: any) => this.machines.createMachine(data);
  public regenerateMachineQr = (machineId: number) => this.machines.regenerateMachineQr(machineId);
  public getMachineKpis = (machineId: number) => this.machines.getMachineKpis(machineId);
  public addMeterReading = (machineId: number, tipo: string, valor: number) => this.machines.addMeterReading(machineId, tipo, valor);

  // Maintenance
  public getMaintenancePlans = () => this.maintenance.getMaintenancePlans();
  public createMaintenancePlan = (data: any) => this.maintenance.createMaintenancePlan(data);
  public updateMaintenancePlan = (id: number, data: any) => this.maintenance.updateMaintenancePlan(id, data);
  public deleteMaintenancePlan = (id: number) => this.maintenance.deleteMaintenancePlan(id);

  // Purchasing
  public getVendors = () => this.purchasing.getVendors();
  public createVendor = (data: Omit<Vendor, 'id' | 'activo'>) => this.purchasing.createVendor(data);
  public getPurchaseOrders = () => this.purchasing.getPurchaseOrders();
  public createPurchaseOrder = (data: any) => this.purchasing.createPurchaseOrder(data);

  // Notifications
  public getNotifications = () => this.notifications.getNotifications();
  public getUnreadNotificationCount = () => this.notifications.getUnreadNotificationCount();
  public markAllNotificationsAsRead = () => this.notifications.markAllNotificationsAsRead();
  public createNotification = (params: { tipo: string; mensaje: string; data?: Record<string, unknown> }) => this.notifications.createNotification(params);
  public createBulkNotifications = (params: { tipo: string; mensaje: string; data?: Record<string, unknown>; user_ids: number[] }) => this.notifications.createBulkNotifications(params);
  public markNotificationAsRead = (id: string) => this.notifications.markAsRead(id);
  public deleteNotification = (id: string) => this.notifications.deleteNotification(id);

  // QR
  public getPublicQrInfo = (token: string) => this.qr.getPublicQrInfo(token);
  public reportPublicBreakdown = (token: string, data: any) => this.qr.reportPublicBreakdown(token, data);

  // Downloads
  public getMachineQrImageUrl = (machineId: number) => this.downloads.getMachineQrImageUrl(machineId);
  public downloadMachineHistoryCsv = (machineId: number, filename: string) => this.downloads.downloadMachineHistoryCsv(machineId, filename);
  public downloadInventoryCsv = (filename: string) => this.downloads.downloadInventoryCsv(filename);
}

export const api = new MantisApiService();
