import React, { useState, useEffect } from 'react';
import {
  Users,
  Clock,
  Wrench,
  ChevronDown,
  ChevronUp,
  Activity,
  CheckCircle2,
  AlertTriangle,
  Eye,
  Mail,
  Phone,
  Star,
  BarChart3,
  Crown,
  Loader
} from 'lucide-react';
import { User, WorkOrder, EstadoOT } from '../types';
import { api } from '../services/api';

interface WorkerStat {
  user: User;
  otCount: number;                    // OTs where assigned as collaborator
  otCreated: number;                  // OTs this worker created (generado_por)
  otAssignedAsColab: WorkOrder[];     // OTs as collaborator
  otCreatedList: WorkOrder[];         // OTs as creator
  totalTimeMinutes: number;           // Sum of downtime from OTs participated
  commentTimeMinutes: number;         // Sum of tiempo_utilizado from comments
  activeOtCount: number;              // Currently active OTs (not finalized)
  finalizadaCount: number;            // Finalized OTs
  commentsCount: number;              // Total comments made
  materialsRequested: number;         // Materials requested
  avgResponseDays: number;            // Avg days between OT creation and first status change
}

interface WorkerDetailPanelProps {
  desde: string;
  hasta: string;
}

export const WorkerDetailPanel: React.FC<WorkerDetailPanelProps> = ({ desde, hasta }) => {
  const [workers, setWorkers] = useState<WorkerStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkerId, setExpandedWorkerId] = useState<number | null>(null);
  const [estadosOT, setEstadosOT] = useState<EstadoOT[]>([]);

  useEffect(() => {
    loadData();
  }, [desde, hasta]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [users, workOrders, estados] = await Promise.all([
        api.getUsers(),
        api.getWorkOrders(),
        api.request<EstadoOT[]>('/estados-ot')
      ]);

      setEstadosOT(estados);

      // Build stats per user
      const workerStats: WorkerStat[] = users
        .filter(u => u.rol === 'tecnico' || u.rol === 'administrador' || u.rol === 'super_admin')
        .map(user => {
          // Filter work orders in date range
          const filteredOTs = workOrders.filter(wo => {
            const created = new Date(wo.created_at);
            return created >= new Date(desde) && created <= new Date(hasta + 'T23:59:59');
          });

          // OTs where user is a collaborator
          const asColab = filteredOTs.filter(wo =>
            (wo.colaboradores || []).some(c => Number(c.user_id) === user.id)
          );

          // OTs created by this user
          const created = filteredOTs.filter(wo =>
            wo.generado_por && wo.generado_por.id === user.id
          );

          // Total downtime from participated OTs (use Set to avoid double-counting)
          const uniqueOTIds = new Set<number>();
          let totalTime = 0;
          asColab.forEach(wo => {
            if (!uniqueOTIds.has(wo.id)) {
              uniqueOTIds.add(wo.id);
              totalTime += Number(wo.minutos_inactividad) || 0;
            }
          });

          // Active OTs (not final state)
          const activeOTs = asColab.filter(wo => !wo.estado?.es_estado_final);

          // Finalized
          const finalizedOTs = asColab.filter(wo => wo.estado?.es_estado_final);

          // Comments made by this user across OTs
          let commentsCount = 0;
          let commentTimeMinutes = 0;
          let materialsRequested = 0;
          let totalResponseDays = 0;
          let responseCount = 0;

          filteredOTs.forEach(wo => {
            (wo.comentarios || []).forEach(c => {
              if (c.user_id === user.id) {
                commentsCount++;
                commentTimeMinutes += Number(c.tiempo_utilizado) || 0;
              }
            });
            if (asColab.some(a => a.id === wo.id) || created.some(cr => cr.id === wo.id)) {
              materialsRequested += (wo.solicitudes_material || []).filter(m => m.solicitado_por_id === user.id).length;
            }
            // Response time: first status change after creation
            if (asColab.some(a => a.id === wo.id)) {
              const history = (wo.historial_estados || []).sort(
                (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              );
              if (history.length > 0) {
                const firstChange = new Date(history[0].created_at);
                const creation = new Date(wo.created_at);
                const days = (firstChange.getTime() - creation.getTime()) / (1000 * 60 * 60 * 24);
                if (days >= 0) {
                  totalResponseDays += days;
                  responseCount++;
                }
              }
            }
          });

          return {
            user,
            otCount: asColab.length,
            otCreated: created.length,
            otAssignedAsColab: asColab,
            otCreatedList: created,
            totalTimeMinutes: totalTime,
            commentTimeMinutes,
            activeOtCount: activeOTs.length,
            finalizadaCount: finalizedOTs.length,
            commentsCount,
            materialsRequested,
            avgResponseDays: responseCount > 0 ? Math.round((totalResponseDays / responseCount) * 10) / 10 : 0
          };
        })
        .filter(w => w.otCount > 0 || w.otCreated > 0) // Only show workers with activity
        .sort((a, b) => b.otCount - a.otCount); // Most active first

      setWorkers(workerStats);
    } catch (e) {
      console.error('Error loading worker stats', e);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} min`;
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hrs}h ${mins}min` : `${hrs}h`;
  };

  const getStatusColor = (estado: string) => {
    const found = estadosOT.find(e => e.nombre === estado);
    return found?.color || '#3D848C';
  };

  if (loading) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader className="w-5 h-5 text-[#165B62] animate-spin" />
          <span className="text-[13px] text-slate-500 font-medium">Cargando detalle de trabajadores...</span>
        </div>
      </div>
    );
  }

  if (workers.length === 0) {
    return (
      <div className="glass-card p-6 rounded-xl">
        <div className="text-center py-8 text-slate-400">
          <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-[13px]">No hay actividad de trabajadores en el período seleccionado.</p>
        </div>
      </div>
    );
  }

  // Summary stats
  const totalWorkers = workers.length;
  const totalOTsHandled = workers.reduce((sum, w) => sum + w.otCount, 0);
  const totalTimeAll = workers.reduce((sum, w) => sum + w.totalTimeMinutes, 0);
  const totalCommentTime = workers.reduce((sum, w) => sum + w.commentTimeMinutes, 0);
  const totalComments = workers.reduce((sum, w) => sum + w.commentsCount, 0);

  return (
    <div className="space-y-4">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-[12px] font-bold text-slate-500 uppercase">Trabajadores Activos</p>
          <p className="text-2xl font-black text-[#165B62] mt-1">{totalWorkers}</p>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-[12px] font-bold text-slate-500 uppercase">OTs Atendidas</p>
          <p className="text-2xl font-black text-slate-800 mt-1">{totalOTsHandled}</p>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-[12px] font-bold text-slate-500 uppercase">Downtime Total</p>
          <p className="text-2xl font-black text-rose-700 mt-1">{formatTime(totalTimeAll)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-[12px] font-bold text-slate-500 uppercase">Tiempo de Trabajo</p>
          <p className="text-2xl font-black text-amber-700 mt-1">{formatTime(totalCommentTime)}</p>
        </div>
        <div className="glass-card p-4 rounded-lg text-center">
          <p className="text-[12px] font-bold text-slate-500 uppercase">Comentarios</p>
          <p className="text-2xl font-black text-[#0F434A] mt-1">{totalComments}</p>
        </div>
      </div>

      {/* Worker Cards */}
      {workers.map((worker, idx) => (
        <div key={worker.user.id} className="glass-card rounded-lg overflow-hidden">
          {/* Worker Header */}
          <div
            className="p-4 flex items-center justify-between cursor-pointer hover:bg-white/20 transition-colors"
            onClick={() => setExpandedWorkerId(expandedWorkerId === worker.user.id ? null : worker.user.id)}
          >
            <div className="flex items-center gap-3">
              {/* Avatar */}
              <div className="relative">
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center font-extrabold text-[14px] shadow-md ${
                  idx === 0 ? 'bg-amber-400 text-amber-900 border-2 border-amber-500' :
                  idx === 1 ? 'bg-slate-300 text-slate-700 border-2 border-slate-400' :
                  idx === 2 ? 'bg-orange-300 text-orange-800 border-2 border-orange-400' :
                  'bg-[#D9EDEE] text-[#0A2E33] border-2 border-[#3D848C]/60'
                }`}>
                  {worker.user.nombre.charAt(0)}{worker.user.apellido.charAt(0)}
                </div>
                {idx < 3 && (
                  <div className="absolute -top-1 -right-1">
                    <Crown className="w-4 h-4 text-amber-500" />
                  </div>
                )}
              </div>

              {/* Name & Role */}
              <div>
                <div className="flex items-center gap-2">
                  <p className="font-extrabold text-slate-900 text-[15px]">
                    {worker.user.nombre} {worker.user.apellido}
                  </p>
                  {idx === 0 && (
                    <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full border border-amber-200">
                      TOP #1
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-[#0F434A] font-bold capitalize flex items-center gap-2">
                  {worker.user.cargo || worker.user.rol}
                  {worker.user.email && (
                    <span className="text-slate-400 font-normal">• {worker.user.email}</span>
                  )}
                </p>
                {worker.user.especialidades && worker.user.especialidades.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {worker.user.especialidades.map(esp => (
                      <span key={esp.id} className="text-[10px] font-semibold px-1.5 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-md">
                        {esp.nombre}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>              {/* Quick Stats */}
            <div className="flex items-center gap-4">
              <div className="hidden sm:flex items-center gap-4 text-[13px]">
                <div className="text-center">
                  <p className="font-extrabold text-slate-800 text-[15px]">{worker.otCount}</p>
                  <p className="text-[10px] text-slate-500 font-medium">OTs Asignadas</p>
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-amber-700 text-[15px]">{formatTime(worker.commentTimeMinutes)}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Tiempo Trabajo</p>
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-rose-700 text-[15px]">{formatTime(worker.totalTimeMinutes)}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Downtime</p>
                </div>
                <div className="text-center">
                  <p className="font-extrabold text-[#0F434A] text-[15px]">{worker.activeOtCount}</p>
                  <p className="text-[10px] text-slate-500 font-medium">Activas</p>
                </div>
              </div>
              <button className="p-1 text-slate-400">
                {expandedWorkerId === worker.user.id ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile quick stats (shown when collapsed) */}
          {expandedWorkerId !== worker.user.id && (
            <div className="sm:hidden px-4 pb-3 grid grid-cols-3 gap-2 text-[12px]">
              <div className="text-center p-2 bg-white/30 rounded-xl">
                <p className="font-bold text-slate-800">{worker.otCount}</p>
                <p className="text-[10px] text-slate-500">OTs</p>
              </div>
              <div className="text-center p-2 bg-white/30 rounded-xl">
                <p className="font-bold text-amber-700">{formatTime(worker.totalTimeMinutes)}</p>
                <p className="text-[10px] text-slate-500">Tiempo</p>
              </div>
              <div className="text-center p-2 bg-white/30 rounded-xl">
                <p className="font-bold text-[#0F434A]">{worker.activeOtCount}</p>
                <p className="text-[10px] text-slate-500">Activas</p>
              </div>
            </div>
          )}

          {/* Expanded Detail */}
          {expandedWorkerId === worker.user.id && (
            <div className="px-4 pb-4 space-y-4 border-t border-white/60 pt-3">
              
              {/* Detailed Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-center">
                  <BarChart3 className="w-4 h-4 text-[#165B62] mx-auto mb-1" />
                  <p className="font-extrabold text-slate-800 text-[15px]">{worker.otCount}</p>
                  <p className="text-[11px] text-slate-500">OTs Participación</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-center">
                  <Wrench className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <p className="font-extrabold text-amber-700 text-[15px]">{worker.otCreated}</p>
                  <p className="text-[11px] text-slate-500">OTs Creadas</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-center">
                  <Clock className="w-4 h-4 text-amber-600 mx-auto mb-1" />
                  <p className="font-extrabold text-amber-700 text-[15px]">{formatTime(worker.commentTimeMinutes)}</p>
                  <p className="text-[11px] text-slate-500">Tiempo de Trabajo</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-center">
                  <Clock className="w-4 h-4 text-rose-600 mx-auto mb-1" />
                  <p className="font-extrabold text-rose-700 text-[15px]">{formatTime(worker.totalTimeMinutes)}</p>
                  <p className="text-[11px] text-slate-500">Downtime OTs</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-center">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto mb-1" />
                  <p className="font-extrabold text-emerald-700 text-[15px]">{worker.finalizadaCount}</p>
                  <p className="text-[11px] text-slate-500">Finalizadas</p>
                </div>
                <div className="p-3 bg-white/40 rounded-xl border border-white/60 text-center">
                  <Activity className="w-4 h-4 text-violet-600 mx-auto mb-1" />
                  <p className="font-extrabold text-violet-700 text-[15px]">{worker.commentsCount}</p>
                  <p className="text-[11px] text-slate-500">Comentarios</p>
                </div>
              </div>

              {/* Performance bar */}
              <div className="p-3 bg-white/30 rounded-xl border border-white/60">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-[13px] font-bold text-slate-700">Rendimiento en Período</p>
                  <p className="text-[12px] text-slate-500">Respuesta promedio: <strong>{worker.avgResponseDays} días</strong></p>
                </div>
                <div className="w-full bg-white/50 h-3 rounded-full overflow-hidden border border-white/60">
                  <div
                    className="h-full bg-gradient-to-r from-[#3D848C] to-[#165B62] rounded-full transition-all duration-500"
                    style={{ width: `${Math.min(100, (worker.otCount / Math.max(1, workers[0]?.otCount || 1)) * 100)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between mt-1 text-[11px] text-slate-400">
                  <span>Menos activo</span>
                  <span>{Math.round((worker.otCount / Math.max(1, workers[0]?.otCount || 1)) * 100)}% del máximo</span>
                  <span>Más activo</span>
                </div>
              </div>

              {/* Contact Info */}
              {(worker.user.email || worker.user.telefono) && (
                <div className="flex items-center gap-4 text-[12px] text-slate-500">
                  {worker.user.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="w-3.5 h-3.5" /> {worker.user.email}
                    </span>
                  )}
                  {worker.user.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="w-3.5 h-3.5" /> {worker.user.telefono}
                    </span>
                  )}
                </div>
              )}

              {/* OT List */}
              <div>
                <p className="text-[13px] font-bold text-slate-700 mb-2">
                  Órdenes de Trabajo ({worker.otAssignedAsColab.length + worker.otCreatedList.length})
                </p>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {[...worker.otAssignedAsColab, ...worker.otCreatedList.filter(c => !worker.otAssignedAsColab.some(a => a.id === c.id))]
                    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                    .map(wo => {
                      const isCreator = wo.generado_por?.id === worker.user.id;
                      const isColab = (wo.colaboradores || []).some(c => Number(c.user_id) === worker.user.id);
                      const statusColor = getStatusColor(wo.estado?.nombre);
                      
                      return (
                        <div key={wo.id} className="p-3 bg-white/40 rounded-xl border border-white/60 flex items-center justify-between hover:bg-white/60 transition-colors">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: statusColor + '20', border: `1.5px solid ${statusColor}40` }}>
                              <Wrench className="w-4 h-4" style={{ color: statusColor }} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="font-bold text-[13px] text-slate-800">{wo.numero}</p>
                                {isCreator && (
                                  <span className="text-[9px] font-bold bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded-md">Creada por él</span>
                                )}
                                {isColab && (
                                  <span className="text-[9px] font-bold bg-[#D9EDEE] text-[#0F434A] px-1.5 py-0.5 rounded-md">Colaborador</span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {wo.maquina?.nombre} • {wo.maquina?.codigo}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 text-[12px]">
                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold" style={{ backgroundColor: statusColor + '20', color: statusColor, border: `1px solid ${statusColor}40` }}>
                              {wo.estado?.nombre}
                            </span>
                            <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                              wo.prioridad === 'critica' ? 'bg-rose-100 text-rose-700' :
                              wo.prioridad === 'alta' ? 'bg-amber-100 text-amber-700' :
                              'bg-slate-100 text-slate-600'
                            }`}>
                              {wo.prioridad}
                            </span>
                            <span className="text-[11px] text-slate-400">
                              {new Date(wo.created_at).toLocaleDateString('es-ES')}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>

            </div>
          )}
        </div>
      ))}
    </div>
  );
};
