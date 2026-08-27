import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Wrench,
  CheckSquare,
  Package,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  Camera,
  AlertTriangle,
  UserPlus,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { WorkOrder, SparePart, EstadoOT, User } from '../types';
import { api } from '../services/api';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
  onReload: () => void;
  isRefreshing?: boolean;
  onViewFull?: (otId: number) => void;
}

type TimelineEventType = 'creacion' | 'operario' | 'estado' | 'material' | 'checklist' | 'comentario' | 'finalizacion';

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrder,
  onClose,
  onReload,
  isRefreshing,
  onViewFull
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'operarios' | 'checklist' | 'materiales' | 'comentarios' | 'finalizar'>('general');
  const [timelineFilter, setTimelineFilter] = useState<TimelineEventType | null>(null);
  const [showUpdatedToast, setShowUpdatedToast] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Operators / Users state
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [selectedUserIdToAssign, setSelectedUserIdToAssign] = useState<number | ''>('');

  // New Checklist Item
  const [newChecklistText, setNewChecklistText] = useState('');

  // Material Request State
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [selectedSparePartId, setSelectedSparePartId] = useState<number | ''>('');
  const [materialQty, setMaterialQty] = useState(1);
  const [customMatName, setCustomMatName] = useState('');

  // New Comment State
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState('');
  const [commentTime, setCommentTime] = useState('0');

  // Helper: parse "HH:MM" string to total minutes
  const parseTimeToMinutes = (val: string): number => {
    if (!val || val === '0' || val === '0:00') return 0;
    const parts = val.split(':');
    if (parts.length === 2) {
      const hrs = parseInt(parts[0], 10) || 0;
      const mins = parseInt(parts[1], 10) || 0;
      return hrs * 60 + mins;
    }
    return parseInt(val, 10) || 0;
  };

  // Helper: format minutes to "HH:MM"
  const formatMinutesToTime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0:00';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  // Finalize Form State
  const [finalDowntimeMin, setFinalDowntimeMin] = useState(60);
  const [finalLaborCost, setFinalLaborCost] = useState(100);
  const [finalMessage, setFinalMessage] = useState('');
  const [finalPhotoUrl, setFinalPhotoUrl] = useState('');

  // Dynamic Statuses
  const [statuses, setStatuses] = useState<EstadoOT[]>([]);

  // Priority editing
  const [editingPriority, setEditingPriority] = useState(false);

  // Toast on refresh complete
  useEffect(() => {
    if (isRefreshing === false && workOrder) {
      setShowUpdatedToast(true);
      if (toastTimer.current) clearTimeout(toastTimer.current);
      toastTimer.current = setTimeout(() => setShowUpdatedToast(false), 2500);
    }
    return () => { if (toastTimer.current) clearTimeout(toastTimer.current); };
  }, [isRefreshing, workOrder]);

  useEffect(() => {
    if (workOrder) {
      api.getSpareParts().then(setSpareParts);
      api.getUsers().then(setAllUsers).catch(() => {});
      api.request<EstadoOT[]>('/estados-ot').then(setStatuses).catch(() => {});
    }
  }, [workOrder]);

  if (!workOrder) return null;

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserIdToAssign) return;
    try {
      await api.addCollaborator(workOrder.id, Number(selectedUserIdToAssign));
      setSelectedUserIdToAssign('');
      onReload();
    } catch (err: any) {
      alert(`Error al asignar operario: ${err.message}`);
    }
  };

  const handleRemoveOperator = async (collaboratorId: string | number) => {
    try {
      await api.removeCollaborator(workOrder.id, collaboratorId);
      onReload();
    } catch (err: any) {
      alert(`Error al remover operario: ${err.message}`);
    }
  };

  const handleToggleChecklist = async (itemId: string | number, currentCompleted: boolean | string) => {
    try {
      await api.toggleChecklistItem(workOrder.id, itemId, !currentCompleted);
      onReload();
    } catch (e: any) {
      alert(`Error al actualizar checklist: ${e.message}`);
    }
  };

  const handleAddChecklistItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    try {
      await api.addChecklistItem(workOrder.id, newChecklistText.trim());
      setNewChecklistText('');
      onReload();
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let name = customMatName;
      let unitCost = 0;
      let sparePartId: number | null = null;

      if (selectedSparePartId) {
        const found = spareParts.find(s => s.id === Number(selectedSparePartId));
        if (found) {
          name = found.nombre;
          unitCost = found.costo_unitario || 0;
          sparePartId = found.id;
        }
      }

      if (!name) return;

      await api.addMaterialRequest(workOrder.id, {
        spare_part_id: sparePartId,
        nombre: name,
        cantidad: Number(materialQty),
        unidad_medida: 'Unidad',
        costo_unitario: unitCost
      });

      setCustomMatName('');
      setSelectedSparePartId('');
      setMaterialQty(1);
      onReload();
    } catch (e: any) {
      alert(`Error al solicitar material: ${e.message}`);
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const timeMinutes = parseTimeToMinutes(commentTime);
      await api.addComment(workOrder.id, commentText.trim(), commentImage.trim() || null, timeMinutes > 0 ? timeMinutes : null);
      setCommentText('');
      setCommentImage('');
      setCommentTime('0');
      onReload();
    } catch (e: any) {
      alert(`Error al guardar comentario: ${e.message}`);
    }
  };

  const handleStatusChange = async (newStatusId: number) => {
    try {
      await api.changeWorkOrderStatus(workOrder.id, newStatusId);
      onReload();
    } catch (e: any) {
      alert(`Error al cambiar estado: ${e.message}`);
    }
  };

  const handlePriorityChange = async (newPriority: string) => {
    try {
      await api.request(`/ordenes-trabajo/${workOrder.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ prioridad: newPriority })
      });
      setEditingPriority(false);
      onReload();
    } catch (e: any) {
      alert(`Error al cambiar prioridad: ${e.message}`);
    }
  };

  const handleFinalizeWorkOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.finalizeWorkOrder(workOrder.id, {
        fecha_termino: new Date().toISOString(),
        hora_termino: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        mensaje_adicional: finalMessage || 'Mantenimiento completado satisfactoriamente.',
        foto_termino_url: finalPhotoUrl || null,
        genera_tiempo_inactivo: true,
        minutos_inactividad: Number(finalDowntimeMin),
        costo_mano_obra: Number(finalLaborCost)
      });
      onReload();
      onClose();
    } catch (e: any) {
      alert(`Error al finalizar OT: ${e.message}`);
    }
  };

  // Build unified timeline
  const buildTimeline = () => {
    const events: { tipo: TimelineEventType; fecha: string; contenido: React.ReactNode; color: string }[] = [];

    // OT creation
    events.push({
      tipo: 'creacion',
      fecha: workOrder.created_at,
      color: '#3D848C',
      contenido: (
        <div>
          <span className="font-bold text-sm">OT Creada</span>
          <p className="text-xs text-slate-500 mt-0.5">
            Por: {workOrder.generado_por ? `${workOrder.generado_por.nombre} ${workOrder.generado_por.apellido}` : workOrder.reportado_por_nombre || 'Mantis App'}
          </p>
          {workOrder.descripcion_problema_inicial && (
            <p className="text-xs text-slate-600 mt-1 italic">{workOrder.descripcion_problema_inicial}</p>
          )}
        </div>
      )
    });

    // Collaborators added
    (workOrder.colaboradores || []).forEach(c => {
      events.push({
        tipo: 'operario',
        fecha: c.created_at || workOrder.created_at,
        color: '#6366f1',
        contenido: (
          <div>
            <span className="font-bold text-sm">Operario Asignado</span>
            <p className="text-xs text-slate-500 mt-0.5">{c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : `Operario #${c.user_id}`}</p>
          </div>
        )
      });
    });

    // Status changes
    (workOrder.historial_estados || []).forEach(h => {
      events.push({
        tipo: 'estado',
        fecha: h.created_at,
        color: h.estado?.color || '#8b5cf6',
        contenido: (
          <div>
            <span className="font-bold text-sm">Estado → {h.estado?.nombre}</span>
            {h.cambiado_por && (
              <p className="text-xs text-slate-500 mt-0.5">Por: {h.cambiado_por.nombre} {h.cambiado_por.apellido}</p>
            )}
          </div>
        )
      });
    });

    // Material requests
    (workOrder.solicitudes_material || []).forEach(m => {
      events.push({
        tipo: 'material',
        fecha: m.created_at || workOrder.created_at,
        color: '#f59e0b',
        contenido: (
          <div>
            <span className="font-bold text-sm">Material: {m.nombre}</span>
            <p className="text-xs text-slate-500 mt-0.5">Cant: {m.cantidad} {m.unidad_medida} · ${((m.costo_unitario || 0) * m.cantidad).toFixed(2)}</p>
          </div>
        )
      });
    });

    // Checklist completions
    (workOrder.checklist_items || []).filter(c => c.completado && c.completado_en).forEach(c => {
      events.push({
        tipo: 'checklist',
        fecha: c.completado_en!,
        color: '#10b981',
        contenido: (
          <div>
            <span className="font-bold text-sm">✓ {c.texto}</span>
            <p className="text-xs text-slate-500 mt-0.5">Completado</p>
          </div>
        )
      });
    });

    // Comments
    (workOrder.comentarios || []).forEach(c => {
      events.push({
        tipo: 'comentario',
        fecha: c.created_at,
        color: '#0ea5e9',
        contenido: (
          <div>
            <span className="font-bold text-sm">{c.usuario?.nombre || 'Usuario'}</span>
            <p className="text-xs text-slate-600 mt-0.5">{c.mensaje.length > 120 ? c.mensaje.substring(0, 120) + '...' : c.mensaje}</p>
          </div>
        )
      });
    });

    // Finalization
    if (workOrder.fecha_termino) {
      events.push({
        tipo: 'finalizacion',
        fecha: workOrder.fecha_termino,
        color: '#065f46',
        contenido: (
          <div>
            <span className="font-bold text-sm">OT Finalizada</span>
            <p className="text-xs text-slate-500 mt-0.5">
              Downtime: {workOrder.minutos_inactividad || 0} min · Costo: ${Number(workOrder.costo_total || 0).toFixed(2)}
            </p>
          </div>
        )
      });
    }

    return events.sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  };

  const timelineEvents = buildTimeline();
  const filteredEvents = timelineFilter ? timelineEvents.filter(e => e.tipo === timelineFilter) : timelineEvents;

  const creatorName = workOrder.generado_por
    ? `${workOrder.generado_por.nombre} ${workOrder.generado_por.apellido}`
    : workOrder.reportado_por_nombre || 'Mantis App';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="glass-modal rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-800">{workOrder.numero}</span>
              <span className={`text-[12px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                workOrder.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                workOrder.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'
              }`}>
                Prioridad {workOrder.prioridad}
              </span>
              <span className="text-[12px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-slate-700 border border-white/80">
                {workOrder.estado.nombre}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Equipo: <strong className="text-[#0F434A]">{workOrder.maquina.nombre}</strong> ({workOrder.maquina.codigo})
            </p>
          </div>
          <div className="flex items-center gap-2">
            {onViewFull && (
              <button
                onClick={() => { onViewFull(workOrder.id); onClose(); }}
                className="px-3 py-1.5 text-[12px] font-bold text-[#0F434A] bg-[#D9EDEE] hover:bg-[#A9CDD0] border border-[#3D848C]/60 rounded-xl transition-all cursor-pointer"
              >
                Ver OT completa ↗
              </button>
            )}
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Refreshing spinner */}
        {isRefreshing && (
          <div className="flex items-center justify-center gap-2 py-2 text-[12px] text-[#165B62] font-medium bg-[#D9EDEE]/40 rounded-xl mb-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Cargando datos completos...</span>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-white/60 py-2 text-[13px] font-semibold overflow-x-auto">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'general' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> General
          </button>

          <button
            onClick={() => setActiveTab('operarios')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'operarios' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Users className="w-3.5 h-3.5" /> Operarios ({(workOrder.colaboradores || []).length})
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checklist' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> Checklist ({(workOrder.checklist_items || []).filter(c => c.completado).length}/{(workOrder.checklist_items || []).length})
          </button>

          <button
            onClick={() => setActiveTab('materiales')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'materiales' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Repuestos ({(workOrder.solicitudes_material || []).length})
          </button>

          <button
            onClick={() => setActiveTab('comentarios')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comentarios' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Comentarios ({(workOrder.comentarios || []).length})
          </button>

          {!workOrder.estado.es_estado_final && (
            <button
              onClick={() => setActiveTab('finalizar')}
              className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
                activeTab === 'finalizar' ? 'bg-[#3D848C] text-slate-900 font-bold' : 'bg-[#D9EDEE]/80 text-[#0F434A] hover:bg-[#D9EDEE]'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" /> Cierre & Finalizar
            </button>
          )}
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* TAB 1: GENERAL */}
          {activeTab === 'general' && (
            <div className="space-y-4 text-[13px]">
              
              {/* Problem Statement */}
              <div className="p-3 bg-white/40 rounded-2xl border border-white/60">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[12px] mb-1">Descripción Inicial del Problema</p>
                <p className="text-slate-800 text-[13px] leading-relaxed">{workOrder.descripcion_problema_inicial || 'Sin descripción detallada'}</p>
                {workOrder.foto_inicial_url && (
                  <img src={workOrder.foto_inicial_url} alt="Evidencia" className="mt-2 rounded-xl max-h-48 object-cover border border-white/60" />
                )}
              </div>

              {/* Creator Info */}
              <div className="p-3 bg-white/50 rounded-2xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase mb-1">Reportado Por</p>
                <p className="font-semibold text-slate-800 text-[13px]">{creatorName}</p>
              </div>

              {/* Priority editable */}
              <div className="p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Prioridad</p>
                  <button
                    onClick={() => setEditingPriority(!editingPriority)}
                    className="text-[12px] font-bold text-[#0F434A] hover:underline cursor-pointer"
                  >
                    {editingPriority ? 'Cancelar' : 'Cambiar'}
                  </button>
                </div>
                {editingPriority ? (
                  <div className="flex items-center gap-2 mt-2">
                    {['baja', 'media', 'alta', 'critica'].map(p => (
                      <button
                        key={p}
                        onClick={() => handlePriorityChange(p)}
                        className={`px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer ${
                          workOrder.prioridad === p
                            ? p === 'critica' ? 'bg-rose-500 text-white' : p === 'alta' ? 'bg-amber-500 text-white' : 'bg-[#3D848C] text-white'
                            : 'bg-white/60 text-slate-700 border border-white/80 hover:bg-white'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="font-semibold text-slate-800 text-[13px] capitalize">{workOrder.prioridad}</p>
                )}
              </div>

              {/* Quick Assigned Operarios Summary */}
              <div className="p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#165B62]" /> Operarios Asignados ({(workOrder.colaboradores || []).length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('operarios')}
                    className="text-[13px] font-bold text-[#0F434A] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    + Asignar / Gestionar &rarr;
                  </button>
                </div>

                {(!workOrder.colaboradores || workOrder.colaboradores.length === 0) ? (
                  <p className="text-slate-400 italic text-[13px]">Sin operarios asignados a esta orden aún.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {workOrder.colaboradores.map((collab, i) => {
                      const u = collab.usuario;
                      return (
                        <div key={collab.id || i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#D9EDEE]/80 border border-[#3D848C]/60 rounded-xl text-slate-800">
                          <div className="w-6 h-6 rounded-full bg-[#0A2E33] text-white font-bold flex items-center justify-center text-[12px]">
                            {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                          </div>
                          <div>
                            <p className="font-bold text-[13px] text-slate-900 leading-tight">{u ? `${u.nombre} ${u.apellido}` : 'Operario'}</p>
                            <p className="text-[12px] text-slate-500 capitalize">{u?.cargo || u?.rol || 'Técnico'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Changer Bar - Dynamic */}
              <div className="p-3 bg-[#D9EDEE]/60 rounded-2xl border border-[#3D848C]/40">
                <p className="font-bold text-slate-800 mb-2">Cambiar Estado de la Orden:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {statuses.sort((a, b) => a.orden - b.orden).map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusChange(st.id)}
                      className="px-3 py-1.5 rounded-xl text-[13px] font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      style={{
                        backgroundColor: workOrder.estado.id === st.id ? (st.color || '#3D848C') : '#ffffff',
                        color: workOrder.estado.id === st.id ? '#ffffff' : '#1e293b',
                        borderWidth: '2px',
                        borderColor: st.color || '#3D848C',
                      }}
                    >
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: st.color || '#3D848C' }} />
                      {st.nombre}
                    </button>
                  ))}
                </div>
              </div>

              {/* OT Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Estimación</p>
                  <p className="font-bold text-[#165B62] text-[13px] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {workOrder.hora_termino || 'No definida'}
                  </p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Categoría</p>
                  <p className="font-semibold text-slate-800 text-[13px]">{workOrder.categoria_mantenimiento?.nombre || 'General'}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Contacto</p>
                  <p className="font-semibold text-slate-800 text-[13px]">{workOrder.reportado_por_contacto || 'N/A'}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Costo Mano de Obra</p>
                  <p className="font-bold text-[#0F434A] text-[13px]">${workOrder.costo_mano_obra}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Costo Total Estimado</p>
                  <p className="font-bold text-[#0F434A] text-[13px]">${workOrder.costo_total}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Downtime Generado</p>
                  <p className="font-bold text-rose-700 text-[13px]">{workOrder.minutos_inactividad} minutos</p>
                </div>
              </div>

              {/* Full Activity Timeline */}
              <div className="pt-2">
                <p className="font-bold text-slate-700 text-[13px] mb-2">Historial Completo de Actividad</p>

                {/* Timeline filters */}
                <div className="flex items-center gap-1.5 flex-wrap mb-3">
                  <button onClick={() => setTimelineFilter(null)} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer ${timelineFilter === null ? 'bg-[#3D848C] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}>Todos</button>
                  <button onClick={() => setTimelineFilter('creacion')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'creacion' ? 'bg-[#3D848C] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-[#3D848C] inline-block" /> Creación</button>
                  <button onClick={() => setTimelineFilter('operario')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'operario' ? 'bg-indigo-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Operarios</button>
                  <button onClick={() => setTimelineFilter('estado')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'estado' ? 'bg-violet-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Estados</button>
                  <button onClick={() => setTimelineFilter('material')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'material' ? 'bg-amber-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Materiales</button>
                  <button onClick={() => setTimelineFilter('checklist')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'checklist' ? 'bg-emerald-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Checklist</button>
                  <button onClick={() => setTimelineFilter('comentario')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'comentario' ? 'bg-sky-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Comentarios</button>
                  {workOrder.fecha_termino && (
                    <button onClick={() => setTimelineFilter('finalizacion')} className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'finalizacion' ? 'bg-green-800 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-green-800 inline-block" /> Finalización</button>
                  )}
                </div>

                {/* Timeline */}
                <div className="relative pl-6 space-y-3 max-h-80 overflow-y-auto">
                  <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-slate-200" />
                  {filteredEvents.length === 0 ? (
                    <p className="text-xs text-slate-400 italic">No hay eventos de este tipo en el historial.</p>
                  ) : (
                    filteredEvents.map((event, i) => (
                      <div key={i} className="relative">
                        <div className="absolute -left-[18px] top-1.5 w-3 h-3 rounded-full border-2 border-white shadow-xs" style={{ backgroundColor: event.color }} />
                        <div className="p-3 bg-white/40 rounded-2xl border border-white/60">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {new Date(event.fecha).toLocaleString('es-ES')}
                            </span>
                          </div>
                          {event.contenido}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          )}

          {/* TAB: OPERARIOS */}
          {activeTab === 'operarios' && (
            <div className="space-y-4 text-[13px]">
              
              <form onSubmit={handleAddOperator} className="p-3.5 bg-white/50 rounded-2xl border border-white/60 space-y-3">
                <p className="font-bold text-slate-800 text-[13px] flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#165B62]" /> Asignar Nuevo Operario o Técnico a la OT:
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedUserIdToAssign}
                    onChange={(e) => setSelectedUserIdToAssign(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-3 py-2 glass-input rounded-xl text-[13px] focus:outline-none"
                  >
                    <option value="">-- Seleccionar personal de plantilla --</option>
                    {allUsers
                      .filter(u => !(workOrder.colaboradores || []).some(c => Number(c.user_id) === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} {u.apellido} - {u.cargo || u.rol} ({u.email})
                        </option>
                      ))}
                  </select>
                  <button
                    type="submit"
                    disabled={!selectedUserIdToAssign}
                    className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] disabled:opacity-50 text-slate-900 hover:text-white font-bold rounded-xl text-[13px] transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" /> Asignar Operario
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <p className="font-bold text-slate-700 text-[13px]">
                  Equipo de Operarios Asignados ({(workOrder.colaboradores || []).length}):
                </p>
                {(!workOrder.colaboradores || workOrder.colaboradores.length === 0) ? (
                  <div className="p-6 text-center text-slate-400 italic bg-white/30 rounded-2xl border border-dashed border-white/60">
                    No hay operarios ni técnicos asignados a esta Orden de Trabajo. Asigna al menos uno arriba.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {workOrder.colaboradores.map((collab) => {
                      const u = collab.usuario;
                      return (
                        <div key={collab.id} className="p-3 bg-white/60 rounded-2xl border border-white/80 shadow-xs flex items-start justify-between gap-3">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] font-bold flex items-center justify-center text-[13px] shrink-0 shadow-2xs mt-0.5">
                              {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                            </div>
                            <div className="space-y-1">
                              <div>
                                <p className="font-extrabold text-slate-900 text-[13px]">
                                  {u ? `${u.nombre} ${u.apellido}` : `Operario #${collab.user_id}`}
                                </p>
                                <p className="text-[12px] text-[#0F434A] font-bold capitalize">
                                  {u?.cargo || u?.rol || 'Técnico de Campo'}
                                </p>
                              </div>
                              {u?.email && (
                                <p className="text-[12px] text-slate-500 font-medium">✉ {u.email}</p>
                              )}
                              {u?.especialidades && u.especialidades.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {u.especialidades.map(esp => (
                                    <span key={esp.id} className="text-[11px] px-1.5 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-md font-semibold">
                                      {esp.nombre}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveOperator(collab.user_id)}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all cursor-pointer"
                            title="Remover operario de la OT"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4 text-[13px]">
              <div className="space-y-2">
                {(workOrder.checklist_items || []).map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleToggleChecklist(item.id, item.completado)}
                    className={`p-3 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${
                      item.completado ? 'bg-[#D9EDEE]/80 border-[#3D848C] text-[#0F434A]' : 'bg-white/40 border-white/60 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={Boolean(item.completado)}
                        onChange={() => {}}
                        className="w-4 h-4 text-[#165B62] rounded focus:ring-0"
                      />
                      <span className={`font-medium ${item.completado ? 'line-through text-[#0F434A]' : ''}`}>
                        {item.texto}
                      </span>
                    </div>
                    {item.completado_en && (
                      <span className="text-[12px] text-[#0F434A] font-medium">
                        ✓ {new Date(item.completado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Agregar nueva tarea o verificación a la pauta..."
                  className="flex-1 px-3 py-2 glass-input rounded-xl text-[13px] focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-[13px] cursor-pointer transition-all"
                >
                  Agregar Item
                </button>
              </form>
            </div>
          )}

          {/* TAB: MATERIALES */}
          {activeTab === 'materiales' && (
            <div className="space-y-4 text-[13px]">
              <form onSubmit={handleAddMaterial} className="p-3 bg-white/40 rounded-2xl border border-white/60 space-y-3">
                <p className="font-bold text-slate-800 text-[13px]">Solicitar Repuesto o Insumo desde Inventario:</p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1">Seleccionar Insumo de Bodega</label>
                    <select
                      value={selectedSparePartId}
                      onChange={(e) => setSelectedSparePartId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-[13px] focus:outline-none"
                    >
                      <option value="">-- Seleccionar de catálogo --</option>
                      {spareParts.map(s => (
                        <option key={s.id} value={s.id}>
                          {s.codigo} - {s.nombre} (Disp: {s.stock_actual} {s.unidad_medida})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={materialQty}
                      onChange={(e) => setMaterialQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-[13px] text-center font-bold"
                    />
                  </div>
                </div>
                {!selectedSparePartId && (
                  <div>
                    <label className="block text-[13px] font-semibold text-slate-600 mb-1">O escribe insumo libre no catalogado</label>
                    <input
                      type="text"
                      value={customMatName}
                      onChange={(e) => setCustomMatName(e.target.value)}
                      placeholder="Ej: Silicona RTV Alta Temp 80g"
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-[13px]"
                    />
                  </div>
                )}
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-[13px] cursor-pointer transition-all"
                >
                  Confirmar Solicitud de Material
                </button>
              </form>

              <div className="space-y-2">
                <p className="font-bold text-slate-800 text-[13px]">Insumos Solicitados y Consumidos:</p>
                {(workOrder.solicitudes_material || []).length === 0 ? (
                  <p className="text-slate-400 text-[13px] italic">No hay repuestos asociados a esta orden.</p>
                ) : (
                  (workOrder.solicitudes_material || []).map(m => (
                    <div key={m.id} className="p-3 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800 text-[13px]">{m.nombre}</p>
                        <p className="text-[13px] text-slate-500">Cantidad: {m.cantidad} {m.unidad_medida}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-[#0F434A] text-[13px]">${((m.costo_total || ((m.costo_unitario || 0) * m.cantidad))).toFixed(2)}</p>
                        <p className="text-[12px] text-slate-400">${(m.costo_unitario || 0).toFixed(2)} c/u</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB: COMENTARIOS */}
          {activeTab === 'comentarios' && (
            <div className="space-y-4 text-[13px]">
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {(workOrder.comentarios || []).length === 0 ? (
                  <p className="text-slate-400 text-[13px] italic text-center py-4">Sin comentarios de mantenimiento aún.</p>
                ) : (
                  (workOrder.comentarios || []).map(c => (
                    <div key={c.id} className="p-3 bg-white/40 rounded-2xl border border-white/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800 text-[13px]">{c.usuario?.nombre || 'Técnico'}</span>
                        <div className="flex items-center gap-2">
                          {c.tiempo_utilizado != null && c.tiempo_utilizado > 0 && (
                            <span className="text-[11px] font-bold text-[#165B62] bg-[#D9EDEE] px-2 py-0.5 rounded-full flex items-center gap-1">
                              <Clock className="w-3 h-3" /> {formatMinutesToTime(c.tiempo_utilizado)}
                            </span>
                          )}
                          <span className="text-[12px] text-slate-400">{new Date(c.created_at).toLocaleString('es-ES')}</span>
                        </div>
                      </div>
                      <p className="text-slate-700 leading-relaxed text-[13px]">{c.mensaje}</p>
                      {c.imagen_url && (
                        <img src={c.imagen_url} alt="Evidencia" className="mt-2 rounded-xl max-h-40 object-cover border border-white/60" />
                      )}
                    </div>
                  ))
                )}
              </div>
              <form onSubmit={handleAddComment} className="pt-2 space-y-2 border-t border-white/60">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe una observación, avance de reparación o instrucción..."
                  className="w-full px-3 py-2 glass-input rounded-xl text-[13px] focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={commentImage}
                    onChange={(e) => setCommentImage(e.target.value)}
                    placeholder="URL de foto o evidencia (opcional)"
                    className="flex-1 px-3 py-1.5 glass-input rounded-xl text-[13px]"
                  />
                  <div className="flex items-center gap-1 px-2 py-1.5 glass-input rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-[#165B62]" />
                    <input
                      type="text"
                      value={commentTime}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9:]/g, '');
                        if (/^\d{1,2}:?\d{0,2}$/.test(val) || val === '') setCommentTime(val);
                      }}
                      placeholder="0:00"
                      className="w-16 bg-transparent text-[13px] font-bold focus:outline-none text-center"
                      title="Tiempo trabajado (horas:minutos)"
                    />
                    <span className="text-[11px] text-slate-400">horas</span>
                  </div>
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-[13px] shrink-0 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Comentar
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: FINALIZAR */}
          {activeTab === 'finalizar' && (
            <form onSubmit={handleFinalizeWorkOrder} className="space-y-3 text-[13px] bg-[#D9EDEE]/60 p-4 rounded-2xl border border-[#3D848C]/60">
              <h4 className="font-bold text-slate-800 text-[14px] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#165B62]" />
                Declaración de Término de Mantenimiento
              </h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Downtime / Tiempo de Inactividad (Minutos)</label>
                  <input
                    type="number"
                    value={finalDowntimeMin}
                    onChange={(e) => setFinalDowntimeMin(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Mano de Obra ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={finalLaborCost}
                    onChange={(e) => setFinalLaborCost(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-bold"
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Mensaje Adicional de Entrega a Producción</label>
                <textarea
                  rows={2}
                  value={finalMessage}
                  onChange={(e) => setFinalMessage(e.target.value)}
                  placeholder="Indica pruebas de calidad realizadas, recomendaciones o firma de entrega..."
                  className="w-full px-3 py-1.5 glass-input rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Foto de Término / Trabajo Finalizado (URL)</label>
                <input
                  type="url"
                  value={finalPhotoUrl}
                  onChange={(e) => setFinalPhotoUrl(e.target.value)}
                  placeholder="https://ejemplo.com/foto_fin.jpg"
                  className="w-full px-3 py-1.5 glass-input rounded-xl"
                />
              </div>
              <div className="pt-2">
                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-extrabold rounded-xl shadow-xs text-[13px] transition-colors cursor-pointer"
                >
                  CERRAR Y FINALIZAR ORDEN DE TRABAJO
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Toast */}
        {showUpdatedToast && (
          <div className="absolute bottom-16 left-1/2 -translate-x-1/2 flex items-center gap-2 px-4 py-2 bg-[#165B62] text-white rounded-xl shadow-xl text-[13px] font-semibold animate-[fadeInUp_0.3s_ease-out] pointer-events-none z-50">
            <CheckCircle2 className="w-4 h-4" />
            Datos actualizados ✓
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-white/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-[13px] font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
