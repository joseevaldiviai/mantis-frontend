import React, { useState } from 'react';
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
  DollarSign
} from 'lucide-react';
import { WorkOrder, SparePart, EstadoOT, User } from '../types';
import { api } from '../services/api';

interface WorkOrderDetailModalProps {
  workOrder: WorkOrder | null;
  onClose: () => void;
  onReload: () => void;
}

export const WorkOrderDetailModal: React.FC<WorkOrderDetailModalProps> = ({
  workOrder,
  onClose,
  onReload
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'operarios' | 'checklist' | 'materiales' | 'comentarios' | 'finalizar'>('general');

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

  // Finalize Form State
  const [finalDowntimeMin, setFinalDowntimeMin] = useState(60);
  const [finalLaborCost, setFinalLaborCost] = useState(100);
  const [finalMessage, setFinalMessage] = useState('');
  const [finalPhotoUrl, setFinalPhotoUrl] = useState('');

  // Available Statuses
  const [statuses, setStatuses] = useState<EstadoOT[]>([]);

  React.useEffect(() => {
    if (workOrder) {
      api.getSpareParts().then(setSpareParts);
      api.getUsers().then(setAllUsers).catch(() => {});
      // Load statuses
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
      await api.addComment(workOrder.id, commentText.trim(), commentImage.trim() || null);
      setCommentText('');
      setCommentImage('');
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="glass-modal rounded-3xl max-w-3xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-800">{workOrder.numero}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase ${
                workOrder.prioridad === 'critica' ? 'bg-rose-100 text-rose-800 border-rose-200' :
                workOrder.prioridad === 'alta' ? 'bg-amber-100 text-amber-800 border-amber-200' :
                'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]'
              }`}>
                Prioridad {workOrder.prioridad}
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/60 text-slate-700 border border-white/80">
                {workOrder.estado.nombre}
              </span>
            </div>
            <p className="text-xs font-semibold text-slate-700 mt-1">
              Equipo: <strong className="text-[#0F434A]">{workOrder.maquina.nombre}</strong> ({workOrder.maquina.codigo})
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 border-b border-white/60 py-2 text-xs font-semibold overflow-x-auto">
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
            <Users className="w-3.5 h-3.5" /> Operarios ({workOrder.colaboradores?.length || 0})
          </button>

          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'checklist' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <CheckSquare className="w-3.5 h-3.5" /> Checklist ({workOrder.checklist_items.filter(c => c.completado).length}/{workOrder.checklist_items.length})
          </button>

          <button
            onClick={() => setActiveTab('materiales')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'materiales' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Package className="w-3.5 h-3.5" /> Repuestos ({workOrder.solicitudes_material.length})
          </button>

          <button
            onClick={() => setActiveTab('comentarios')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'comentarios' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Comentarios ({workOrder.comentarios.length})
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
            <div className="space-y-4 text-xs">
              
              {/* Problem Statement */}
              <div className="p-3 bg-white/40 rounded-2xl border border-white/60">
                <p className="font-bold text-slate-500 uppercase tracking-wider text-[10px] mb-1">Descripción Inicial del Problema</p>
                <p className="text-slate-800 text-xs leading-relaxed">{workOrder.descripcion_problema_inicial || 'Sin descripción detallada'}</p>
                {workOrder.foto_inicial_url && (
                  <img src={workOrder.foto_inicial_url} alt="Evidencia" className="mt-2 rounded-xl max-h-48 object-cover border border-white/60" />
                )}
              </div>

              {/* Quick Assigned Operarios Summary */}
              <div className="p-3 bg-white/50 rounded-2xl border border-white/60">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-bold text-slate-800 flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-[#165B62]" /> Operarios Asignados ({workOrder.colaboradores?.length || 0})
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('operarios')}
                    className="text-[11px] font-bold text-[#0F434A] hover:underline cursor-pointer flex items-center gap-1"
                  >
                    + Asignar / Gestionar &rarr;
                  </button>
                </div>

                {!workOrder.colaboradores || workOrder.colaboradores.length === 0 ? (
                  <p className="text-slate-400 italic text-[11px]">Sin operarios asignados a esta orden aún.</p>
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {workOrder.colaboradores.map((collab, i) => {
                      const u = collab.usuario;
                      return (
                        <div key={collab.id || i} className="flex items-center gap-2 px-2.5 py-1.5 bg-[#D9EDEE]/80 border border-[#3D848C]/60 rounded-xl text-slate-800">
                          <div className="w-6 h-6 rounded-full bg-[#0A2E33] text-white font-bold flex items-center justify-center text-[10px]">
                            {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                          </div>
                          <div>
                            <p className="font-bold text-xs text-slate-900 leading-tight">{u ? `${u.nombre} ${u.apellido}` : 'Operario'}</p>
                            <p className="text-[10px] text-slate-500 capitalize">{u?.cargo || u?.rol || 'Técnico'}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Status Changer Bar */}
              <div className="p-3 bg-[#D9EDEE]/60 rounded-2xl border border-[#3D848C]/40">
                <p className="font-bold text-slate-800 mb-2">Cambiar Estado de la Orden:</p>
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { id: 10, name: 'Borrador' },
                    { id: 20, name: 'Abierta' },
                    { id: 30, name: 'En Proceso' },
                    { id: 40, name: 'En Espera de Repuestos' },
                    { id: 50, name: 'Finalizada' }
                  ].map(st => (
                    <button
                      key={st.id}
                      type="button"
                      onClick={() => handleStatusChange(st.id)}
                      className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                        workOrder.estado.nombre === st.name
                          ? 'bg-[#3D848C] text-slate-900 shadow-xs'
                          : 'bg-white/60 text-slate-700 border border-white/80 hover:bg-white'
                      }`}
                    >
                      {st.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* OT Attributes Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Categoría</p>
                  <p className="font-semibold text-slate-800">{workOrder.categoria_mantenimiento?.nombre || 'General'}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Reportado Por</p>
                  <p className="font-semibold text-slate-800">{workOrder.reportado_por_nombre || 'Mantis App'}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Contacto</p>
                  <p className="font-semibold text-slate-800">{workOrder.reportado_por_contacto || 'N/A'}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Costo Mano de Obra</p>
                  <p className="font-bold text-[#0F434A]">${workOrder.costo_mano_obra}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Costo Total Estimado</p>
                  <p className="font-bold text-[#0F434A]">${workOrder.costo_total}</p>
                </div>
                <div className="p-2.5 bg-white/40 rounded-xl border border-white/60">
                  <p className="text-[10px] text-slate-400 font-bold uppercase">Downtime Generado</p>
                  <p className="font-bold text-rose-700">{workOrder.minutos_inactividad} minutos</p>
                </div>
              </div>

              {/* Status History */}
              <div className="pt-2">
                <p className="font-bold text-slate-700 text-xs mb-2">Historial de Transiciones</p>
                <div className="space-y-1.5">
                  {workOrder.historial_estados.map((h, i) => (
                    <div key={i} className="flex items-center justify-between text-[11px] p-2 bg-white/40 rounded-xl border border-white/60">
                      <span className="font-semibold text-[#0F434A]">{h.estado?.nombre}</span>
                      <span className="text-slate-400">{new Date(h.created_at).toLocaleString('es-ES')} por {h.cambiado_por?.nombre}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}

          {/* TAB 1.5: OPERARIOS Y COLABORADORES */}
          {activeTab === 'operarios' && (
            <div className="space-y-4 text-xs">
              
              {/* Form to Assign New Operario */}
              <form onSubmit={handleAddOperator} className="p-3.5 bg-white/50 rounded-2xl border border-white/60 space-y-3">
                <p className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <UserPlus className="w-4 h-4 text-[#165B62]" /> Asignar Nuevo Operario o Técnico a la OT:
                </p>

                <div className="flex flex-col sm:flex-row gap-2">
                  <select
                    value={selectedUserIdToAssign}
                    onChange={(e) => setSelectedUserIdToAssign(e.target.value ? Number(e.target.value) : '')}
                    className="flex-1 px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
                  >
                    <option value="">-- Seleccionar personal de plantilla --</option>
                    {allUsers
                      .filter(u => !workOrder.colaboradores?.some(c => Number(c.user_id) === u.id))
                      .map(u => (
                        <option key={u.id} value={u.id}>
                          {u.nombre} {u.apellido} - {u.cargo || u.rol} ({u.email})
                        </option>
                      ))}
                  </select>

                  <button
                    type="submit"
                    disabled={!selectedUserIdToAssign}
                    className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] disabled:opacity-50 text-slate-900 hover:text-white font-bold rounded-xl text-xs transition-all cursor-pointer flex items-center justify-center gap-1.5 shrink-0"
                  >
                    <UserPlus className="w-4 h-4" /> Asignar Operario
                  </button>
                </div>
              </form>

              {/* Assigned Operarios List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-700 text-xs">
                  Equipo de Operarios Asignados ({workOrder.colaboradores?.length || 0}):
                </p>

                {!workOrder.colaboradores || workOrder.colaboradores.length === 0 ? (
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
                            <div className="w-10 h-10 rounded-full bg-[#D9EDEE] text-[#0A2E33] border border-[#3D848C] font-bold flex items-center justify-center text-xs shrink-0 shadow-2xs mt-0.5">
                              {u ? `${u.nombre.charAt(0)}${u.apellido.charAt(0)}` : 'OP'}
                            </div>

                            <div className="space-y-1">
                              <div>
                                <p className="font-extrabold text-slate-900 text-xs">
                                  {u ? `${u.nombre} ${u.apellido}` : `Operario #${collab.user_id}`}
                                </p>
                                <p className="text-[10px] text-[#0F434A] font-bold capitalize">
                                  {u?.cargo || u?.rol || 'Técnico de Campo'}
                                </p>
                              </div>

                              {u?.email && (
                                <p className="text-[10px] text-slate-500 font-medium">✉ {u.email}</p>
                              )}
                              {u?.telefono && (
                                <p className="text-[10px] text-slate-500 font-medium">📞 {u.telefono}</p>
                              )}

                              {u?.especialidades && u.especialidades.length > 0 && (
                                <div className="flex flex-wrap gap-1 pt-1">
                                  {u.especialidades.map(esp => (
                                    <span key={esp.id} className="text-[9px] px-1.5 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-md font-semibold">
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

          {/* TAB 2: CHECKLIST */}
          {activeTab === 'checklist' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-2">
                {workOrder.checklist_items.map((item) => (
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
                      <span className="text-[10px] text-[#0F434A] font-medium">
                        ✓ {new Date(item.completado_en).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    )}
                  </div>
                ))}
              </div>

              {/* Add checklist item */}
              <form onSubmit={handleAddChecklistItem} className="flex gap-2 pt-2">
                <input
                  type="text"
                  value={newChecklistText}
                  onChange={(e) => setNewChecklistText(e.target.value)}
                  placeholder="Agregar nueva tarea o verificación a la pauta..."
                  className="flex-1 px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Agregar Item
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: MATERIALES / REPUESTOS */}
          {activeTab === 'materiales' && (
            <div className="space-y-4 text-xs">
              
              {/* Add Material Request */}
              <form onSubmit={handleAddMaterial} className="p-3 bg-white/40 rounded-2xl border border-white/60 space-y-3">
                <p className="font-bold text-slate-800 text-xs">Solicitar Repuesto o Insumo desde Inventario:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Seleccionar Insumo de Bodega</label>
                    <select
                      value={selectedSparePartId}
                      onChange={(e) => setSelectedSparePartId(e.target.value ? Number(e.target.value) : '')}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs focus:outline-none"
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
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      value={materialQty}
                      onChange={(e) => setMaterialQty(Math.max(1, parseInt(e.target.value) || 1))}
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs text-center font-bold"
                    />
                  </div>
                </div>

                {!selectedSparePartId && (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">O escribe insumo libre no catalogado</label>
                    <input
                      type="text"
                      value={customMatName}
                      onChange={(e) => setCustomMatName(e.target.value)}
                      placeholder="Ej: Silicona RTV Alta Temp 80g"
                      className="w-full px-2.5 py-1.5 glass-input rounded-xl text-xs"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  Confirmar Solicitud de Material
                </button>
              </form>

              {/* Material List */}
              <div className="space-y-2">
                <p className="font-bold text-slate-800">Insumos Solicitados y Consumidos:</p>
                {workOrder.solicitudes_material.length === 0 ? (
                  <p className="text-slate-400 text-xs italic">No hay repuestos asociados a esta orden.</p>
                ) : (
                  workOrder.solicitudes_material.map(m => (
                    <div key={m.id} className="p-3 bg-white/40 border border-white/60 rounded-2xl flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">{m.nombre}</p>
                        <p className="text-[11px] text-slate-500">Cantidad: {m.cantidad} {m.unidad_medida}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-extrabold text-[#0F434A]">${(m.costo_total || (m.cantidad * (m.costo_unitario || 0))).toFixed(2)}</p>
                        <p className="text-[10px] text-slate-400">${(m.costo_unitario || 0).toFixed(2)} c/u</p>
                      </div>
                    </div>
                  ))
                )}
              </div>

            </div>
          )}

          {/* TAB 4: COMENTARIOS */}
          {activeTab === 'comentarios' && (
            <div className="space-y-4 text-xs">
              
              {/* Comment Log */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {workOrder.comentarios.length === 0 ? (
                  <p className="text-slate-400 text-xs italic text-center py-4">Sin comentarios de mantenimiento aún.</p>
                ) : (
                  workOrder.comentarios.map(c => (
                    <div key={c.id} className="p-3 bg-white/40 rounded-2xl border border-white/60">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-slate-800">{c.usuario?.nombre || 'Técnico'}</span>
                        <span className="text-[10px] text-slate-400">{new Date(c.created_at).toLocaleString('es-ES')}</span>
                      </div>
                      <p className="text-slate-700 leading-relaxed">{c.mensaje}</p>
                      {c.imagen_url && (
                        <img src={c.imagen_url} alt="Evidencia" className="mt-2 rounded-xl max-h-40 object-cover border border-white/60" />
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* New Comment Form */}
              <form onSubmit={handleAddComment} className="pt-2 space-y-2 border-t border-white/60">
                <textarea
                  rows={2}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  placeholder="Escribe una observación, avance de reparación o instrucción..."
                  className="w-full px-3 py-2 glass-input rounded-xl text-xs focus:outline-none"
                />

                <div className="flex items-center gap-2">
                  <input
                    type="url"
                    value={commentImage}
                    onChange={(e) => setCommentImage(e.target.value)}
                    placeholder="URL de foto o evidencia (opcional)"
                    className="flex-1 px-3 py-1.5 glass-input rounded-xl text-xs"
                  />
                  <button
                    type="submit"
                    className="px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs shrink-0 flex items-center gap-1 cursor-pointer transition-all"
                  >
                    <Send className="w-3.5 h-3.5" /> Comentar
                  </button>
                </div>
              </form>

            </div>
          )}

          {/* TAB 5: FINALIZAR */}
          {activeTab === 'finalizar' && (
            <form onSubmit={handleFinalizeWorkOrder} className="space-y-3 text-xs bg-[#D9EDEE]/60 p-4 rounded-2xl border border-[#3D848C]/60">
              <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
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
                  className="w-full py-2.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-extrabold rounded-xl shadow-xs text-xs transition-colors cursor-pointer"
                >
                  CERRAR Y FINALIZAR ORDEN DE TRABAJO
                </button>
              </div>
            </form>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
          >
            Cerrar Ventana
          </button>
        </div>

      </div>
    </div>
  );
};
