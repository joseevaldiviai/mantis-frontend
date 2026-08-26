import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Plus,
  Calendar,
  Gauge,
  Clock,
  Wrench,
  CheckCircle2,
  RefreshCw,
  X
} from 'lucide-react';
import { MaintenancePlan, Machine, CategoryMantenimiento, TipoSolicitud, Priority } from '../types';
import { api } from '../services/api';

export const PreventivePlansView: React.FC = () => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [machines, setMachines] = useState<Machine[]>([]);
  const [categories, setCategories] = useState<CategoryMantenimiento[]>([]);
  const [requestTypes, setRequestTypes] = useState<TipoSolicitud[]>([]);

  const [newNombre, setNewNombre] = useState('');
  const [newMaquinaId, setNewMaquinaId] = useState<number | ''>('');
  const [newCategoriaId, setNewCategoriaId] = useState<number | ''>('');
  const [newTipoSolicitudId, setNewTipoSolicitudId] = useState<number | ''>('');
  const [newPrioridad, setNewPrioridad] = useState<Priority>('media');
  const [newTriggerType, setNewTriggerType] = useState<'calendario' | 'contador'>('calendario');
  const [newFrecuenciaDias, setNewFrecuenciaDias] = useState<number>(30);
  const [newIntervaloContador, setNewIntervaloContador] = useState<number>(250);
  const [newMeterType, setNewMeterType] = useState('Horas de Uso');

  const loadPlans = async () => {
    setLoading(true);
    try {
      const data = await api.getMaintenancePlans();
      setPlans(data);
    } catch (e) {
      console.error('Error loading maintenance plans', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
    api.getMachines().then(m => {
      setMachines(m);
      if (m.length > 0) setNewMaquinaId(m[0].id);
    });
    api.request<CategoryMantenimiento[]>('/categorias-mantenimiento').then(c => {
      setCategories(c);
      if (c.length > 0) setNewCategoriaId(Number(c[0].id));
    }).catch(() => {});
    api.request<TipoSolicitud[]>('/tipos-solicitud').then(t => {
      setRequestTypes(t);
      if (t.length > 0) setNewTipoSolicitudId(Number(t[0].id));
    }).catch(() => {});
  }, []);

  const handleCreatePlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newMaquinaId || !newCategoriaId || !newTipoSolicitudId) return;

    try {
      await api.createMaintenancePlan({
        nombre: newNombre.trim(),
        maquina_id: Number(newMaquinaId),
        categoria_mantenimiento_id: Number(newCategoriaId),
        tipo_solicitud_id: Number(newTipoSolicitudId),
        prioridad: newPrioridad,
        tipo_disparador: newTriggerType,
        frecuencia_dias: newTriggerType === 'calendario' ? Number(newFrecuenciaDias) : undefined,
        intervalo_contador: newTriggerType === 'contador' ? Number(newIntervaloContador) : undefined,
        meter_type: newTriggerType === 'contador' ? newMeterType : undefined
      });

      setNewNombre('');
      setIsCreateOpen(false);
      loadPlans();
    } catch (e: any) {
      alert(`Error al crear plan: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#165B62]" />
            Planes de Mantenimiento Preventivo Programado
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generación automática de OTs por intervalo de tiempo (días) o lectura de contador/horómetro
          </p>
        </div>

        <button
          onClick={() => setIsCreateOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Plan Preventivo</span>
        </button>
      </div>

      {/* Plans List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-3xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando planes preventivos...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.map(p => (
            <div key={p.id} className="glass-card p-5 rounded-2xl space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold px-2 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-lg border border-[#3D848C]/50">
                  {p.maquina.nombre}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-white/60 text-slate-700 rounded-lg border border-white/80">
                  {p.tipo_disparador === 'calendario' ? `Cada ${p.frecuencia_dias} Días` : `Cada ${p.intervalo_contador} ${p.meter_type}`}
                </span>
              </div>

              <div>
                <h3 className="font-extrabold text-slate-800 text-sm">{p.nombre}</h3>
                <p className="text-xs text-slate-500 mt-0.5">{p.descripcion || 'Pauta preventivo de rutina'}</p>
              </div>

              <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-xs flex items-center justify-between text-slate-600">
                <span>Próxima Generación:</span>
                <strong className="text-[#0F434A] font-bold">
                  {p.proxima_generacion ? new Date(p.proxima_generacion).toLocaleDateString('es-ES') : 'Inmediata'}
                </strong>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Crear Plan Mantenimiento Preventivo</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePlanSubmit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Plan *</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Plan Preventivo Mensual Lubricación"
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Máquina Asignada *</label>
                <select
                  value={newMaquinaId}
                  onChange={(e) => setNewMaquinaId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>{m.nombre} ({m.codigo})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Tipo de Solicitud *</label>
                <select
                  value={newTipoSolicitudId}
                  onChange={(e) => setNewTipoSolicitudId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                >
                  {requestTypes.map(t => (
                    <option key={t.id} value={t.id}>{t.nombre}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Disparador</label>
                  <select
                    value={newTriggerType}
                    onChange={(e) => setNewTriggerType(e.target.value as any)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  >
                    <option value="calendario">Por Tiempo (Días)</option>
                    <option value="contador">Por Contador / Horómetro</option>
                  </select>
                </div>

                <div>
                  {newTriggerType === 'calendario' ? (
                    <>
                      <label className="block font-semibold text-slate-700 mb-1">Frecuencia (Días)</label>
                      <input
                        type="number"
                        min="1"
                        value={newFrecuenciaDias}
                        onChange={(e) => setNewFrecuenciaDias(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block font-semibold text-slate-700 mb-1">Intervalo Contador</label>
                      <input
                        type="number"
                        min="1"
                        value={newIntervaloContador}
                        onChange={(e) => setNewIntervaloContador(parseInt(e.target.value) || 250)}
                        className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                      />
                    </>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl cursor-pointer transition-all"
                >
                  Guardar Plan Preventivo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
