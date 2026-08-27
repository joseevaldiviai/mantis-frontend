import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { ApiConfigModal } from './components/ApiConfigModal';
import { PublicQrReportModal } from './components/PublicQrReportModal';
import { NotificationsModal } from './components/NotificationsModal';
import { DashboardView } from './components/DashboardView';
import { InventoryView } from './components/InventoryView';
import { WorkOrdersView } from './components/WorkOrdersView';
import { MachinesView } from './components/MachinesView';
import { PreventivePlansView } from './components/PreventivePlansView';
import { PurchasesVendorsView } from './components/PurchasesVendorsView';
import { CatalogsView } from './components/CatalogsView';
import { UsersCompaniesView } from './components/UsersCompaniesView';
import { RagView } from './components/RagView';
import { RagChatPanel } from './components/RagChatPanel';
import { QrScannerView } from './components/QrScannerView';
import { WorkOrderFullView } from './components/WorkOrderFullView';
import { LoginScreen } from './components/LoginScreen';
import { api } from './services/api';
import { User, Company, NotificationItem } from './types';

// Pestañas permitidas por rol
const allowedTabsByRole: Record<string, string[]> = {
  super_admin: ['dashboard', 'inventario', 'ordenes', 'maquinas', 'planes', 'compras', 'catalogos', 'usuarios', 'rag', 'qr'],
  administrador: ['dashboard', 'inventario', 'ordenes', 'maquinas', 'planes', 'compras', 'catalogos', 'usuarios', 'rag', 'qr'],
  tecnico: ['ordenes', 'maquinas', 'planes', 'rag', 'qr'],
  produccion: ['dashboard', 'inventario', 'ordenes', 'maquinas', 'planes', 'compras', 'rag', 'qr'],
};

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(api.isAuthenticated());
  
  // Modals visibility state
  const [isApiConfigOpen, setIsApiConfigOpen] = useState(false);
  const [isQrReportOpen, setIsQrReportOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isCreateOtOpen, setIsCreateOtOpen] = useState(false);
  const [isCreateSparePartOpen, setIsCreateSparePartOpen] = useState(false);

  // Full OT view state
  const [viewingFullOtId, setViewingFullOtId] = useState<number | null>(null);

  // Current session user & company
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentCompany, setCurrentCompany] = useState<Company | null>(null);

  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [notificationsList, setNotificationsList] = useState<NotificationItem[]>([]);

  // Refresh trigger counter
  const [refreshKey, setRefreshKey] = useState(0);

  // Notifications polling
  useEffect(() => {
    if (!api.isAuthenticated()) return;
    const fetchUnreadCount = () => {
      api.getUnreadNotificationCount()
        .then(count => setUnreadNotifications(count))
        .catch(() => {});
    };
    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, [refreshKey]);

  useEffect(() => {
    if (api.isAuthenticated()) {
      api.getMe().catch(() => null).then((u) => {
        if (u) {
          setCurrentUser(u);
          // Los super_admin no necesitan empresa asociada
          if (u.rol === 'super_admin') {
            setCurrentCompany(null);
            setIsAuthenticated(true);
          } else {
            api.getCurrentCompany().catch(() => null).then((c) => {
              setCurrentCompany(c);
              setIsAuthenticated(true);
            });
          }
        } else {
          setIsAuthenticated(false);
        }
      });
    } else {
      setIsAuthenticated(false);
    }
  }, [refreshKey]);

  // Función segura para cambiar de pestaña con validación de permisos
  const safeSetActiveTab = (tab: string) => {
    const role = currentUser?.rol || 'tecnico';
    const allowed = allowedTabsByRole[role] || allowedTabsByRole.tecnico;
    if (allowed.includes(tab)) {
      setActiveTab(tab);
    } else {
      // Redirigir a órdenes de trabajo si no tiene permisos
      setActiveTab('ordenes');
    }
  };

  const handleCreateWorkOrderClick = () => {
    setActiveTab('ordenes');
    setIsCreateOtOpen(true);
  };

  const handleLoginSuccess = (user: User, company: Company) => {
    setCurrentUser(user);
    setCurrentCompany(company);
    setIsAuthenticated(true);
    setRefreshKey(prev => prev + 1);
  };

  const handleLogout = async () => {
    await api.logout();
    setIsAuthenticated(false);
    setCurrentUser(null);
    setCurrentCompany(null);
  };

  // Render Login screen if user is not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onOpenApiConfig={() => setIsApiConfigOpen(true)}
          onOpenQrReport={() => setIsQrReportOpen(true)}
        />

        <ApiConfigModal
          isOpen={isApiConfigOpen}
          onClose={() => setIsApiConfigOpen(false)}
        />

        <PublicQrReportModal
          isOpen={isQrReportOpen}
          onClose={() => setIsQrReportOpen(false)}
          onReportCreated={() => setRefreshKey(p => p + 1)}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen text-slate-800 font-sans flex flex-col selection:bg-[#3D848C] selection:text-slate-900">
      
      {/* Top Header & Navigation Bar */}
      <Header
        company={currentCompany}
        user={currentUser}
        activeTab={activeTab}
        setActiveTab={safeSetActiveTab}
        unreadNotifications={unreadNotifications}
        onOpenNotifications={() => {
          setIsNotificationsOpen(true);
          api.getNotifications().then(setNotificationsList).catch(() => setNotificationsList([]));
        }}
        onOpenQrReport={() => setIsQrReportOpen(true)}
        onOpenApiConfig={() => setIsApiConfigOpen(true)}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex gap-5 max-w-[1440px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* ═══ Chat RAG (siempre visible, izquierda) ═══ */}
        <aside className="w-[340px] flex-shrink-0 hidden lg:flex">
          <div className="w-full h-[calc(100vh-140px)] sticky top-[88px]">
            <RagChatPanel />
          </div>
        </aside>

        {/* ═══ Contenido de la pestaña activa ═══ */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && (
            <DashboardView
              key={`dash-${refreshKey}`}
              onNavigateTab={safeSetActiveTab}
              onOpenNewOT={handleCreateWorkOrderClick}
              onOpenNewSparePart={() => {
                safeSetActiveTab('inventario');
                setIsCreateSparePartOpen(true);
              }}
              onOpenPublicQrReport={() => setIsQrReportOpen(true)}
            />
          )}

          {activeTab === 'inventario' && (
            <InventoryView
              key={`inv-${refreshKey}`}
              isCreateModalOpen={isCreateSparePartOpen}
              onCloseCreateModal={() => setIsCreateSparePartOpen(false)}
            />
          )}

          {activeTab === 'ordenes' && !viewingFullOtId && (
            <WorkOrdersView
              key={`ot-${refreshKey}`}
              isCreateModalOpen={isCreateOtOpen}
              onOpenCreateModal={() => setIsCreateOtOpen(true)}
              onCloseCreateModal={() => setIsCreateOtOpen(false)}
              onViewFull={(otId) => setViewingFullOtId(otId)}
            />
          )}

          {activeTab === 'ordenes' && viewingFullOtId && (
            <WorkOrderFullView
              workOrderId={viewingFullOtId}
              onBack={() => setViewingFullOtId(null)}
            />
          )}

          {activeTab === 'maquinas' && (
            <MachinesView key={`maq-${refreshKey}`} />
          )}

          {activeTab === 'planes' && (
            <PreventivePlansView key={`plans-${refreshKey}`} />
          )}

          {activeTab === 'compras' && (
            <PurchasesVendorsView key={`compras-${refreshKey}`} />
          )}

          {activeTab === 'catalogos' && (
            <CatalogsView key={`cat-${refreshKey}`} />
          )}

          {activeTab === 'usuarios' && (
            <UsersCompaniesView
              key={`users-${refreshKey}`}
              user={currentUser}
              onUserSwitch={() => setRefreshKey(p => p + 1)}
            />
          )}

          {activeTab === 'rag' && (
            <RagView />
          )}

          {activeTab === 'qr' && (
            <QrScannerView
              onCreateWorkOrder={(machineId, machineName) => {
                safeSetActiveTab('ordenes');
                setIsCreateOtOpen(true);
              }}
            />
          )}
        </main>

      </div>

      {/* Footer */}
      <footer className="border-t border-white/40 bg-white/30 backdrop-blur-md py-4 px-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="font-semibold text-slate-800">
            Mantis CMMS &copy; {new Date().getFullYear()} — Plataforma de Gestión de Mantenimiento e Inventario Industrial
          </p>
          {currentUser?.rol !== 'tecnico' && (
            <button
              onClick={() => setIsApiConfigOpen(true)}
              className="text-slate-600 hover:text-slate-900 underline font-medium cursor-pointer text-[12px]"
            >
              Configurar Conexión Laravel Sanctum
            </button>
          )}
        </div>
      </footer>

      {/* Modals */}
      <ApiConfigModal
        isOpen={isApiConfigOpen}
        onClose={() => setIsApiConfigOpen(false)}
      />

      <PublicQrReportModal
        isOpen={isQrReportOpen}
        onClose={() => setIsQrReportOpen(false)}
        onReportCreated={() => setRefreshKey(p => p + 1)}
      />

      <NotificationsModal
        isOpen={isNotificationsOpen}
        onClose={() => {
          setIsNotificationsOpen(false);
          setUnreadNotifications(0);
        }}
        notifications={notificationsList}
        onMarkAllRead={() => {
          api.markAllNotificationsAsRead().catch(() => {});
          setNotificationsList(prev => prev.map(n => ({ ...n, leida: true })));
          setUnreadNotifications(0);
        }}
        onMarkAsRead={(id) => {
          api.markNotificationAsRead(id).catch(() => {});
          setNotificationsList(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
          setUnreadNotifications(prev => Math.max(0, prev - 1));
        }}
        onDelete={(id) => {
          api.deleteNotification(id).catch(() => {});
          setNotificationsList(prev => prev.filter(n => n.id !== id));
        }}
      />

    </div>
  );
}
