import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  Calendar,
  Gauge,
  Clock,
  Wrench,
  CheckCircle2,
  RefreshCw,
  X,
  ChevronLeft,
  ChevronRight,
  Edit3,
  Trash2
} from 'lucide-react';
import { MaintenancePlan, Machine, CategoryMantenimiento, TipoSolicitud, Priority } from '../types';
import { api } from '../services/api';

export const PreventivePlansView: React.FC = () => {
  const [plans, setPlans] = useState<MaintenancePlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MaintenancePlan | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'calendar'>('list');

  // Calendar state
  const [calendarDate, setCalendarDate] = useState(new Date());

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
      if (m.length > 0 && !newMaquinaId) setNewMaquinaId(m[0].id);
    });
    api.request<CategoryMantenimiento[]>('/categorias-mantenimiento').then(c => {
      setCategories(c);
      if (c.length > 0 && !newCategoriaId) setNewCategoriaId(Number(c[0].id));
    }).catch(() => {});
    api.request<TipoSolicitud[]>('/tipos-solicitud').then(t => {
      setRequestTypes(t);
      if (t.length > 0 && !newTipoSolicitudId) setNewTipoSolicitudId(Number(t[0].id));
    }).catch(() => {});
  }, []);

  const resetForm = () => {
    setNewNombre('');
    setNewMaquinaId(machines.length > 0 ? machines[0].id : '');
    setNewCategoriaId(categories.length > 0 ? Number(categories[0].id) : '');
    setNewTipoSolicitudId(requestTypes.length > 0 ? Number(requestTypes[0].id) : '');
    setNewPrioridad('media');
    setNewTriggerType('calendario');
    setNewFrecuenciaDias(30);
    setNewIntervaloContador(250);
    setNewMeterType('Horas de Uso');
  };

  const openEditModal = (plan: MaintenancePlan) => {
    setEditingPlan(plan);
    setNewNombre(plan.nombre);
    setNewMaquinaId(plan.maquina.id);
    setNewCategoriaId(plan.categoria_mantenimiento?.id || '');
    setNewTipoSolicitudId((plan as any).tipo_solicitud?.id || '');
    setNewPrioridad(plan.prioridad as Priority);
    setNewTriggerType(plan.tipo_disparador as 'calendario' | 'contador');
    setNewFrecuenciaDias(plan.frecuencia_dias || 30);
    setNewIntervaloContador(plan.intervalo_contador || 250);
    setNewMeterType(plan.meter_type || 'Horas de Uso');
    setIsEditOpen(true);
  };

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

      resetForm();
      setIsCreateOpen(false);
      loadPlans();
    } catch (e: any) {
      alert(`Error al crear plan: ${e.message}`);
    }
  };

  const handleEditPlanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan || !newNombre.trim() || !newMaquinaId || !newCategoriaId || !newTipoSolicitudId) return;

    try {
      await api.updateMaintenancePlan(editingPlan.id, {
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

      resetForm();
      setEditingPlan(null);
      setIsEditOpen(false);
      loadPlans();
    } catch (e: any) {
      alert(`Error al actualizar plan: ${e.message}`);
    }
  };

  const handleDeletePlan = async (plan: MaintenancePlan) => {
    if (!confirm(`¿Eliminar el plan "${plan.nombre}"?`)) return;
    try {
      await api.deleteMaintenancePlan(plan.id);
      loadPlans();
    } catch (e: any) {
      alert(`Error al eliminar plan: ${e.message}`);
    }
  };

  // Calendar: show each plan only on its proxima_generacion date
  const calendarEvents = useMemo(() => {
    const events: { date: string; plan: MaintenancePlan }[] = [];
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const monthStartMs = new Date(year, month, 1).getTime();
    const monthEndMs = new Date(year, month + 1, 0, 23, 59, 59).getTime();

    plans.forEach(plan => {
      if (!plan.proxima_generacion) return;

      const d = new Date(plan.proxima_generacion);
      if (isNaN(d.getTime())) return;

      const ms = d.getTime();
      if (ms >= monthStartMs && ms <= monthEndMs) {
        const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
        events.push({ date: dateStr, plan });
      }
    });

    return events;
  }, [plans, calendarDate]);

  // Calendar helpers
  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const daysInMonth = new Date(calendarYear, calendarMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(calendarYear, calendarMonth, 1).getDay(); // 0=Sun
  const adjustedFirstDay = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1; // Mon=0
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const monthLabel = calendarDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1));
  const nextMonth = () => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1));

  return (
    <div className="space-y-6">

      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-[#165B62]" />
            Planes de Mantenimiento Preventivo Programado
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generación automática de OTs por intervalo de tiempo (días) o lectura de contador/horómetro
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* View mode toggle */}
          <div className="flex items-center p-1 bg-white/40 rounded-xl border border-white/60">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Wrench className="w-3.5 h-3.5" />
              <span>Planes</span>
            </button>
            <button
              onClick={() => setViewMode('calendar')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'calendar' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>Calendario</span>
            </button>
          </div>

          <button
            onClick={() => { resetForm(); setIsCreateOpen(true); }}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Plan Preventivo</span>
          </button>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando planes preventivos...</p>
        </div>
      ) : viewMode === 'list' ? (

        /* LIST VIEW */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {plans.length === 0 ? (
            <div className="col-span-full py-12 text-center text-slate-500 glass-card rounded-xl p-8">
              <ShieldCheck className="w-8 h-8 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-bold">No hay planes preventivos creados</p>
              <p className="text-xs text-slate-400 mt-1">Crea uno haciendo clic en "Nuevo Plan Preventivo"</p>
            </div>
          ) : (
            plans.map(p => (
              <div key={p.id} className="glass-card p-5 rounded-lg space-y-3 hover:border-[#3D848C] transition-all">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-lg border border-[#3D848C]/50">
                    {p.maquina.nombre}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-bold px-2 py-0.5 bg-white/60 text-slate-700 rounded-lg border border-white/80">
                      {p.tipo_disparador === 'calendario' ? `Cada ${p.frecuencia_dias} Días` : `Cada ${p.intervalo_contador} ${p.meter_type}`}
                    </span>
                    <button
                      onClick={() => openEditModal(p)}
                      className="p-1.5 rounded-lg hover:bg-white/60 text-slate-500 hover:text-[#165B62] transition-colors cursor-pointer"
                      title="Editar plan"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(p)}
                      className="p-1.5 rounded-lg hover:bg-rose-50 text-slate-500 hover:text-rose-600 transition-colors cursor-pointer"
                      title="Eliminar plan"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div>
                  <h3 className="font-extrabold text-slate-800 text-sm">{p.nombre}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">{p.descripcion || 'Pauta preventivo de rutina'}</p>
                </div>

                <div className="flex items-center gap-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1">
                    <Wrench className="w-3 h-3 text-[#165B62]" />
                    {p.categoria_mantenimiento?.nombre || 'General'}
                  </span>
                  <span className="flex items-center gap-1 capitalize">
                    <Gauge className="w-3 h-3 text-[#165B62]" />
                    {p.prioridad}
                  </span>
                </div>

                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-xs flex items-center justify-between text-slate-600">
                  <span>Próxima Generación:</span>
                  <strong className="text-[#0F434A] font-bold">
                    {p.proxima_generacion ? new Date(p.proxima_generacion).toLocaleDateString('es-ES') : 'Inmediata'}
                  </strong>
                </div>
              </div>
            ))
          )}
        </div>

      ) : (

        /* CALENDAR VIEW */
        <div className="glass-card rounded-xl p-5">
          {/* Calendar header */}
          <div className="flex items-center justify-between mb-4">
            <button onClick={prevMonth} className="p-2 hover:bg-white/60 rounded-xl transition-colors cursor-pointer">
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </button>
            <h2 className="text-sm font-extrabold text-slate-800 capitalize">{monthLabel}</h2>
            <button onClick={nextMonth} className="p-2 hover:bg-white/60 rounded-xl transition-colors cursor-pointer">
              <ChevronRight className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Day headers */}
          <div className="grid grid-cols-7 gap-1 mb-1">
            {['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'].map(d => (
              <div key={d} className="text-center text-[10px] font-bold text-slate-500 uppercase py-1">
                {d}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Empty cells before first day */}
            {Array.from({ length: adjustedFirstDay }).map((_, i) => (
              <div key={`empty-${i}`} className="min-h-[70px] rounded-lg" />
            ))}

            {/* Day cells */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calendarYear}-${String(calendarMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const dayEvents = calendarEvents.filter(e => e.date === dateStr);
              const isToday = dateStr === todayStr;

              return (
                <div
                  key={day}
                  className={`min-h-[70px] p-1.5 rounded-lg border text-[11px] transition-all ${
                    isToday
                      ? 'border-[#3D848C] bg-[#D9EDEE]/60 ring-1 ring-[#3D848C]/30'
                      : dayEvents.length > 0
                        ? 'border-[#3D848C]/40 bg-white/60'
                        : 'border-white/40 bg-white/30 hover:bg-white/50'
                  }`}
                >
                  <span className={`font-bold text-[11px] ${isToday ? 'text-[#165B62] font-extrabold' : 'text-slate-600'}`}>
                    {day}
                  </span>
                  <div className="mt-1 space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev, idx) => (
                      <div
                        key={idx}
                        className="px-1 py-0.5 rounded text-[9px] font-bold truncate bg-[#3D848C]/15 text-[#0F434A] border border-[#3D848C]/30"
                        title={`${ev.plan.nombre} — ${ev.plan.maquina.nombre}`}
                      >
                        {ev.plan.maquina.nombre}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <span className="text-[9px] font-bold text-slate-500">+{dayEvents.length - 3} más</span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Legend / upcoming events */}
          {calendarEvents.length > 0 && (
            <div className="mt-4 pt-3 border-t border-white/60">
              <h3 className="text-xs font-bold text-slate-700 mb-2">Mantenimientos Programados Este Mes</h3>
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {calendarEvents
                  .sort((a, b) => a.date.localeCompare(b.date))
                  .map((ev, idx) => (
                    <div key={idx} className="flex items-center justify-between p-2 bg-white/40 rounded-lg border border-white/60 text-[11px]">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3 h-3 text-[#165B62]" />
                        <span className="font-bold text-slate-700">
                          {new Date(ev.date + 'T12:00:00').toLocaleDateString('es-ES', { weekday: 'short', day: 'numeric', month: 'short' })}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-bold text-[#0F434A] truncate">{ev.plan.nombre}</span>
                        <span className="text-slate-400 shrink-0">·</span>
                        <span className="text-slate-500 shrink-0">{ev.plan.maquina.nombre}</span>
                      </div>
                    </div>
                  ))
                }
              </div>
            </div>
          )}

          {calendarEvents.length === 0 && (
            <div className="mt-4 pt-3 border-t border-white/60 text-center text-xs text-slate-400 italic">
              No hay mantenimientos preventivos programados para este mes.
            </div>
          )}
        </div>
      )}

      {/* Create Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-xl max-w-md w-full p-6 shadow-2xl">
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newFrecuenciaDias}
                        onChange={(e) => setNewFrecuenciaDias(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block font-semibold text-slate-700 mb-1">Intervalo Contador</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
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

      {/* Edit Modal */}
      {isEditOpen && editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Editar Plan Preventivo</h3>
              <button onClick={() => { setIsEditOpen(false); setEditingPlan(null); }} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPlanSubmit} className="py-4 space-y-3 text-xs">
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
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        value={newFrecuenciaDias}
                        onChange={(e) => setNewFrecuenciaDias(parseInt(e.target.value) || 30)}
                        className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                      />
                    </>
                  ) : (
                    <>
                      <label className="block font-semibold text-slate-700 mb-1">Intervalo Contador</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
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
                  onClick={() => { setIsEditOpen(false); setEditingPlan(null); }}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl cursor-pointer transition-all"
                >
                  Actualizar Plan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
