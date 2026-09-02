import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Building2,
  Sparkles,
  Bell,
  QrCode,
  Settings,
  Activity,
  LayoutDashboard,
  Package,
  ClipboardList,
  Cpu,
  CalendarCheck,
  ShoppingBag,
  FolderTree,
  Users,
  LogOut,
  Menu,
  X
} from 'lucide-react';
import { Company, User } from '../types';

interface HeaderProps {
  company?: Company | null;
  user?: User | null;
  activeTab?: string;
  setActiveTab?: (tab: string) => void;
  unreadNotifications?: number;
  unreadCount?: number;
  onOpenNotifications: () => void;
  onOpenApiConfig: () => void;
  onOpenQrReport?: () => void;
  onOpenPublicQrReport?: () => void;
  onLogout?: () => void;
}

const allNavTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['super_admin', 'administrador', 'tecnico', 'produccion'] },
  { id: 'inventario', label: 'Inventario', icon: Package, roles: ['super_admin', 'administrador', 'produccion'] },
  { id: 'ordenes', label: 'Órdenes OT', icon: ClipboardList, roles: ['super_admin', 'administrador', 'tecnico', 'produccion'] },
  { id: 'maquinas', label: 'Máquinas', icon: Cpu, roles: ['super_admin', 'administrador', 'tecnico', 'produccion'] },
  { id: 'planes', label: 'Preventivos', icon: CalendarCheck, roles: ['super_admin', 'administrador', 'tecnico', 'produccion'] },
  { id: 'compras', label: 'Compras', icon: ShoppingBag, roles: ['super_admin', 'administrador', 'produccion'] },
  { id: 'catalogos', label: 'Catálogos', icon: FolderTree, roles: ['super_admin', 'administrador'] },
  { id: 'usuarios', label: 'Usuarios & Admin', icon: Users, roles: ['super_admin', 'administrador'] },
  { id: 'rag', label: 'Asistente IA', icon: Sparkles, roles: ['super_admin', 'administrador', 'tecnico', 'produccion'] },
  { id: 'qr', label: 'QR Equipo', icon: QrCode, roles: ['super_admin', 'administrador', 'tecnico', 'produccion'] },
];

export const Header: React.FC<HeaderProps> = ({
  company,
  user,
  activeTab = 'dashboard',
  setActiveTab,
  unreadNotifications,
  unreadCount = 0,
  onOpenNotifications,
  onOpenApiConfig,
  onOpenQrReport,
  onOpenPublicQrReport,
  onLogout
}) => {
  const actualUnread = unreadNotifications !== undefined ? unreadNotifications : unreadCount;
  const handleQrClick = onOpenQrReport || onOpenPublicQrReport || (() => {});

  // Request push notification permission on first interaction
  React.useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      const requestPermission = () => {
        Notification.requestPermission();
        window.removeEventListener('click', requestPermission);
      };
      window.addEventListener('click', requestPermission, { once: true });
      return () => window.removeEventListener('click', requestPermission);
    }
  }, []);

  // Filtrar pestañas según el rol del usuario
  const userRole = user?.rol || 'tecnico';
  const navTabs = allNavTabs.filter(tab => tab.roles.includes(userRole as any));

  // Estado del menú hamburguesa móvil
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleMobileTabClick = (tabId: string) => {
    setActiveTab?.(tabId);
    setIsMobileMenuOpen(false);
  };

  // Bloquear scroll del body cuando el menú está abierto
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isMobileMenuOpen]);

  return (
    <header className="sticky top-0 z-30 glass-header shadow-xs px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        
        {/* ═══ MOBILE LAYOUT (< lg) ═══ */}
        <div className="lg:hidden flex flex-col gap-2.5">
          {/* Mobile Row 1: Logo + Brand + Icons */}
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-icon.png"
                alt="Mantis Intelligence System"
                className="w-9 h-9 rounded-xl bg-white shadow-sm border border-white/60 object-contain p-1"
              />
              <span className="font-extrabold text-lg tracking-tight text-slate-800">
                Mantis
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* Notifications */}
              <button
                onClick={onOpenNotifications}
                className="relative p-2 text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 rounded-xl border border-white/60 transition-all shadow-2xs"
                title="Ver Notificaciones"
              >
                <Bell className="w-5 h-5" />
                {actualUnread > 0 && (
                  <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[16px] text-center shadow-2xs animate-pulse">
                    {actualUnread}
                  </span>
                )}
              </button>

              {/* Settings - oculto para técnicos */}
              {user?.rol !== 'tecnico' && (
                <button
                  onClick={onOpenApiConfig}
                  className="p-2 text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 rounded-xl border border-white/60 transition-all shadow-2xs"
                  title="Configuración"
                >
                  <Settings className="w-5 h-5" />
                </button>
              )}

              {/* Hamburger */}
              {setActiveTab && (
                <button
                  onClick={() => setIsMobileMenuOpen(true)}
                  className="p-2 rounded-xl bg-white/40 hover:bg-white/70 border border-white/60 transition-all shadow-2xs cursor-pointer"
                  title="Menú de navegación"
                >
                  <Menu className="w-5 h-5 text-slate-700" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* ═══ DESKTOP LAYOUT (≥ lg) ═══ */}
        <div className="hidden lg:flex items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="Mantis Intelligence System"
              className="w-10 h-10 rounded-lg bg-white shadow-sm border border-white/60 object-contain p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-800">
                  Mantis
                </span>
                <span className="text-[11px] uppercase font-bold tracking-widest bg-[#D9EDEE] text-[#0F434A] px-2.5 py-0.5 rounded-full border border-[#3D848C]/60">
                  CMMS & Inventario
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Gestión de Mantenimiento e Inventario Multi-Empresa
              </p>
            </div>
          </div>

          {/* Center: Company Badge & Mode */}
          <div className="flex items-center gap-3">
            {company && (
              <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl text-xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-[#165B62]" />
                <span className="font-medium">{company.nombre}</span>
                {company.nit_ruc && (
                  <span className="text-slate-400 text-[12px]">({company.nit_ruc})</span>
                )}
              </div>
            )}

            {user?.rol !== 'tecnico' && (
              <button
                onClick={onOpenApiConfig}
                title="Haz clic para configurar el endpoint de API o Token Sanctum"
                className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all bg-[#D9EDEE] text-[#0F434A] border-[#3D848C] hover:bg-[#A9CDD0]"
              >
                <Activity className="w-3.5 h-3.5" />
                <span>API Laravel Sanctum Conectada</span>
              </button>
            )}
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-2 sm:gap-3">
            {/* Public QR Report Button */}
            <button
              onClick={handleQrClick}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-[#D9EDEE]/80 hover:bg-[#D9EDEE] border border-[#3D848C]/60 rounded-xl transition-all shadow-2xs"
              title="Simular escaneo de QR para reporte de falla en terreno sin inicio de sesión"
            >
              <QrCode className="w-4 h-4 text-[#165B62]" />
              <span>Reporte QR Terreno</span>
            </button>

            {/* Notifications */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 rounded-xl border border-white/60 transition-all shadow-2xs"
              title="Ver Notificaciones de Inventario y Mantenimiento"
            >
              <Bell className="w-5 h-5" />
              {actualUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[11px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-2xs animate-pulse">
                  {actualUnread}
                </span>
              )}
            </button>

            {/* Settings / API Config - oculto para técnicos */}
            {user?.rol !== 'tecnico' && (
              <button
                onClick={onOpenApiConfig}
                className="p-2 text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 rounded-xl border border-white/60 transition-all shadow-2xs"
                title="Configurar Endpoints de API Sanctum / Token"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* User Avatar & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-300/50">
                <div className="w-8 h-8 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] font-bold flex items-center justify-center text-xs shadow-2xs">
                  {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
                </div>
                <div className="text-left text-xs">
                  <p className="font-semibold text-slate-800 leading-tight">{user.nombre} {user.apellido}</p>
                  <p className="text-[11px] text-slate-500 capitalize">{user.cargo || user.rol}</p>
                </div>
                {onLogout && (
                  <button
                    onClick={onLogout}
                    className="p-1.5 ml-1 text-slate-500 hover:text-rose-600 bg-white/40 hover:bg-rose-50 rounded-xl border border-white/60 transition-all cursor-pointer"
                    title="Cerrar Sesión MANTIS"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Desktop Navigation Tabs - Hidden on Mobile */}
        {setActiveTab && (
          <nav className="hidden lg:flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-white/40">
            {navTabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap cursor-pointer ${
                    isActive
                      ? 'bg-[#3D848C] text-slate-900 font-bold shadow-sm border border-white/80'
                      : 'text-slate-700 bg-white/30 hover:bg-white/60 hover:text-slate-900 border border-white/40'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-900' : 'text-[#165B62]'}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </nav>
        )}

      </div>

      {/* ═══ MOBILE SLIDE-IN MENU (Portal al body) ═══ */}
      {setActiveTab && createPortal(
        <>
          {/* Backdrop */}
          <div
            className={`fixed inset-0 z-[9998] bg-black/50 transition-opacity duration-300 ${
              isMobileMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Slide Panel */}
          <nav
            className={`fixed top-0 left-0 z-[9999] h-screen w-72 bg-white shadow-2xl transition-transform duration-300 ease-in-out flex flex-col ${
              isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            {/* Panel Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-slate-200 bg-white">
              <div className="flex items-center gap-2.5">
                <img
                  src="/logo-icon.png"
                  alt="Mantis"
                  className="w-8 h-8 rounded-lg bg-white shadow-sm border border-slate-200 object-contain p-0.5"
                />
                <span className="font-extrabold text-base text-slate-800">Mantis</span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            {/* User Info */}
            {user && (
              <div className="px-5 py-4 border-b border-slate-200 bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-[#165B62] text-white font-bold flex items-center justify-center text-sm shrink-0">
                    {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{user.nombre} {user.apellido}</p>
                    <p className="text-[12px] text-slate-500 capitalize truncate">{user.cargo || user.rol}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Navigation Items */}
            <div className="flex-1 overflow-y-auto px-3 py-3">
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-2">Navegación</p>
              <div className="flex flex-col gap-0.5">
                {navTabs.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => handleMobileTabClick(tab.id)}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                        isActive
                          ? 'bg-[#165B62] text-white font-bold shadow-sm'
                          : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-[#165B62]'}`} />
                      <span>{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Logout */}
            {onLogout && (
              <div className="px-3 py-3 border-t border-slate-200 bg-white">
                <button
                  onClick={() => { onLogout(); setIsMobileMenuOpen(false); }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer text-rose-600 hover:bg-rose-50"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Cerrar Sesión</span>
                </button>
              </div>
            )}
          </nav>
        </>,
        document.body
      )}
    </header>
  );
};
