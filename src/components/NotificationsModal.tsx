import React from 'react';
import { X, Bell, CheckCheck, AlertTriangle, Clock, Wrench, Trash2, Package, Settings, RotateCcw, UserCheck, FileText } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
  onMarkAsRead?: (id: string) => void;
  onDelete?: (id: string) => void;
}

const getIcon = (tipo: string) => {
  switch (tipo) {
    case 'nueva_ot': return <FileText className="w-4 h-4" />;
    case 'ot_asignada': return <UserCheck className="w-4 h-4" />;
    case 'catalogo_change': return <Package className="w-4 h-4" />;
    case 'config_change': return <Settings className="w-4 h-4" />;
    case 'estado_change': return <RotateCcw className="w-4 h-4" />;
    case 'inventario_bajo': return <AlertTriangle className="w-4 h-4" />;
    default: return <Wrench className="w-4 h-4" />;
  }
};

const getIconBg = (tipo: string) => {
  switch (tipo) {
    case 'nueva_ot': return 'bg-[#D9EDEE] text-[#165B62]';
    case 'ot_asignada': return 'bg-indigo-100 text-indigo-800';
    case 'catalogo_change': return 'bg-amber-100 text-amber-800';
    case 'config_change': return 'bg-slate-100 text-slate-800';
    case 'estado_change': return 'bg-violet-100 text-violet-800';
    case 'inventario_bajo': return 'bg-amber-100 text-amber-800';
    default: return 'bg-emerald-100 text-emerald-800';
  }
};

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead,
  onMarkAsRead,
  onDelete
}) => {
  if (!isOpen) return null;

  const unreadCount = notifications.filter(n => !n.leida).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg relative">
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Notificaciones del Sistema</h3>
              <p className="text-xs text-stone-500">{notifications.length} total · {unreadCount} sin leer</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="py-3 flex items-center justify-between border-b border-stone-100 text-xs">
          <span className="text-stone-500 font-medium">
            {unreadCount > 0 ? `${unreadCount} no leídas` : 'Todo leído'}
          </span>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllRead}
              className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Marcar todas como leídas</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 divide-y divide-stone-50">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-xs">No hay notificaciones registradas.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.leida && onMarkAsRead?.(n.id)}
                className={`p-3 rounded-xl transition-all group cursor-pointer ${
                  !n.leida ? 'bg-emerald-50/60 border border-emerald-100 hover:bg-emerald-50' : 'bg-stone-50/50 hover:bg-stone-100/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${getIconBg(n.tipo)}`}>
                    {getIcon(n.tipo)}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-xs text-stone-800 font-medium leading-snug">
                        {n.mensaje}
                      </p>
                      {!n.leida && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center gap-1 text-[11px] text-stone-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.created_at).toLocaleString('es-ES')}</span>
                    </div>
                  </div>

                  {onDelete && (
                    <button
                      onClick={(e) => { e.stopPropagation(); onDelete(n.id); }}
                      className="p-1 text-stone-300 hover:text-rose-600 rounded-lg opacity-0 group-hover:opacity-100 transition-all cursor-pointer shrink-0"
                      title="Eliminar notificación"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg cursor-pointer"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
