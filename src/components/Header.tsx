import React from 'react';
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
  LogOut
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

const navTabs = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'inventario', label: 'Inventario', icon: Package },
  { id: 'ordenes', label: 'Órdenes OT', icon: ClipboardList },
  { id: 'maquinas', label: 'Máquinas', icon: Cpu },
  { id: 'planes', label: 'Preventivos', icon: CalendarCheck },
  { id: 'compras', label: 'Compras', icon: ShoppingBag },
  { id: 'catalogos', label: 'Catálogos', icon: FolderTree },
  { id: 'usuarios', label: 'Usuarios & Admin', icon: Users },
  { id: 'rag', label: 'Asistente IA', icon: Sparkles },
  { id: 'qr', label: 'QR Equipo', icon: QrCode },
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

  return (
    <header className="sticky top-0 z-30 glass-header shadow-xs px-4 lg:px-8 py-3">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        
        {/* Top Bar */}
        <div className="flex items-center justify-between gap-4">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <img
              src="/logo-icon.png"
              alt="Mantis Intelligence System"
              className="w-10 h-10 rounded-2xl bg-white shadow-sm border border-white/60 object-contain p-1"
            />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl tracking-tight text-slate-800">
                  Mantis
                </span>
                <span className="text-[10px] uppercase font-bold tracking-widest bg-[#D9EDEE] text-[#0F434A] px-2.5 py-0.5 rounded-full border border-[#3D848C]/60">
                  CMMS & Inventario
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Gestión de Mantenimiento e Inventario Multi-Empresa
              </p>
            </div>
          </div>

          {/* Center: Company Badge & Mode */}
          <div className="hidden md:flex items-center gap-3">
            {company && (
              <div className="flex items-center gap-2 px-3 py-1.5 glass-card rounded-xl text-xs text-slate-700">
                <Building2 className="w-3.5 h-3.5 text-[#165B62]" />
                <span className="font-medium">{company.nombre}</span>
                {company.nit_ruc && (
                  <span className="text-slate-400 text-[11px]">({company.nit_ruc})</span>
                )}
              </div>
            )}

            <button
              onClick={onOpenApiConfig}
              title="Haz clic para configurar el endpoint de API o Token Sanctum"
              className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all bg-[#D9EDEE] text-[#0F434A] border-[#3D848C] hover:bg-[#A9CDD0]"
            >
              <Activity className="w-3.5 h-3.5" />
              <span>API Laravel Sanctum Conectada</span>
            </button>
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
              <span className="hidden sm:inline">Reporte QR Terreno</span>
            </button>

            {/* Notifications Trigger */}
            <button
              onClick={onOpenNotifications}
              className="relative p-2 text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 rounded-xl border border-white/60 transition-all shadow-2xs"
              title="Ver Notificaciones de Inventario y Mantenimiento"
            >
              <Bell className="w-5 h-5" />
              {actualUnread > 0 && (
                <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center shadow-2xs animate-pulse">
                  {actualUnread}
                </span>
              )}
            </button>

            {/* Settings / API Config */}
            <button
              onClick={onOpenApiConfig}
              className="p-2 text-slate-700 hover:text-slate-900 bg-white/40 hover:bg-white/70 rounded-xl border border-white/60 transition-all shadow-2xs"
              title="Configurar Endpoints de API Sanctum / Token"
            >
              <Settings className="w-5 h-5" />
            </button>

            {/* User Avatar & Logout */}
            {user && (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-300/50">
                <div className="w-8 h-8 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] font-bold flex items-center justify-center text-xs shadow-2xs">
                  {user.nombre?.charAt(0)}{user.apellido?.charAt(0)}
                </div>
                <div className="hidden lg:block text-left text-xs">
                  <p className="font-semibold text-slate-800 leading-tight">{user.nombre} {user.apellido}</p>
                  <p className="text-[10px] text-slate-500 capitalize">{user.cargo || user.rol}</p>
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

        {/* Navigation Tabs Bar */}
        {setActiveTab && (
          <nav className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar border-t border-white/40">
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
    </header>
  );
};

