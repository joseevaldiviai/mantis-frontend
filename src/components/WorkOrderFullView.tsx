import React, { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Wrench,
  CheckSquare,
  Package,
  Users,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Send,
  AlertTriangle,
  UserPlus,
  RefreshCw,
  Shield,
  ChevronDown
} from 'lucide-react';
import { WorkOrder, SparePart, EstadoOT, User, Priority } from '../types';
import { api } from '../services/api';

interface WorkOrderFullViewProps {
  workOrderId: number;
  onBack: () => void;
}

export const WorkOrderFullView: React.FC<WorkOrderFullViewProps> = ({ workOrderId, onBack }) => {
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'general' | 'operarios' | 'checklist' | 'materiales' | 'comentarios'>('general');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['general']));

  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Users & Parts
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [statuses, setStatuses] = useState<EstadoOT[]>([]);

  // Form states
  const [selectedUserId, setSelectedUserId] = useState<number | ''>('');
  const [newChecklistText, setNewChecklistText] = useState('');
  const [selectedSparePartId, setSelectedSparePartId] = useState<number | ''>('');
  const [materialQty, setMaterialQty] = useState(1);

  // Timeline filter
  type TimelineEventType = 'creacion' | 'operario' | 'estado' | 'material' | 'checklist' | 'comentario' | 'finalizacion';
  const [timelineFilter, setTimelineFilter] = useState<TimelineEventType | null>(null);

  const hasTimelineEvents = workOrder ? (
    (workOrder.colaboradores || []).length > 0 ||
    (workOrder.historial_estados || []).length > 0 ||
    (workOrder.solicitudes_material || []).length > 0 ||
    (workOrder.checklist_items || []).some(c => c.completado && c.completado_en) ||
    (workOrder.comentarios || []).length > 0 ||
    !!workOrder.fecha_termino
  ) : false;

  const filteredEventsEmpty = timelineFilter !== null && workOrder && (
    (timelineFilter === 'operario' && (workOrder.colaboradores || []).length === 0) ||
    (timelineFilter === 'estado' && (workOrder.historial_estados || []).length === 0) ||
    (timelineFilter === 'material' && (workOrder.solicitudes_material || []).length === 0) ||
    (timelineFilter === 'checklist' && (workOrder.checklist_items || []).filter(c => c.completado && c.completado_en).length === 0) ||
    (timelineFilter === 'comentario' && (workOrder.comentarios || []).length === 0) ||
    (timelineFilter === 'finalizacion' && !workOrder.fecha_termino)
  );
  const [customMatName, setCustomMatName] = useState('');
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
  const [editingPriority, setEditingPriority] = useState(false);

  // Finalize form
  const [showFinalize, setShowFinalize] = useState(false);
  const [finalDowntimeMin, setFinalDowntimeMin] = useState(60);
  const [finalLaborCost, setFinalLaborCost] = useState(100);
  const [finalMessage, setFinalMessage] = useState('');
  const [finalPhotoUrl, setFinalPhotoUrl] = useState('');

  const loadOT = async () => {
    setLoading(true);
    try {
      const data = await api.getWorkOrder(workOrderId);
      setWorkOrder(data);
    } catch {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOT();
    api.getUsers().then(setAllUsers).catch(() => {});
    api.getSpareParts().then(setSpareParts).catch(() => {});
    api.request<EstadoOT[]>('/estados-ot').then(setStatuses).catch(() => {});
  }, [workOrderId]);

  if (loading) {
    return (
      <div className="py-20 text-center">
        <RefreshCw className="w-8 h-8 text-[#165B62] animate-spin mx-auto mb-3" />
        <p className="text-sm font-medium text-slate-600">Cargando orden de trabajo...</p>
      </div>
    );
  }

  if (!workOrder) {
    return (
      <div className="py-20 text-center">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto mb-3" />
        <p className="text-sm font-bold text-slate-700">No se encontró la orden de trabajo</p>
        <button onClick={onBack} className="mt-3 text-xs text-[#165B62] underline cursor-pointer">← Volver a Órdenes</button>
      </div>
    );
  }

  const handleStatusChange = async (estadoId: number) => {
    try {
      await api.changeWorkOrderStatus(workOrder.id, estadoId);
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handlePriorityChange = async (p: Priority) => {
    try {
      await api.request(`/ordenes-trabajo/${workOrder.id}`, { method: 'PATCH', body: JSON.stringify({ prioridad: p }) });
      setEditingPriority(false);
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleAddOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId) return;
    try {
      await api.addCollaborator(workOrder.id, Number(selectedUserId));
      setSelectedUserId('');
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleRemoveOperator = async (collabId: string | number) => {
    try {
      await api.removeCollaborator(workOrder.id, collabId);
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleToggleChecklist = async (itemId: string | number, current: boolean | string) => {
    try {
      await api.toggleChecklistItem(workOrder.id, itemId, !current);
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleAddChecklist = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newChecklistText.trim()) return;
    try {
      await api.addChecklistItem(workOrder.id, newChecklistText.trim());
      setNewChecklistText('');
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleAddMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    let name = customMatName;
    let unitCost = 0;
    let sparePartId: number | null = null;
    if (selectedSparePartId) {
      const found = spareParts.find(s => s.id === Number(selectedSparePartId));
      if (found) { name = found.nombre; unitCost = found.costo_unitario || 0; sparePartId = found.id; }
    }
    if (!name) return;
    try {
      await api.addMaterialRequest(workOrder.id, { spare_part_id: sparePartId, nombre: name, cantidad: Number(materialQty), unidad_medida: 'Unidad', costo_unitario: unitCost });
      setCustomMatName(''); setSelectedSparePartId(''); setMaterialQty(1);
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    try {
      const timeMinutes = parseTimeToMinutes(commentTime);
      await api.addComment(workOrder.id, commentText.trim(), commentImage.trim() || null, timeMinutes > 0 ? timeMinutes : null);
      setCommentText(''); setCommentImage(''); setCommentTime('0');
      loadOT();
    } catch (e: any) { alert(`Error: ${e.message}`); }
  };

  const handleFinalize = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      // Find the final status to change to
      const finalStatus = statuses.find(s => s.es_estado_final);
      if (finalStatus && workOrder.estado?.id !== finalStatus.id) {
        await api.changeWorkOrderStatus(workOrder.id, finalStatus.id);
      }
      await api.finalizeWorkOrder(workOrder.id, {
        fecha_termino: new Date().toISOString(),
        hora_termino: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
        mensaje_adicional: finalMessage || 'Mantenimiento completado satisfactoriamente.',
        foto_termino_url: finalPhotoUrl || null,
        genera_tiempo_inactivo: true,
        minutos_inactividad: Number(finalDowntimeMin),
        costo_mano_obra: Number(finalLaborCost)
      });
      setShowFinalize(false);
      loadOT();
    } catch (e: any) {
      alert(`Error al finalizar OT: ${e.message}`);
    }
  };

  const tabs = [
    { id: 'general' as const, label: 'General', icon: Wrench },
    { id: 'operarios' as const, label: `Operarios (${(workOrder.colaboradores || []).length})`, icon: Users },
    { id: 'checklist' as const, label: `Checklist (${(workOrder.checklist_items || []).filter(c => c.completado).length}/${(workOrder.checklist_items || []).length})`, icon: CheckSquare },
    { id: 'materiales' as const, label: `Repuestos (${(workOrder.solicitudes_material || []).length})`, icon: Package },
    { id: 'comentarios' as const, label: `Comentarios (${(workOrder.comentarios || []).length})`, icon: MessageSquare },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-panel p-5 rounded-xl">
        <div className="flex items-center gap-3 mb-3">
          <button onClick={onBack} className="p-2 hover:bg-white/60 rounded-xl transition-colors cursor-pointer" title="Volver a Órdenes">
            <ArrowLeft className="w-5 h-5 text-slate-600" />
          </button>
          <div className="flex-1">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-800">{workOrder.numero}</h1>
              <span className={`text-[12px] font-bold px-2.5 py-1 rounded-full border uppercase ${workOrder.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' : workOrder.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' : 'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'}`}>
                {workOrder.prioridad}
              </span>
              <span className="text-[12px] font-bold px-2.5 py-1 rounded-full border text-white" style={{ backgroundColor: workOrder.estado?.color || '#6B7280' }}>
                {workOrder.estado?.nombre}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-1">
              <strong>{workOrder.maquina.nombre}</strong> ({workOrder.maquina.codigo})
              {workOrder.maquina.area && ` · Área: ${workOrder.maquina.area}`}
            </p>
          </div>
        </div>

        {/* Status Bar */}
        <div className="p-3 bg-[#D9EDEE]/40 rounded-lg border border-[#3D848C]/30">
          <p className="font-bold text-slate-800 text-xs mb-2">Estado:</p>
          <div className="grid grid-cols-2 sm:flex sm:items-center sm:gap-2 sm:flex-wrap gap-2">
            {statuses.sort((a, b) => a.orden - b.orden).map(st => (
              <button
                key={st.id}
                onClick={() => handleStatusChange(st.id)}
                className="px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={{
                  backgroundColor: workOrder.estado?.id === st.id ? (st.color || '#3D848C') : 'rgba(255,255,255,0.6)',
                  color: workOrder.estado?.id === st.id ? '#fff' : '#334155',
                  border: workOrder.estado?.id === st.id ? `1px solid ${st.color || '#3D848C'}` : '1px solid rgba(255,255,255,0.8)'
                }}
              >
                {st.nombre}
              </button>
            ))}
            <button
              onClick={() => setShowFinalize(!showFinalize)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer bg-[#3D848C] text-slate-900 hover:bg-[#165B62] hover:text-white ml-auto"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Finalizar OT
            </button>
          </div>
        </div>
      </div>

      {/* Finalize Form */}
      {showFinalize && (
        <form onSubmit={handleFinalize} className="glass-panel p-5 rounded-xl space-y-4 border-2 border-[#3D848C]/40">
          <h3 className="font-bold text-sm text-slate-800 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[#165B62]" /> Finalizar Orden de Trabajo
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Tiempo de Inactividad (minutos)</label>
              <input type="number" value={finalDowntimeMin} onChange={e => setFinalDowntimeMin(parseInt(e.target.value) || 0)} className="w-full px-3 py-2 glass-input rounded-xl text-sm font-bold" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-slate-700 mb-1">Costo Mano de Obra ($)</label>
              <input type="number" step="0.01" value={finalLaborCost} onChange={e => setFinalLaborCost(parseFloat(e.target.value) || 0)} className="w-full px-3 py-2 glass-input rounded-xl text-sm font-bold" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Mensaje de Entrega</label>
            <textarea rows={2} value={finalMessage} onChange={e => setFinalMessage(e.target.value)} placeholder="Indica pruebas realizadas, recomendaciones..." className="w-full px-3 py-2 glass-input rounded-xl text-sm" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-slate-700 mb-1">Foto de Término (URL)</label>
            <input type="url" value={finalPhotoUrl} onChange={e => setFinalPhotoUrl(e.target.value)} placeholder="https://ejemplo.com/foto.jpg" className="w-full px-3 py-2 glass-input rounded-xl text-sm" />
          </div>
          <div className="flex items-center gap-2 pt-2">
            <button type="submit" className="flex-1 py-2.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-extrabold rounded-xl text-sm transition-colors cursor-pointer">
              CERRAR Y FINALIZAR ORDEN
            </button>
            <button type="button" onClick={() => setShowFinalize(false)} className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer">
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Tabs - Desktop */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab.id ? 'bg-[#3D848C] text-slate-900 font-bold shadow-sm border border-white/80' : 'text-slate-600 bg-white/40 hover:bg-white/70 border border-white/40'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Accordion - Mobile */}
      <div className="md:hidden space-y-3">
        {/* General */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <button onClick={() => toggleSection('general')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Wrench className="w-4 h-4 text-[#165B62]" /> General</span>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('general') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('general') && (
            <div className="px-5 pb-5">
              {/* Description */}
              <div className="p-4 bg-white/40 rounded-lg border border-white/60 mb-4">
                <p className="text-[12px] text-slate-500 font-bold uppercase mb-1">Descripción del Problema</p>
                <p className="text-sm text-slate-800 leading-relaxed">{workOrder.descripcion_problema_inicial || 'Sin descripción'}</p>
                {workOrder.foto_inicial_url && <img src={workOrder.foto_inicial_url} alt="Evidencia" className="mt-3 rounded-xl max-h-64 object-cover border border-white/60" />}
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Estimación</p>
                  <p className="font-bold text-[#165B62] text-sm flex items-center gap-1.5"><Clock className="w-4 h-4" />{workOrder.hora_termino || 'No definida'}</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Categoría</p>
                  <p className="font-semibold text-slate-800 text-sm">{workOrder.categoria_mantenimiento?.nombre || 'General'}</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Reportado Por</p>
                  <p className="font-semibold text-slate-800 text-sm">{workOrder.generado_por ? `${workOrder.generado_por.nombre} ${workOrder.generado_por.apellido}` : workOrder.reportado_por_nombre || 'Mantis App'}</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[12px] text-slate-400 font-bold uppercase">Prioridad</p>
                  {editingPriority ? (
                    <div className="flex items-center gap-1 flex-wrap">
                      {(['baja', 'media', 'alta', 'critica'] as Priority[]).map(p => (
                        <button key={p} onClick={() => handlePriorityChange(p)} className={`px-2 py-0.5 rounded-lg text-[12px] font-bold capitalize cursor-pointer ${workOrder.prioridad === p ? 'bg-[#3D848C] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}>{p}</button>
                      ))}
                    </div>
                  ) : (
                    <p className="font-bold text-sm cursor-pointer hover:underline" onClick={() => setEditingPriority(true)} title="Clic para cambiar">{workOrder.prioridad} ✎</p>
                  )}
                </div>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase mb-1">Costo Total</p>
                <p className="font-bold text-[#0F434A] text-sm">${workOrder.costo_total}</p>
              </div>
            </div>
          )}
        </div>

        {/* Operarios */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <button onClick={() => toggleSection('operarios')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Users className="w-4 h-4 text-[#165B62]" /> Operarios ({(workOrder.colaboradores || []).length})</span>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('operarios') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('operarios') && (
            <div className="px-5 pb-5">
              <form onSubmit={handleAddOperator} className="p-4 bg-white/50 rounded-lg border border-white/60 space-y-3 mb-4">
                <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-[#165B62]" /> Asignar Operario</p>
                <div className="flex gap-2">
                  <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : '')} className="flex-1 px-3 py-2 glass-input rounded-xl text-xs focus:outline-none">
                    <option value="">-- Seleccionar --</option>
                    {allUsers.filter(u => !(workOrder.colaboradores || []).some(c => Number(c.user_id) === u.id)).map(u => (
                      <option key={u.id} value={u.id}>{u.nombre} {u.apellido} - {u.cargo || u.rol}</option>
                    ))}
                  </select>
                  <button type="submit" disabled={!selectedUserId} className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] disabled:opacity-50 text-slate-900 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
                    <UserPlus className="w-4 h-4" /> Asignar
                  </button>
                </div>
              </form>
              <div className="space-y-3">
                {(workOrder.colaboradores || []).length === 0 ? (
                  <div className="p-6 text-center text-slate-400 italic bg-white/30 rounded-lg border border-dashed border-white/60">Sin operarios asignados</div>
                ) : (
                  (workOrder.colaboradores || []).map(collab => {
                    const u = collab.usuario;
                    return (
                      <div key={collab.id} className="p-4 bg-white/60 rounded-lg border border-white/80 flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                          <div className="w-10 h-10 rounded-full bg-[#165B62] text-white font-bold flex items-center justify-center text-xs shrink-0">{u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}</div>
                          <div>
                            <p className="font-bold text-sm text-slate-900">{u ? `${u.nombre} ${u.apellido}` : `Operario #${collab.user_id}`}</p>
                            <p className="text-[12px] text-[#0F434A] font-semibold">{u?.cargo || u?.rol || 'Técnico'}</p>
                            {u?.email && <p className="text-[12px] text-slate-500">{u.email}</p>}
                            {u?.especialidades && u.especialidades.length > 0 && (
                              <div className="flex flex-wrap gap-1 mt-1">{u.especialidades.map(esp => <span key={esp.id} className="text-[12px] px-1.5 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-md font-semibold">{esp.nombre}</span>)}</div>
                            )}
                          </div>
                        </div>
                        <button onClick={() => handleRemoveOperator(collab.user_id)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"><span className="text-sm">✕</span></button>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        {/* Checklist */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <button onClick={() => toggleSection('checklist')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><CheckSquare className="w-4 h-4 text-[#165B62]" /> Checklist ({(workOrder.checklist_items || []).filter(c => c.completado).length}/{(workOrder.checklist_items || []).length})</span>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('checklist') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('checklist') && (
            <div className="px-5 pb-5">
              <div className="space-y-3">
                {(workOrder.checklist_items || []).map(item => (
                  <div key={item.id} onClick={() => handleToggleChecklist(item.id, item.completado)} className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${item.completado ? 'bg-[#D9EDEE]/80 border-[#3D848C] text-[#0F434A]' : 'bg-white/40 border-white/60 text-slate-800'}`}>
                    <div className="flex items-center gap-3">
                      <input type="checkbox" checked={Boolean(item.completado)} readOnly className="w-4 h-4 text-[#165B62] rounded focus:ring-0" />
                      <span className={`text-sm font-medium ${item.completado ? 'line-through' : ''}`}>{item.texto}</span>
                    </div>
                    {item.completado_en && <span className="text-[12px] text-[#0F434A] font-medium">✓ {new Date(item.completado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
                  </div>
                ))}
                <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
                  <input type="text" value={newChecklistText} onChange={e => setNewChecklistText(e.target.value)} placeholder="Agregar tarea..." className="flex-1 px-3 py-2 glass-input rounded-xl text-sm focus:outline-none" />
                  <button type="submit" className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all">Agregar</button>
                </form>
              </div>
            </div>
          )}
        </div>

        {/* Repuestos */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <button onClick={() => toggleSection('materiales')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><Package className="w-4 h-4 text-[#165B62]" /> Repuestos ({(workOrder.solicitudes_material || []).length})</span>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('materiales') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('materiales') && (
            <div className="px-5 pb-5">
              <form onSubmit={handleAddMaterial} className="p-4 bg-white/40 rounded-lg border border-white/60 space-y-3 mb-4">
                <p className="font-bold text-slate-800 text-xs">Solicitar Repuesto:</p>
                <div className="grid grid-cols-1 gap-2">
                  <select value={selectedSparePartId} onChange={e => setSelectedSparePartId(e.target.value ? Number(e.target.value) : '')} className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs focus:outline-none">
                    <option value="">-- Catálogo --</option>
                    {spareParts.map(s => <option key={s.id} value={s.id}>{s.codigo} - {s.nombre} (Disp: {s.stock_actual})</option>)}
                  </select>
                  <input type="number" min="1" value={materialQty} onChange={e => setMaterialQty(Math.max(1, parseInt(e.target.value) || 1))} className="px-2.5 py-1.5 glass-input rounded-xl text-xs text-center font-bold" />
                </div>
                {!selectedSparePartId && <input type="text" value={customMatName} onChange={e => setCustomMatName(e.target.value)} placeholder="O insumo libre..." className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs" />}
                <button type="submit" className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all">Solicitar Material</button>
              </form>
              <div className="space-y-2">
                {(workOrder.solicitudes_material || []).length === 0 ? <p className="text-slate-400 text-xs italic">Sin materiales solicitados.</p> : (workOrder.solicitudes_material || []).map(m => (
                  <div key={m.id} className="p-3 bg-white/40 border border-white/60 rounded-lg flex items-center justify-between">
                    <div><p className="font-bold text-slate-800 text-sm">{m.nombre}</p><p className="text-[12px] text-slate-500">Cant: {m.cantidad} {m.unidad_medida}</p></div>
                    <p className="font-extrabold text-[#0F434A] text-sm">${(m.costo_total || (m.cantidad * (m.costo_unitario || 0))).toFixed(2)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comentarios */}
        <div className="glass-panel rounded-xl overflow-hidden">
          <button onClick={() => toggleSection('comentarios')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
            <span className="flex items-center gap-2 text-sm font-bold text-slate-800"><MessageSquare className="w-4 h-4 text-[#165B62]" /> Comentarios ({(workOrder.comentarios || []).length})</span>
            <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('comentarios') ? 'rotate-180' : ''}`} />
          </button>
          {openSections.has('comentarios') && (
            <div className="px-5 pb-5">
              <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                {(workOrder.comentarios || []).length === 0 ? <p className="text-slate-400 text-xs italic text-center py-8">Sin comentarios.</p> : (workOrder.comentarios || []).map(c => (
                  <div key={c.id} className="p-4 bg-white/40 rounded-lg border border-white/60">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-800 text-sm">{c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : 'Técnico'}</span>
                        {c.usuario?.rol && <span className="text-[10px] text-slate-400 bg-white/60 px-1.5 py-0.5 rounded-full">{c.usuario.rol}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {c.tiempo_utilizado != null && c.tiempo_utilizado > 0 && (
                          <span className="text-[11px] font-bold text-[#165B62] bg-[#D9EDEE] px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {formatMinutesToTime(c.tiempo_utilizado)}
                          </span>
                        )}
                        <span className="text-[12px] text-slate-400">{new Date(c.created_at).toLocaleString('es-ES')}</span>
                      </div>
                    </div>
                    <p className="text-slate-700 text-sm leading-relaxed">{c.mensaje}</p>
                    {c.imagen_url && <img src={c.imagen_url} alt="Evidencia" className="mt-2 rounded-xl max-h-48 object-cover border border-white/60" />}
                  </div>
                ))}
              </div>
              <form onSubmit={handleAddComment} className="pt-3 mt-3 space-y-2 border-t border-white/60">
                <textarea rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escribe un comentario..." className="w-full px-3 py-2 glass-input rounded-xl text-sm focus:outline-none" />
                <div className="flex items-center gap-2">
                  <input type="url" value={commentImage} onChange={e => setCommentImage(e.target.value)} placeholder="URL de foto (opcional)" className="flex-1 px-3 py-1.5 glass-input rounded-xl text-xs" />
                  <div className="flex items-center gap-1 px-2 py-1.5 glass-input rounded-xl">
                    <Clock className="w-3.5 h-3.5 text-[#165B62]" />
                    <input type="text" value={commentTime} onChange={e => { const val = e.target.value.replace(/[^0-9:]/g, ''); if (/^\d{1,2}:?\d{0,2}$/.test(val) || val === '') setCommentTime(val); }} placeholder="0:00" className="w-16 bg-transparent text-xs font-bold focus:outline-none text-center" title="Tiempo trabajado (horas:minutos)" />
                    <span className="text-[10px] text-slate-400">horas</span>
                  </div>
                  <button type="submit" className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all"><Send className="w-3.5 h-3.5" /> Comentar</button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>

      {/* Tab Content - Desktop */}
      <div className="hidden md:block glass-panel rounded-xl p-6">
        {activeTab === 'general' && (
          <div className="space-y-5">
            {/* Description */}
            <div className="p-4 bg-white/40 rounded-lg border border-white/60">
              <p className="text-[12px] text-slate-500 font-bold uppercase mb-1">Descripción del Problema</p>
              <p className="text-sm text-slate-800 leading-relaxed">{workOrder.descripcion_problema_inicial || 'Sin descripción'}</p>
              {workOrder.foto_inicial_url && <img src={workOrder.foto_inicial_url} alt="Evidencia" className="mt-3 rounded-xl max-h-64 object-cover border border-white/60" />}
            </div>

            {/* Attributes Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase">Estimación</p>
                <p className="font-bold text-[#165B62] text-sm flex items-center gap-1.5">
                  <Clock className="w-4 h-4" />
                  {workOrder.hora_termino || 'No definida'}
                </p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase">Categoría</p>
                <p className="font-semibold text-slate-800 text-sm">{workOrder.categoria_mantenimiento?.nombre || 'General'}</p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase">Reportado Por</p>
                <p className="font-semibold text-slate-800 text-sm">{workOrder.generado_por ? `${workOrder.generado_por.nombre} ${workOrder.generado_por.apellido}` : workOrder.reportado_por_nombre || 'Mantis App'}</p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase">Prioridad</p>
                {editingPriority ? (
                  <div className="flex items-center gap-1 flex-wrap">
                    {(['baja', 'media', 'alta', 'critica'] as Priority[]).map(p => (
                      <button key={p} onClick={() => handlePriorityChange(p)} className={`px-2 py-0.5 rounded-lg text-[12px] font-bold capitalize cursor-pointer ${workOrder.prioridad === p ? 'bg-[#3D848C] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}>{p}</button>
                    ))}
                  </div>
                ) : (
                  <p className="font-bold text-sm cursor-pointer hover:underline" onClick={() => setEditingPriority(true)} title="Clic para cambiar">{workOrder.prioridad} ✎</p>
                )}
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[12px] text-slate-400 font-bold uppercase">Costo Total</p>
                <p className="font-bold text-[#0F434A] text-sm">${workOrder.costo_total}</p>
              </div>
            </div>

            {/* Full Activity Timeline */}
            <div>
              <p className="font-bold text-slate-700 text-xs mb-3">Historial Completo de Actividad</p>
              {/* Event Type Filter */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                <button onClick={() => setTimelineFilter(null)} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer ${timelineFilter === null ? 'bg-[#3D848C] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}>Todos</button>
                <button onClick={() => setTimelineFilter('creacion')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'creacion' ? 'bg-[#3D848C] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-[#3D848C] inline-block" /> Creación</button>
                <button onClick={() => setTimelineFilter('operario')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'operario' ? 'bg-indigo-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" /> Operarios</button>
                <button onClick={() => setTimelineFilter('estado')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'estado' ? 'bg-violet-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-violet-400 inline-block" /> Estados</button>
                <button onClick={() => setTimelineFilter('material')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'material' ? 'bg-amber-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-amber-400 inline-block" /> Materiales</button>
                <button onClick={() => setTimelineFilter('checklist')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'checklist' ? 'bg-emerald-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" /> Checklist</button>
                <button onClick={() => setTimelineFilter('comentario')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'comentario' ? 'bg-sky-500 text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-sky-400 inline-block" /> Comentarios</button>
                <button onClick={() => setTimelineFilter('finalizacion')} className={`px-2.5 py-1 rounded-lg text-[12px] font-bold transition-all cursor-pointer flex items-center gap-1 ${timelineFilter === 'finalizacion' ? 'bg-[#165B62] text-white' : 'bg-white/60 text-slate-600 hover:bg-white border border-white/80'}`}><span className="w-2 h-2 rounded-full bg-[#165B62] inline-block" /> Finalización</button>
              </div>
              <div className="relative pl-6 space-y-0">
                {/* Timeline line */}
                <div className="absolute left-[11px] top-2 bottom-2 w-0.5 bg-[#3D848C]/20" />

                {/* Event: OT Created */}
                {(timelineFilter === null || timelineFilter === 'creacion') && (
                <div className="relative pb-4">
                  <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full bg-[#3D848C] border-2 border-white shadow-sm" />
                  <div className="text-xs">
                    <p className="font-bold text-slate-800">OT Creada</p>
                    <p className="text-slate-500 text-[12px]">{workOrder.generado_por ? `${workOrder.generado_por.nombre} ${workOrder.generado_por.apellido}` : workOrder.reportado_por_nombre || 'Sistema'} • {new Date(workOrder.created_at).toLocaleString('es-ES')}</p>
                    {workOrder.descripcion_problema_inicial && <p className="text-slate-600 text-[12px] mt-0.5">{workOrder.descripcion_problema_inicial.slice(0, 100)}{workOrder.descripcion_problema_inicial.length > 100 ? '...' : ''}</p>}
                  </div>
                </div>
                )}

                {/* Event: Collaborators added/removed */}
                {(timelineFilter === null || timelineFilter === 'operario') && (workOrder.colaboradores || []).map((collab, i) => (
                  <div key={`collab-${i}`} className="relative pb-4">
                    <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full bg-indigo-400 border-2 border-white shadow-sm" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Operario Asignado</p>
                      <p className="text-slate-500 text-[12px]">{collab.usuario ? `${collab.usuario.nombre} ${collab.usuario.apellido}` : `Usuario #${collab.user_id}`} • {new Date(collab.created_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                ))}

                {/* Event: Status changes */}
                {(timelineFilter === null || timelineFilter === 'estado') && (workOrder.historial_estados || []).map((h, i) => (
                  <div key={`status-${i}`} className="relative pb-4">
                    <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full border-2 border-white shadow-sm" style={{ backgroundColor: h.estado?.color || '#6B7280' }} />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Estado cambiado a <span style={{ color: h.estado?.color || '#6B7280' }}>{h.estado?.nombre}</span></p>
                      <p className="text-slate-500 text-[12px]">{h.cambiado_por?.nombre || 'Sistema'} • {new Date(h.created_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                ))}

                {/* Event: Material requests */}
                {(timelineFilter === null || timelineFilter === 'material') && (workOrder.solicitudes_material || []).map((m, i) => (
                  <div key={`mat-${i}`} className="relative pb-4">
                    <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full bg-amber-400 border-2 border-white shadow-sm" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Material solicitado: {m.nombre}</p>
                      <p className="text-slate-500 text-[12px]">Cantidad: {m.cantidad} {m.unidad_medida} • {m.created_at ? new Date(m.created_at).toLocaleString('es-ES') : ''}</p>
                    </div>
                  </div>
                ))}

                {/* Event: Checklist completed */}
                {(timelineFilter === null || timelineFilter === 'checklist') && (workOrder.checklist_items || []).filter(c => c.completado && c.completado_en).map((c, i) => (
                  <div key={`cl-${i}`} className="relative pb-4">
                    <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-white shadow-sm" />
                    <div className="text-xs">
                      <p className="font-bold text-slate-800">Checklist completado: {c.texto}</p>
                      <p className="text-slate-500 text-[12px]">{c.completado_por ? `${c.completado_por.nombre} ${c.completado_por.apellido}` : 'Operario'} • {new Date(c.completado_en!).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                ))}

                {/* Event: Comments */}
                {(timelineFilter === null || timelineFilter === 'comentario') && (workOrder.comentarios || []).map((c, i) => (
                  <div key={`com-${i}`} className="relative pb-4">
                    <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full bg-sky-400 border-2 border-white shadow-sm" />
                    <div className="text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-bold text-slate-800">Comentario de {c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : 'Técnico'}</p>
                        {c.tiempo_utilizado != null && c.tiempo_utilizado > 0 && (
                          <span className="text-[10px] font-bold text-[#165B62] bg-[#D9EDEE] px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                            <Clock className="w-2.5 h-2.5" /> {formatMinutesToTime(c.tiempo_utilizado)}
                          </span>
                        )}
                      </div>
                      <p className="text-slate-600 text-[12px] mt-0.5">{c.mensaje.slice(0, 120)}{c.mensaje.length > 120 ? '...' : ''}</p>
                      <p className="text-slate-400 text-[12px] mt-0.5">{new Date(c.created_at).toLocaleString('es-ES')}</p>
                    </div>
                  </div>
                ))}

                {/* Event: OT Finalized */}
                {(timelineFilter === null || timelineFilter === 'finalizacion') && workOrder.fecha_termino && (
                  <div className="relative pb-4">
                    <div className="absolute left-[-13px] top-0.5 w-3 h-3 rounded-full bg-[#165B62] border-2 border-white shadow-sm" />
                    <div className="text-xs">
                      <p className="font-bold text-[#165B62]">OT Finalizada</p>
                      <p className="text-slate-500 text-[12px]">{new Date(workOrder.fecha_termino).toLocaleString('es-ES')} • Downtime: {workOrder.minutos_inactividad} min • Costo: ${workOrder.costo_total}</p>
                      {workOrder.mensaje_adicional && <p className="text-slate-600 text-[12px] mt-0.5">{workOrder.mensaje_adicional}</p>}
                    </div>
                  </div>
                )}

                {/* Empty state */}
                {filteredEventsEmpty && (
                  <div className="relative pb-4 text-center py-6">
                    <p className="text-xs text-slate-400 italic">No hay eventos de este tipo</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'operarios' && (
          <div className="space-y-5">
            <form onSubmit={handleAddOperator} className="p-4 bg-white/50 rounded-lg border border-white/60 space-y-3">
              <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5"><UserPlus className="w-4 h-4 text-[#165B62]" /> Asignar Operario</p>
              <div className="flex gap-2">
                <select value={selectedUserId} onChange={e => setSelectedUserId(e.target.value ? Number(e.target.value) : '')} className="flex-1 px-3 py-2 glass-input rounded-xl text-xs focus:outline-none">
                  <option value="">-- Seleccionar --</option>
                  {allUsers.filter(u => !(workOrder.colaboradores || []).some(c => Number(c.user_id) === u.id)).map(u => (
                    <option key={u.id} value={u.id}>{u.nombre} {u.apellido} - {u.cargo || u.rol}</option>
                  ))}
                </select>
                <button type="submit" disabled={!selectedUserId} className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] disabled:opacity-50 text-slate-900 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center gap-1.5 shrink-0">
                  <UserPlus className="w-4 h-4" /> Asignar
                </button>
              </div>
            </form>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(workOrder.colaboradores || []).length === 0 ? (
                <div className="col-span-2 p-8 text-center text-slate-400 italic bg-white/30 rounded-lg border border-dashed border-white/60">Sin operarios asignados</div>
              ) : (
                (workOrder.colaboradores || []).map(collab => {
                  const u = collab.usuario;
                  return (
                    <div key={collab.id} className="p-4 bg-white/60 rounded-lg border border-white/80 flex items-start justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#165B62] text-white font-bold flex items-center justify-center text-xs shrink-0">{u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}</div>
                        <div>
                          <p className="font-bold text-sm text-slate-900">{u ? `${u.nombre} ${u.apellido}` : `Operario #${collab.user_id}`}</p>
                          <p className="text-[12px] text-[#0F434A] font-semibold">{u?.cargo || u?.rol || 'Técnico'}</p>
                          {u?.email && <p className="text-[12px] text-slate-500">{u.email}</p>}
                          {u?.especialidades && u.especialidades.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-1">{u.especialidades.map(esp => <span key={esp.id} className="text-[12px] px-1.5 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-md font-semibold">{esp.nombre}</span>)}</div>
                          )}
                        </div>
                      </div>
                      <button onClick={() => handleRemoveOperator(collab.user_id)} className="p-1 text-slate-400 hover:text-rose-600 rounded-lg cursor-pointer"><span className="text-sm">✕</span></button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="space-y-3">
            {(workOrder.checklist_items || []).map(item => (
              <div key={item.id} onClick={() => handleToggleChecklist(item.id, item.completado)} className={`p-3 rounded-lg border flex items-center justify-between cursor-pointer transition-all ${item.completado ? 'bg-[#D9EDEE]/80 border-[#3D848C] text-[#0F434A]' : 'bg-white/40 border-white/60 text-slate-800'}`}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={Boolean(item.completado)} readOnly className="w-4 h-4 text-[#165B62] rounded focus:ring-0" />
                  <span className={`text-sm font-medium ${item.completado ? 'line-through' : ''}`}>{item.texto}</span>
                </div>
                {item.completado_en && <span className="text-[12px] text-[#0F434A] font-medium">✓ {new Date(item.completado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>}
              </div>
            ))}
            <form onSubmit={handleAddChecklist} className="flex gap-2 pt-2">
              <input type="text" value={newChecklistText} onChange={e => setNewChecklistText(e.target.value)} placeholder="Agregar tarea..." className="flex-1 px-3 py-2 glass-input rounded-xl text-sm focus:outline-none" />
              <button type="submit" className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all">Agregar</button>
            </form>
          </div>
        )}

        {activeTab === 'materiales' && (
          <div className="space-y-4">
            <form onSubmit={handleAddMaterial} className="p-4 bg-white/40 rounded-lg border border-white/60 space-y-3">
              <p className="font-bold text-slate-800 text-xs">Solicitar Repuesto:</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className="sm:col-span-2">
                  <select value={selectedSparePartId} onChange={e => setSelectedSparePartId(e.target.value ? Number(e.target.value) : '')} className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs focus:outline-none">
                    <option value="">-- Catálogo --</option>
                    {spareParts.map(s => <option key={s.id} value={s.id}>{s.codigo} - {s.nombre} (Disp: {s.stock_actual})</option>)}
                  </select>
                </div>
                <input type="number" min="1" value={materialQty} onChange={e => setMaterialQty(Math.max(1, parseInt(e.target.value) || 1))} className="px-2.5 py-1.5 glass-input rounded-xl text-xs text-center font-bold" />
              </div>
              {!selectedSparePartId && <input type="text" value={customMatName} onChange={e => setCustomMatName(e.target.value)} placeholder="O insumo libre..." className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs" />}
              <button type="submit" className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all">Solicitar Material</button>
            </form>
            <div className="space-y-2">
              {(workOrder.solicitudes_material || []).length === 0 ? <p className="text-slate-400 text-xs italic">Sin materiales solicitados.</p> : (workOrder.solicitudes_material || []).map(m => (
                <div key={m.id} className="p-3 bg-white/40 border border-white/60 rounded-lg flex items-center justify-between">
                  <div><p className="font-bold text-slate-800 text-sm">{m.nombre}</p><p className="text-[12px] text-slate-500">Cant: {m.cantidad} {m.unidad_medida}</p></div>
                  <p className="font-extrabold text-[#0F434A] text-sm">${(m.costo_total || (m.cantidad * (m.costo_unitario || 0))).toFixed(2)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'comentarios' && (
          <div className="space-y-4">
            <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
              {(workOrder.comentarios || []).length === 0 ? <p className="text-slate-400 text-xs italic text-center py-8">Sin comentarios.</p> : (workOrder.comentarios || []).map(c => (
                <div key={c.id} className="p-4 bg-white/40 rounded-lg border border-white/60">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 text-sm">{c.usuario ? `${c.usuario.nombre} ${c.usuario.apellido}` : 'Técnico'}</span>
                      {c.usuario?.rol && (
                        <span className="text-[10px] text-slate-400 bg-white/60 px-1.5 py-0.5 rounded-full">{c.usuario.rol}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {c.tiempo_utilizado != null && c.tiempo_utilizado > 0 && (
                        <span className="text-[11px] font-bold text-[#165B62] bg-[#D9EDEE] px-2 py-0.5 rounded-full flex items-center gap-1">
                          <Clock className="w-3 h-3" /> {formatMinutesToTime(c.tiempo_utilizado)}
                        </span>
                      )}
                      <span className="text-[12px] text-slate-400">{new Date(c.created_at).toLocaleString('es-ES')}</span>
                    </div>
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed">{c.mensaje}</p>
                  {c.imagen_url && <img src={c.imagen_url} alt="Evidencia" className="mt-2 rounded-xl max-h-48 object-cover border border-white/60" />}
                </div>
              ))}
            </div>
            <form onSubmit={handleAddComment} className="pt-2 space-y-2 border-t border-white/60">
              <textarea rows={3} value={commentText} onChange={e => setCommentText(e.target.value)} placeholder="Escribe un comentario..." className="w-full px-3 py-2 glass-input rounded-xl text-sm focus:outline-none" />
              <div className="flex items-center gap-2">
                <input type="url" value={commentImage} onChange={e => setCommentImage(e.target.value)} placeholder="URL de foto (opcional)" className="flex-1 px-3 py-1.5 glass-input rounded-xl text-xs" />
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
                    className="w-16 bg-transparent text-xs font-bold focus:outline-none text-center"
                    title="Tiempo trabajado (horas:minutos)"
                  />
                  <span className="text-[10px] text-slate-400">horas</span>
                </div>
                <button type="submit" className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all"><Send className="w-3.5 h-3.5" /> Comentar</button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
