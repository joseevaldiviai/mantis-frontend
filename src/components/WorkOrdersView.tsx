import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  Filter,
  Kanban,
  List,
  Clock,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  UserCheck,
  RefreshCw,
  Building,
  Users,
  X
} from 'lucide-react';
import { WorkOrder, Priority, Machine, CategoryMantenimiento, TipoSolicitud, EstadoOT, User } from '../types';
import { api } from '../services/api';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';

interface WorkOrdersViewProps {
  isCreateModalOpen: boolean;
  onOpenCreateModal?: () => void;
  onCloseCreateModal: () => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  isCreateModalOpen,
  onOpenCreateModal,
  onCloseCreateModal
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');

  // Selected OT for Detail Modal
  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);

  // New OT Form State
  const [machines, setMachines] = useState<Machine[]>([]);
  const [categories, setCategories] = useState<CategoryMantenimiento[]>([]);
  const [requestTypes, setRequestTypes] = useState<TipoSolicitud[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  const [newMaquinaId, setNewMaquinaId] = useState<number | ''>('');
  const [newCategoriaId, setNewCategoriaId] = useState<number | ''>('');
  const [newTipoSolicitudId, setNewTipoSolicitudId] = useState<number | ''>('');
  const [newPrioridad, setNewPrioridad] = useState<Priority>('media');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [selectedOperariosIds, setSelectedOperariosIds] = useState<number[]>([]);

  // Validation state
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitted, setSubmitted] = useState(false);

  const markTouched = (field: string) => setTouched(prev => ({ ...prev, [field]: true }));

  const isFieldInvalid = (field: string, value: unknown) => {
    if (!touched[field] && !submitted) return false;
    if (field === 'descripcion') return !String(value).trim();
    return !value;
  };

  const fieldErrorClass = (field: string, value: unknown) =>
    isFieldInvalid(field, value)
      ? 'border-rose-400 bg-rose-50/50 focus:border-rose-500 focus:ring-rose-200'
      : 'glass-input';

  const missingFields = [
    !newMaquinaId && 'Máquina',
    !newCategoriaId && 'Categoría',
    !newTipoSolicitudId && 'Tipo de Solicitud',
    !newDescripcion.trim() && 'Descripción'
  ].filter(Boolean) as string[];

  const isFormValid = missingFields.length === 0;

  const loadWorkOrders = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkOrders({ q: searchTerm, prioridad: priorityFilter });
      setWorkOrders(data);
    } catch (e) {
      console.error('Error loading work orders', e);
    } finally {
      setLoading(false);
    }
  };

  // Reset validation when modal opens
  useEffect(() => {
    if (isCreateModalOpen) {
      setTouched({});
      setSubmitted(false);
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    loadWorkOrders();
    api.getMachines().then(m => {
      setMachines(m);
      if (m.length > 0) setNewMaquinaId(m[0].id);
    });
    api.getUsers().then(setAllUsers).catch(() => {});
    api.request<CategoryMantenimiento[]>('/categorias-mantenimiento').then(c => {
      setCategories(c);
      if (c.length > 0) setNewCategoriaId(Number(c[0].id));
    }).catch(() => {});
    api.request<TipoSolicitud[]>('/tipos-solicitud').then(t => {
      setRequestTypes(t);
      if (t.length > 0) setNewTipoSolicitudId(Number(t[0].id));
    }).catch(() => {});
  }, [searchTerm, priorityFilter]);

  const handleCreateOTSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTouched({ maquina: true, categoria: true, tipoSolicitud: true, descripcion: true });
    if (!isFormValid) return;

    try {
      await api.createWorkOrder({
        maquina_id: Number(newMaquinaId),
        categoria_mantenimiento_id: Number(newCategoriaId),
        tipo_solicitud_id: Number(newTipoSolicitudId),
        prioridad: newPrioridad,
        descripcion_problema_inicial: newDescripcion.trim(),
        operarios_ids: selectedOperariosIds
      });

      setNewDescripcion('');
      setSelectedOperariosIds([]);
      setTouched({});
      setSubmitted(false);
      onCloseCreateModal();
      loadWorkOrders();
    } catch (e: any) {
      alert(`Error al crear OT: ${e.message}`);
    }
  };

  // Kanban Columns
  const kanbanColumns = [
    { title: 'Borrador / Creada', statusName: 'Borrador' },
    { title: 'Abierta', statusName: 'Abierta' },
    { title: 'En Proceso', statusName: 'En Proceso' },
    { title: 'Espera de Repuestos', statusName: 'En Espera de Repuestos' },
    { title: 'Finalizada', statusName: 'Finalizada' }
  ];

  return (
    <div className="space-y-6">
      
      {/* Top Title & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#165B62]" />
            Órdenes de Trabajo de Mantenimiento (OT)
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Gestión estilo MaintainX por prioridad, técnico asignado, pautas y consumo de repuestos
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Kanban / List Toggle */}
          <div className="flex items-center p-1 bg-white/40 rounded-xl border border-white/60">
            <button
              onClick={() => setViewMode('kanban')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'kanban' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Kanban className="w-3.5 h-3.5" />
              <span>Kanban</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                viewMode === 'list' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <List className="w-3.5 h-3.5" />
              <span>Lista</span>
            </button>
          </div>

          <button
            onClick={() => onOpenCreateModal?.()}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva OT</span>
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por OT, máquina o síntoma..."
            className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
            className="px-3 py-2 text-xs glass-input rounded-xl focus:outline-none font-medium text-slate-700"
          >
            <option value="">Todas las prioridades</option>
            <option value="baja">Baja</option>
            <option value="media">Media</option>
            <option value="alta">Alta</option>
            <option value="critica">Crítica</option>
          </select>
        </div>
      </div>

      {/* Content Rendering: Kanban vs List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-card rounded-2xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando órdenes de trabajo...</p>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* KANBAN BOARD VIEW */
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 overflow-x-auto pb-4">
          {kanbanColumns.map(col => {
            const columnOrders = workOrders.filter(w => (w.estado?.nombre || 'Abierta').toLowerCase() === col.statusName.toLowerCase());

            return (
              <div key={col.statusName} className="glass-panel p-3 rounded-2xl min-w-[240px] flex flex-col h-full">
                
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider">{col.title}</h3>
                  <span className="text-[10px] font-extrabold bg-white/60 text-slate-800 px-2 py-0.5 rounded-full border border-white/80">
                    {columnOrders.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1 overflow-y-auto max-h-[600px] pr-1">
                  {columnOrders.length === 0 ? (
                    <div className="p-4 text-center text-slate-400 text-xs italic border border-dashed border-white/60 rounded-xl">
                      Sin órdenes
                    </div>
                  ) : (
                    columnOrders.map(ot => (
                      <div
                        key={ot.id}
                        onClick={() => setSelectedOT(ot)}
                        className="glass-card p-3.5 rounded-2xl hover:border-[#3D848C] cursor-pointer transition-all space-y-2 group"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-800 group-hover:text-[#0F434A]">{ot.numero}</span>
                          <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            ot.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            ot.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'
                          }`}>
                            {ot.prioridad}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 leading-snug">{ot.maquina.nombre}</p>
                        
                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {ot.descripcion_problema_inicial || 'Mantenimiento de rutina'}
                        </p>

                        {/* Assigned Operarios Badges */}
                        {ot.colaboradores && ot.colaboradores.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/60">
                            <Users className="w-3.5 h-3.5 text-[#165B62] shrink-0" />
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {ot.colaboradores.slice(0, 3).map((collab, idx) => {
                                const u = collab.usuario;
                                return (
                                  <span
                                    key={collab.id || idx}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] text-[9px] font-black shrink-0"
                                    title={u ? `${u.nombre} ${u.apellido} (${u.cargo || 'Operario'})` : 'Operario'}
                                  >
                                    {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                                  </span>
                                );
                              })}
                            </div>
                            {ot.colaboradores.length > 3 && (
                              <span className="text-[9px] font-bold text-slate-500">+{ot.colaboradores.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[10px] text-slate-400 pt-2 border-t border-white/60">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {new Date(ot.created_at).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                          </span>

                          <span className="font-bold text-[#0F434A]">
                            ${ot.costo_total}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>

              </div>
            );
          })}
        </div>

      ) : (

        /* TABLE LIST VIEW */
        <div className="glass-card rounded-3xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-white/60 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Número OT</th>
                  <th className="px-4 py-3">Máquina / Equipo</th>
                  <th className="px-4 py-3">Problema / Pauta</th>
                  <th className="px-4 py-3">Operarios Asignados</th>
                  <th className="px-4 py-3 text-center">Prioridad</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-right">Costo Total ($)</th>
                  <th className="px-4 py-3 text-center">Acción</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50 font-medium text-slate-800">
                {workOrders.map(ot => (
                  <tr key={ot.id} className="hover:bg-white/50 transition-colors">
                    <td className="px-4 py-3 font-mono font-bold text-[#0A2E33]">
                      {ot.numero}
                    </td>
                    <td className="px-4 py-3">
                      <p className="font-bold text-slate-800">{ot.maquina.nombre}</p>
                      <p className="text-[10px] text-slate-400">{ot.maquina.codigo}</p>
                    </td>
                    <td className="px-4 py-3 max-w-xs truncate">
                      {ot.descripcion_problema_inicial || 'Mantenimiento de rutina'}
                    </td>
                    <td className="px-4 py-3">
                      {ot.colaboradores && ot.colaboradores.length > 0 ? (
                        <div className="flex items-center gap-1.5">
                          <div className="flex -space-x-1.5 overflow-hidden">
                            {ot.colaboradores.slice(0, 3).map((collab, idx) => {
                              const u = collab.usuario;
                              return (
                                <span
                                  key={collab.id || idx}
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] text-[10px] font-bold"
                                  title={u ? `${u.nombre} ${u.apellido} (${u.cargo || 'Operario'})` : 'Operario'}
                                >
                                  {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-[11px] font-semibold text-slate-600">
                            {ot.colaboradores.length === 1 && ot.colaboradores[0].usuario
                              ? `${ot.colaboradores[0].usuario.nombre} ${ot.colaboradores[0].usuario.apellido}`
                              : `${ot.colaboradores.length} operarios`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[10px]">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        ot.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        ot.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'
                      }`}>
                        {ot.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[11px] font-bold px-2 py-0.5 bg-white/60 text-slate-800 rounded-md border border-white/80">
                        {ot.estado.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      ${ot.costo_total}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => setSelectedOT(ot)}
                        className="px-2.5 py-1 bg-[#D9EDEE] hover:bg-[#A9CDD0] text-[#0F434A] font-bold text-xs rounded-lg transition-colors cursor-pointer border border-[#3D848C]/60"
                      >
                        Ver Detalle &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      )}

      {/* Work Order Detail Drawer / Modal */}
      <WorkOrderDetailModal
        workOrder={selectedOT}
        onClose={() => setSelectedOT(null)}
        onReload={() => {
          loadWorkOrders();
          if (selectedOT) {
            api.getWorkOrder(selectedOT.id).then(setSelectedOT).catch(() => {});
          }
        }}
      />

      {/* Create New Work Order Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Crear Nueva Orden de Trabajo</h3>
              <button onClick={onCloseCreateModal} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateOTSubmit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Seleccionar Máquina / Equipo *</label>
                <select
                  value={newMaquinaId}
                  onChange={(e) => { setNewMaquinaId(Number(e.target.value)); markTouched('maquina'); }}
                  onBlur={() => markTouched('maquina')}
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 ${fieldErrorClass('maquina', newMaquinaId)}`}
                >
                  {machines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nombre} ({m.codigo}) - Área: {m.area || 'General'}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nivel de Prioridad *</label>
                <select
                  value={newPrioridad}
                  onChange={(e) => setNewPrioridad(e.target.value as Priority)}
                  className="w-full px-3 py-2 glass-input rounded-xl focus:outline-none font-medium"
                >
                  <option value="baja">Baja - Mantenimiento rutinario</option>
                  <option value="media">Media - Atención normal de turno</option>
                  <option value="alta">Alta - Afecta rendimiento parcial</option>
                  <option value="critica">Crítica - PARADA DE MÁQUINA URGENTE</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción del Problema o Pauta *</label>
                <textarea
                  required
                  rows={3}
                  value={newDescripcion}
                  onChange={(e) => { setNewDescripcion(e.target.value); markTouched('descripcion'); }}
                  onBlur={() => markTouched('descripcion')}
                  placeholder="Detalla los síntomas de la falla, componentes afectados..."
                  className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 ${fieldErrorClass('descripcion', newDescripcion)}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Categoría *</label>
                  <select
                    value={newCategoriaId}
                    onChange={(e) => { setNewCategoriaId(Number(e.target.value)); markTouched('categoria'); }}
                    onBlur={() => markTouched('categoria')}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 ${fieldErrorClass('categoria', newCategoriaId)}`}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Tipo de Solicitud *</label>
                  <select
                    value={newTipoSolicitudId}
                    onChange={(e) => { setNewTipoSolicitudId(Number(e.target.value)); markTouched('tipoSolicitud'); }}
                    onBlur={() => markTouched('tipoSolicitud')}
                    className={`w-full px-3 py-2 rounded-xl focus:outline-none focus:ring-2 ${fieldErrorClass('tipoSolicitud', newTipoSolicitudId)}`}
                  >
                    {requestTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.nombre}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1 flex items-center justify-between">
                  <span>Asignar Operarios / Técnicos ({selectedOperariosIds.length})</span>
                  <span className="text-[10px] text-slate-500 font-normal">Opcional</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white/40 rounded-xl border border-white/60">
                  {allUsers.length === 0 ? (
                    <p className="text-[10px] text-slate-400 italic p-1 col-span-2">Cargando plantilla de operarios...</p>
                  ) : (
                    allUsers.map(u => {
                      const isChecked = selectedOperariosIds.includes(u.id);
                      return (
                        <label
                          key={u.id}
                          className={`flex items-center gap-2 p-1.5 rounded-lg border text-xs cursor-pointer transition-all ${
                            isChecked
                              ? 'bg-[#D9EDEE] border-[#3D848C] text-[#0A2E33] font-bold shadow-2xs'
                              : 'bg-white/60 border-white/80 text-slate-700 hover:bg-white'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedOperariosIds(prev => [...prev, u.id]);
                              } else {
                                setSelectedOperariosIds(prev => prev.filter(id => id !== u.id));
                              }
                            }}
                            className="w-3.5 h-3.5 rounded text-[#165B62] focus:ring-0"
                          />
                          <div className="truncate">
                            <p className="leading-tight">{u.nombre} {u.apellido}</p>
                            <p className="text-[10px] text-slate-500 font-normal capitalize">{u.cargo || u.rol}</p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Validation error summary */}
              {submitted && !isFormValid && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-[11px]">
                    <p className="font-bold text-rose-700">Faltan campos obligatorios:</p>
                    <p className="text-rose-600 mt-0.5">{missingFields.join(', ')}</p>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`px-4 py-1.5 text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer ${
                    isFormValid
                      ? 'text-slate-900 bg-[#3D848C] hover:bg-[#165B62] hover:text-white'
                      : 'text-slate-400 bg-slate-200 cursor-not-allowed'
                  }`}
                >
                  Generar OT
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
