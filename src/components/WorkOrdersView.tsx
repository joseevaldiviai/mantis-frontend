import React, { useState, useEffect, useRef, useCallback } from 'react';
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
  X,
  Eye,
  EyeOff
} from 'lucide-react';
import { WorkOrder, Priority, Machine, CategoryMantenimiento, TipoSolicitud, EstadoOT, User } from '../types';
import { api } from '../services/api';
import { WorkOrderDetailModal } from './WorkOrderDetailModal';
import { notifyNewWorkOrder } from '../services/pushNotifications';

interface WorkOrdersViewProps {
  isCreateModalOpen: boolean;
  onOpenCreateModal?: () => void;
  onCloseCreateModal: () => void;
  onViewFull?: (otId: number) => void;
}

export const WorkOrdersView: React.FC<WorkOrdersViewProps> = ({
  isCreateModalOpen,
  onOpenCreateModal,
  onCloseCreateModal,
  onViewFull
}) => {
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // Dynamic estados from API
  const [estadosOT, setEstadosOT] = useState<EstadoOT[]>([]);

  // Selected OT for Detail Modal
  const [selectedOT, setSelectedOT] = useState<WorkOrder | null>(null);
  const [isRefreshingOT, setIsRefreshingOT] = useState(false);

  // Drag state
  const [draggedOT, setDraggedOT] = useState<WorkOrder | null>(null);
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null);

  // Touch drag state
  const touchStartRef = useRef<{ x: number; y: number; ot: WorkOrder } | null>(null);
  const touchCloneRef = useRef<HTMLDivElement | null>(null);
  const touchColumnsRef = useRef<{ name: string; el: HTMLElement }[]>([]);
  const isTouchDraggingRef = useRef(false);

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
  const [newEstimacion, setNewEstimacion] = useState('');

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
      const mostrarOtATodos = localStorage.getItem('mantis_mostrar_ot_a_todos') !== 'false';
      if (!mostrarOtATodos && currentUser?.rol === 'tecnico') {
        const otAsignadas = data.filter(ot =>
          ot.colaboradores?.some(c => c.user_id === currentUser.id)
        );
        setWorkOrders(otAsignadas);
      } else {
        setWorkOrders(data);
      }
    } catch (e) {
      console.error('Error loading work orders', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isCreateModalOpen) {
      setTouched({});
      setSubmitted(false);
    }
  }, [isCreateModalOpen]);

  useEffect(() => {
    api.getMe().then(user => {
      setCurrentUser(user);
    }).catch(() => {});

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
    // Load dynamic statuses
    api.request<EstadoOT[]>('/estados-ot').then(e => {
      setEstadosOT(e.filter(est => est.activo));
    }).catch(() => {});

    // Reload statuses when tab becomes visible (e.g. after editing in Catalogs)
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        api.request<EstadoOT[]>('/estados-ot').then(e => {
          setEstadosOT(e.filter(est => est.activo));
        }).catch(() => {});
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
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
        operarios_ids: selectedOperariosIds,
        hora_termino: newEstimacion.trim() || undefined
      });

      // Push notification
      const mach = machines.find(m => m.id === Number(newMaquinaId));
      notifyNewWorkOrder('Nueva', mach?.nombre || 'Sin máquina', newPrioridad);

      setNewDescripcion('');
      setSelectedOperariosIds([]);
      setNewEstimacion('');
      setTouched({});
      setSubmitted(false);
      onCloseCreateModal();
      loadWorkOrders();
    } catch (e: any) {
      alert(`Error al crear OT: ${e.message}`);
    }
  };

  // Dynamic kanban columns from API
  const kanbanColumns = [...estadosOT]
    .sort((a, b) => a.orden - b.orden)
    .map(est => ({ id: est.id, title: est.nombre, statusName: est.nombre, color: est.color }));

  // Drag-and-drop handlers (desktop)
  const handleDragStart = (ot: WorkOrder) => {
    setDraggedOT(ot);
  };

  const handleDragOver = (e: React.DragEvent, statusName: string) => {
    e.preventDefault();
    setDragOverStatus(statusName);
  };

  const handleDragLeave = () => {
    setDragOverStatus(null);
  };

  const handleDrop = async (e: React.DragEvent, targetStatus: string) => {
    e.preventDefault();
    setDragOverStatus(null);
    if (!draggedOT) return;

    const targetEstado = kanbanColumns.find(c => c.statusName === targetStatus);
    if (!targetEstado || draggedOT.estado?.nombre === targetStatus) {
      setDraggedOT(null);
      return;
    }

    // Optimistic update
    const otNum = draggedOT.numero;
    setWorkOrders(prev => prev.map(ot =>
      ot.id === draggedOT.id ? { ...ot, estado: { ...ot.estado, nombre: targetStatus } } : ot
    ));

    try {
      await api.changeWorkOrderStatus(draggedOT.id, targetEstado.id);
    } catch {
      loadWorkOrders();
    }
    setDraggedOT(null);
  };

  const handleDragEnd = () => {
    setDraggedOT(null);
    setDragOverStatus(null);
  };

  // Touch drag-and-drop handlers (mobile)
  const handleTouchStart = useCallback((ot: WorkOrder, e: React.TouchEvent) => {
    const touch = e.touches[0];
    touchStartRef.current = { x: touch.clientX, y: touch.clientY, ot };
    isTouchDraggingRef.current = false;

    // Collect kanban columns
    const container = e.currentTarget.closest('[data-kanban-container]');
    if (container) {
      touchColumnsRef.current = Array.from(
        container.querySelectorAll('[data-status-name]')
      ).map(el => ({ name: el.getAttribute('data-status-name') || '', el: el as HTMLElement }));
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const dx = Math.abs(touch.clientX - touchStartRef.current.x);
    const dy = Math.abs(touch.clientY - touchStartRef.current.y);

    if (!isTouchDraggingRef.current && (dx > 10 || dy > 10)) {
      isTouchDraggingRef.current = true;
      e.preventDefault();

      // Create floating clone
      const ot = touchStartRef.current.ot;
      const clone = document.createElement('div');
      clone.className = 'fixed z-[9999] pointer-events-none bg-white/90 border border-[#3D848C] rounded-xl px-3 py-2 shadow-xl text-xs font-bold text-slate-800';
      clone.textContent = `${ot.numero} - ${ot.maquina.nombre}`;
      clone.style.left = `${touch.clientX - 60}px`;
      clone.style.top = `${touch.clientY - 20}px`;
      document.body.appendChild(clone);
      touchCloneRef.current = clone;
    }

    if (isTouchDraggingRef.current && touchCloneRef.current) {
      touchCloneRef.current.style.left = `${touch.clientX - 60}px`;
      touchCloneRef.current.style.top = `${touch.clientY - 20}px`;

      // Detect target column
      let detectedStatus: string | null = null;
      for (const col of touchColumnsRef.current) {
        const rect = col.el.getBoundingClientRect();
        if (touch.clientX >= rect.left && touch.clientX <= rect.right &&
            touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
          detectedStatus = col.name;
          break;
        }
      }
      setDragOverStatus(detectedStatus);
    }
  }, []);

  const handleTouchEnd = useCallback(async () => {
    if (touchCloneRef.current) {
      touchCloneRef.current.remove();
      touchCloneRef.current = null;
    }

    if (isTouchDraggingRef.current && touchStartRef.current && dragOverStatus) {
      const ot = touchStartRef.current.ot;
      const targetCol = kanbanColumns.find(c => c.statusName === dragOverStatus);
      if (targetCol && ot.estado?.nombre !== dragOverStatus) {
        // Optimistic update
        setWorkOrders(prev => prev.map(o =>
          o.id === ot.id ? { ...o, estado: { ...o.estado, nombre: dragOverStatus } } : o
        ));
        try {
          await api.changeWorkOrderStatus(ot.id, targetCol.id);
        } catch {
          loadWorkOrders();
        }
      }
    }

    touchStartRef.current = null;
    isTouchDraggingRef.current = false;
    setDragOverStatus(null);
  }, [dragOverStatus, kanbanColumns]);

  const gridCols = kanbanColumns.length <= 3 ? 'grid-cols-1 md:grid-cols-3'
    : kanbanColumns.length <= 5 ? 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5'
    : 'grid-cols-1 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-7';

  return (
    <div className="space-y-6">
      
      {/* Top Title & Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-xl">
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
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-4 rounded-lg">
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

      {/* Content Rendering */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-card rounded-lg p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando órdenes de trabajo...</p>
        </div>
      ) : kanbanColumns.length === 0 ? (
        <div className="py-12 text-center text-slate-500 glass-card rounded-lg p-8">
          <AlertCircle className="w-6 h-6 text-amber-400 mx-auto mb-2" />
          <p className="text-xs font-medium">No hay estados configurados</p>
          <p className="text-[11px] text-slate-400 mt-1">Ve a Catálogos para crear estados de OT</p>
        </div>
      ) : viewMode === 'kanban' ? (
        
        /* KANBAN BOARD VIEW - Dynamic */
        <div
          className={`grid ${gridCols} gap-4 overflow-x-auto pb-4`}
          data-kanban-container
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {kanbanColumns.map(col => {
            const columnOrders = workOrders.filter(w => (w.estado?.nombre || '').toLowerCase() === col.statusName.toLowerCase());
            const isOver = dragOverStatus === col.statusName;

            return (
              <div
                key={col.statusName}
                data-status-name={col.statusName}
                className={`glass-panel p-3 rounded-lg min-w-[240px] flex flex-col h-full transition-all ${isOver ? 'ring-2 ring-blue-400 bg-blue-50/30' : ''}`}
                onDragOver={(e) => handleDragOver(e, col.statusName)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, col.statusName)}
              >
                
                <div className="flex items-center justify-between mb-3 px-1">
                  <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: col.color || '#3D848C' }} />
                    {col.title}
                  </h3>
                  <span className="text-[11px] font-extrabold px-2 py-0.5 rounded-full border text-white" style={{ backgroundColor: col.color || '#3D848C', borderColor: col.color || '#3D848C' }}>
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
                        draggable
                        onDragStart={() => handleDragStart(ot)}
                        onDragEnd={handleDragEnd}
                        onTouchStart={(e) => handleTouchStart(ot, e)}
                        onClick={() => {
                          setSelectedOT(ot);
                          setIsRefreshingOT(true);
                          api.getWorkOrder(ot.id).then(setSelectedOT).finally(() => setIsRefreshingOT(false));
                        }}
                        className={`glass-card p-3.5 rounded-lg hover:border-[#3D848C] cursor-pointer transition-all space-y-2 group ${draggedOT?.id === ot.id ? 'opacity-50' : ''}`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-extrabold text-xs text-slate-800 group-hover:text-[#0F434A]">{ot.numero}</span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border uppercase ${
                            ot.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                            ot.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                            'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'
                          }`}>
                            {ot.prioridad}
                          </span>
                        </div>

                        <p className="text-xs font-bold text-slate-900 leading-snug">{ot.maquina.nombre}</p>
                        
                        <p className="text-[12px] text-slate-500 line-clamp-2 leading-relaxed">
                          {ot.descripcion_problema_inicial || 'Mantenimiento de rutina'}
                        </p>

                        {ot.hora_termino && (
                          <div className="flex items-center gap-1.5 text-[11px] text-[#0F434A] font-bold">
                            <Clock className="w-3 h-3" />
                            <span>Estimación: {ot.hora_termino}</span>
                          </div>
                        )}

                        {ot.colaboradores && ot.colaboradores.length > 0 && (
                          <div className="flex items-center gap-1.5 pt-1.5 border-t border-white/60">
                            <Users className="w-3.5 h-3.5 text-[#165B62] shrink-0" />
                            <div className="flex -space-x-1.5 overflow-hidden">
                              {ot.colaboradores.slice(0, 3).map((collab, idx) => {
                                const u = collab.usuario;
                                return (
                                  <span
                                    key={collab.id || idx}
                                    className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] text-[10px] font-black shrink-0"
                                    title={u ? `${u.nombre} ${u.apellido} (${u.cargo || 'Operario'})` : 'Operario'}
                                  >
                                    {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                                  </span>
                                );
                              })}
                            </div>
                            {ot.colaboradores.length > 3 && (
                              <span className="text-[10px] font-bold text-slate-500">+{ot.colaboradores.length - 3}</span>
                            )}
                          </div>
                        )}

                        <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/60">
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
        <div className="glass-card rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-white/60 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Número OT</th>
                  <th className="px-4 py-3">Máquina / Equipo</th>
                  <th className="px-4 py-3">Problema / Pauta</th>
                  <th className="px-4 py-3">Operarios Asignados</th>
                  <th className="px-4 py-3 text-center">Estimación</th>
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
                      <p className="text-[11px] text-slate-400">{ot.maquina.codigo}</p>
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
                                  className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] text-[11px] font-bold"
                                  title={u ? `${u.nombre} ${u.apellido}` : 'Operario'}
                                >
                                  {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                                </span>
                              );
                            })}
                          </div>
                          <span className="text-[12px] font-semibold text-slate-600">
                            {ot.colaboradores.length === 1 && ot.colaboradores[0].usuario
                              ? `${ot.colaboradores[0].usuario.nombre} ${ot.colaboradores[0].usuario.apellido}`
                              : `${ot.colaboradores.length} operarios`}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">Sin asignar</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {ot.hora_termino ? (
                        <span className="text-[12px] font-bold text-[#0F434A] flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3" /> {ot.hora_termino}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                        ot.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                        ot.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                        'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'
                      }`}>
                        {ot.prioridad}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className="text-[12px] font-bold px-2 py-0.5 bg-white/60 text-slate-800 rounded-md border border-white/80">
                        {ot.estado.nombre}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-800">
                      ${ot.costo_total}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <button
                        onClick={() => {
                          setSelectedOT(ot);
                          setIsRefreshingOT(true);
                          api.getWorkOrder(ot.id).then(setSelectedOT).finally(() => setIsRefreshingOT(false));
                        }}
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

      {/* Work Order Detail Modal */}
      <WorkOrderDetailModal
        workOrder={selectedOT}
        onClose={() => setSelectedOT(null)}
        isRefreshing={isRefreshingOT}
        onViewFull={onViewFull}
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
          <div className="glass-modal rounded-xl max-w-md w-full p-6 shadow-2xl">
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

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Estimación de Tiempo
                  <span className="text-[11px] text-slate-500 font-normal ml-1">(Opcional)</span>
                </label>
                <input
                  type="text"
                  value={newEstimacion}
                  onChange={(e) => setNewEstimacion(e.target.value)}
                  placeholder="Ej: 2 horas, 30 min, 1h 45min"
                  className="w-full px-3 py-2 glass-input rounded-xl focus:outline-none text-[13px]"
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
                  <span className="text-[11px] text-slate-500 font-normal">Opcional</span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-36 overflow-y-auto p-2 bg-white/40 rounded-xl border border-white/60">
                  {allUsers.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic p-1 col-span-2">Cargando plantilla de operarios...</p>
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
                            <p className="text-[11px] text-slate-500 font-normal capitalize">{u.cargo || u.rol}</p>
                          </div>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {submitted && !isFormValid && (
                <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <div className="text-[12px]">
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
