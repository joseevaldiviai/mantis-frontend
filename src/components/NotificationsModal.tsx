import React from 'react';
import { X, Bell, CheckCheck, AlertTriangle, Clock, Wrench } from 'lucide-react';
import { NotificationItem } from '../types';

interface NotificationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: NotificationItem[];
  onMarkAllRead: () => void;
}

export const NotificationsModal: React.FC<NotificationsModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllRead
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-emerald-100 max-h-[85vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base text-stone-900">Notificaciones del Sistema</h3>
              <p className="text-xs text-stone-500">Alertas de inventario, OTs y preventivos</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Bar */}
        <div className="py-3 flex items-center justify-between border-b border-stone-100 text-xs">
          <span className="text-stone-500 font-medium">
            {notifications.filter(n => !n.leida).length} no leídas
          </span>
          <button
            onClick={onMarkAllRead}
            className="flex items-center gap-1 text-emerald-700 hover:text-emerald-800 font-semibold"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            <span>Marcar todas como leídas</span>
          </button>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto py-2 space-y-2 divide-y divide-stone-50">
          {notifications.length === 0 ? (
            <div className="py-12 text-center text-stone-400">
              <p className="text-xs">No hay notificaciones registradas.</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`p-3 rounded-xl transition-all ${
                  !n.leida ? 'bg-emerald-50/60 border border-emerald-100' : 'bg-stone-50/50'
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className={`p-1.5 rounded-lg shrink-0 ${
                    n.tipo === 'inventario_bajo'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {n.tipo === 'inventario_bajo' ? <AlertTriangle className="w-4 h-4" /> : <Wrench className="w-4 h-4" />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-stone-800 font-medium leading-snug">
                      {n.mensaje}
                    </p>
                    <div className="flex items-center gap-1 text-[10px] text-stone-400 mt-1">
                      <Clock className="w-3 h-3" />
                      <span>{new Date(n.created_at).toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-stone-100 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
