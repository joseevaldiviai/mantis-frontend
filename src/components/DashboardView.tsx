import React, { useState, useEffect } from 'react';
import {
  Wrench,
  AlertTriangle,
  Clock,
  DollarSign,
  Package,
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  FileSpreadsheet,
  QrCode,
  Activity,
  CheckCircle2,
  PieChart,
  Users,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { DashboardSummary, User, WorkOrder } from '../types';
import { api } from '../services/api';
import { WorkerDetailPanel } from './WorkerDetailPanel';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewSparePart: () => void;
  onOpenPublicQrReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewSparePart,
  onOpenPublicQrReport
}) => {
  const [desde, setDesde] = useState('2026-08-01');
  const [hasta, setHasta] = useState('2026-08-07');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [showWorkers, setShowWorkers] = useState(false);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [trendMode, setTrendMode] = useState<'week' | 'month'>('week');

  const loadSummary = async () => {
    setLoading(true);
    try {
      const [data, orders] = await Promise.all([
        api.getDashboardSummary(desde, hasta),
        api.getWorkOrders()
      ]);
      setSummary(data);
      setWorkOrders(orders);
    } catch (e) {
      console.error('Error loading dashboard summary', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    api.getMe().then(u => setCurrentUser(u)).catch(() => {});
  }, []);

  useEffect(() => {
    loadSummary();
  }, [desde, hasta]);

  if (loading || !summary) {
    return (
      <div className="p-8 text-center text-stone-500">
        <Activity className="w-8 h-8 text-emerald-600 animate-spin mx-auto mb-2" />
        <p className="text-sm font-medium">Cargando métricas del Dashboard Principal Mantis...</p>
      </div>
    );
  }

  const { ordenes_trabajo, costos, tiempo_inactividad, mantenimiento_preventivo, inventario, top_maquinas } = summary;

  // Helper: format minutes to "HH:MM"
  const formatMinutesToTime = (minutes: number): string => {
    if (!minutes || minutes <= 0) return '0:00';
    const hrs = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hrs}:${mins.toString().padStart(2, '0')}`;
  };

  // Filter work orders in date range and compute hours per OT and per user
  const filteredOTs = workOrders.filter(wo => {
    const created = new Date(wo.created_at);
    return created >= new Date(desde) && created <= new Date(hasta + 'T23:59:59');
  });

  const otHoursData = filteredOTs
    .map(wo => {
      const totalMinutes = (wo.comentarios || []).reduce(
        (sum, c) => sum + (Number(c.tiempo_utilizado) || 0), 0
      );
      return { ...wo, totalMinutes };
    })
    .filter(wo => wo.totalMinutes > 0)
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Aggregate hours per user across all OTs in range
  const userHoursMap = new Map<number, { nombre: string; apellido: string; rol: string; totalMinutes: number; otCount: number }>();
  filteredOTs.forEach(wo => {
    (wo.comentarios || []).forEach(c => {
      if (c.tiempo_utilizado && c.tiempo_utilizado > 0 && c.usuario) {
        const existing = userHoursMap.get(c.user_id);
        if (existing) {
          existing.totalMinutes += Number(c.tiempo_utilizado);
          existing.otCount++;
        } else {
          userHoursMap.set(c.user_id, {
            nombre: c.usuario.nombre,
            apellido: c.usuario.apellido,
            rol: c.usuario.rol,
            totalMinutes: Number(c.tiempo_utilizado),
            otCount: 1
          });
        }
      }
    });
  });
  const userHoursData = Array.from(userHoursMap.values())
    .sort((a, b) => b.totalMinutes - a.totalMinutes);

  // Compute previous month hours for comparison
  const periodComparison = (() => {
    const now = new Date(desde);
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const prevMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    const prevOTs = workOrders.filter(wo => {
      const created = new Date(wo.created_at);
      return created >= prevMonthStart && created <= prevMonthEnd;
    });
    let prevTotalMinutes = 0;
    let prevCommentsCount = 0;
    prevOTs.forEach(wo => {
      (wo.comentarios || []).forEach(c => {
        if (c.tiempo_utilizado && c.tiempo_utilizado > 0) {
          prevTotalMinutes += Number(c.tiempo_utilizado);
          prevCommentsCount++;
        }
      });
    });
    const currentTotalMinutes = userHoursData.reduce((s, u) => s + u.totalMinutes, 0);
    const currentCommentsCount = filteredOTs.reduce(
      (s, wo) => s + (wo.comentarios || []).filter(c => c.tiempo_utilizado && c.tiempo_utilizado > 0).length, 0
    );
    const diff = currentTotalMinutes - prevTotalMinutes;
    const pctChange = prevTotalMinutes > 0 ? Math.round((diff / prevTotalMinutes) * 100) : (currentTotalMinutes > 0 ? 100 : 0);
    const prevMonthLabel = prevMonthStart.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    const currentMonthLabel = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    return {
      prevTotalMinutes,
      prevCommentsCount,
      currentTotalMinutes,
      currentCommentsCount,
      diff,
      pctChange,
      prevMonthLabel,
      currentMonthLabel
    };
  })();

  // Compute trend data: group comment hours by week or month
  const trendData = (() => {
    const buckets = new Map<string, number>();
    filteredOTs.forEach(wo => {
      (wo.comentarios || []).forEach(c => {
        if (c.tiempo_utilizado && c.tiempo_utilizado > 0) {
          const d = new Date(c.created_at);
          let key: string;
          if (trendMode === 'week') {
            // Get week start (Monday)
            const day = d.getDay();
            const diff = d.getDate() - day + (day === 0 ? -6 : 1);
            const monday = new Date(d);
            monday.setDate(diff);
            key = monday.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
          } else {
            key = d.toLocaleDateString('es-ES', { month: 'short', year: '2-digit' });
          }
          buckets.set(key, (buckets.get(key) || 0) + Number(c.tiempo_utilizado));
        }
      });
    });
    return Array.from(buckets.entries())
      .map(([label, minutes]) => ({ label, minutes }))
      .sort((a, b) => {
        if (trendMode === 'week') return new Date(a.label).getTime() - new Date(b.label).getTime();
        return 0;
      })
      .slice(-12); // Last 12 periods
  })();

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-xl">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            Dashboard Principal de Mantenimiento e Inventario
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Monitoreo en tiempo real de OT, MTTR, costos de mano de obra y repuestos en riesgo
          </p>
        </div>

        {/* Date Filter & Quick Actions */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 glass-input rounded-xl text-xs text-slate-700">
            <Calendar className="w-3.5 h-3.5 text-[#165B62]" />
            <input
              type="date"
              value={desde}
              onChange={(e) => setDesde(e.target.value)}
              className="bg-transparent font-medium focus:outline-none"
            />
            <span className="text-slate-400">—</span>
            <input
              type="date"
              value={hasta}
              onChange={(e) => setHasta(e.target.value)}
              className="bg-transparent font-medium focus:outline-none"
            />
          </div>


        </div>
      </div>

      {/* Low Stock Alert Banner (If Any) */}
      {inventario.repuestos_bajo_stock > 0 && (
        <div className="p-4 glass-card bg-amber-50/60 border-amber-200/80 rounded-lg flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                Alerta de Inventario: {inventario.repuestos_bajo_stock} Repuesto(s) Bajo Stock Mínimo
              </p>
              <p className="text-[12px] text-amber-800">
                Existen insumos críticos con existencia inferior al punto de reorden. Revisa y genera órdenes de compra.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={onOpenNewSparePart}
              className="px-3 py-1.5 text-xs font-semibold bg-white/80 border border-amber-300 text-amber-900 hover:bg-amber-100 rounded-xl transition-colors cursor-pointer"
            >
              Nuevo Insumo
            </button>
            <button
              onClick={() => onNavigateTab('inventario')}
              className="px-3 py-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white rounded-xl shadow-2xs transition-colors cursor-pointer"
            >
              Ver Inventario
            </button>
          </div>
        </div>
      )}

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Backlog OTs */}
        <div
          onClick={() => onNavigateTab('ordenes')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              OTs Abiertas (Backlog)
            </span>
            <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl group-hover:scale-110 transition-transform">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{ordenes_trabajo.backlog_abiertas}</span>
            <span className="text-xs text-slate-500">de {ordenes_trabajo.total} totales</span>
          </div>
          <div className="mt-3 flex items-center gap-2 text-[12px] text-slate-500 border-t border-white/60 pt-2">
            <span className="text-rose-600 font-bold">{ordenes_trabajo.vencidas} vencidas</span>
            <span>•</span>
            <span className="text-[#0F434A] font-medium">{ordenes_trabajo.correctivas} correctivas / {ordenes_trabajo.preventivas} preventivas</span>
          </div>
        </div>

        {/* Card 2: Total Costs */}
        <div
          onClick={() => onNavigateTab('inventario')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Costos Acumulados ($)
            </span>
            <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl group-hover:scale-110 transition-transform">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">${costos.total.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-[#0F434A] font-bold">Mantenimiento</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] text-slate-500 border-t border-white/60 pt-2">
            <span>Mano Obra: ${costos.mano_obra.toFixed(0)}</span>
            <span>Repuestos: ${costos.materiales.toFixed(0)}</span>
          </div>
        </div>

        {/* Card 3: Downtime & MTTR */}
        <div
          onClick={() => onNavigateTab('maquinas')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Downtime & MTTR
            </span>
            <div className="p-2 bg-rose-50 text-rose-700 rounded-xl group-hover:scale-110 transition-transform">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">{tiempo_inactividad.horas_totales} hrs</span>
            <span className="text-xs text-slate-500">MTTR: {ordenes_trabajo.mttr_minutos} min</span>
          </div>
          <div className="mt-3 text-[12px] text-slate-500 border-t border-white/60 pt-2">
            <span>{tiempo_inactividad.ordenes_con_downtime} OTs generaron paro de producción</span>
          </div>
        </div>

        {/* Card 4: Inventory Health */}
        <div
          onClick={() => onNavigateTab('inventario')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-lg group"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Valor de Inventario ($)
            </span>
            <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl group-hover:scale-110 transition-transform">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <span className="text-2xl font-black text-slate-800">${inventario.valor_total_estimado.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</span>
            <span className="text-xs text-slate-500">Valorizado</span>
          </div>
          <div className="mt-3 flex items-center justify-between text-[12px] border-t border-white/60 pt-2">
            <span className="text-amber-700 font-bold">{inventario.repuestos_bajo_stock} bajo mínimo</span>
            <span className="text-[#0F434A] font-semibold">Stock Saludable</span>
          </div>
        </div>

      </div>

      {/* Section 2: Detailed Breakdown & Top Rankings */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Work Orders & Costs Detail */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Work Orders Breakdown by Status & Priority */}
          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#165B62]" />
                Distribución de Órdenes de Trabajo por Estado
              </h2>
              <button
                onClick={() => onNavigateTab('ordenes')}
                className="text-xs text-[#0F434A] hover:underline font-semibold flex items-center gap-1 cursor-pointer"
              >
                <span>Ver Lista Completa</span>
                <ArrowUpRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
              {Object.entries(ordenes_trabajo.por_estado).map(([stName, count]) => (
                <div key={stName} className="p-3 bg-white/40 backdrop-blur-xs rounded-xl border border-white/60 text-center">
                  <p className="text-[12px] font-semibold text-slate-500 truncate">{stName}</p>
                  <p className="text-xl font-extrabold text-slate-800 mt-1">{count as number}</p>
                </div>
              ))}
            </div>

            {/* Priority Progress Bars */}
            <div className="mt-6 pt-4 border-t border-white/60">
              <h3 className="text-xs font-bold text-slate-700 mb-3">OTs por Prioridad</h3>
              <div className="space-y-2.5 text-xs">
                {Object.entries(ordenes_trabajo.por_prioridad).map(([prio, val]) => {
                  const count = val as number;
                  const pct = Math.round((count / Math.max(1, ordenes_trabajo.total)) * 100);
                  const colorMap: Record<string, string> = {
                    baja: 'bg-[#3D848C]',
                    media: 'bg-[#165B62]',
                    alta: 'bg-amber-500',
                    critica: 'bg-rose-500'
                  };
                  return (
                    <div key={prio}>
                      <div className="flex justify-between text-[12px] mb-1">
                        <span className="capitalize font-semibold text-slate-700">{prio}</span>
                        <span className="text-slate-500">{count} OTs ({pct}%)</span>
                      </div>
                      <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden border border-white/60">
                        <div
                          className={`h-full ${colorMap[prio] || 'bg-[#3D848C]'} rounded-full transition-all duration-500`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Maintenance Plans & Quick Actions Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Preventive Maintenance Progress */}
            <div className="glass-card p-5 rounded-xl flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <ShieldCheck className="w-4 h-4 text-[#165B62]" />
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Mantenimiento Preventivo</h3>
                </div>
                <div className="text-3xl font-black text-slate-800 mt-1">
                  {mantenimiento_preventivo.planes_activos}
                </div>
                <p className="text-xs text-slate-500 mt-0.5">Planes programados en ejecución</p>
              </div>

              <div className="mt-4 pt-3 border-t border-white/60 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Planes Activos</span>
                  <span className="font-bold text-[#0F434A]">{mantenimiento_preventivo.planes_activos}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Planes Atrasados</span>
                  <span className={`font-bold ${mantenimiento_preventivo.planes_atrasados > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>{mantenimiento_preventivo.planes_atrasados}</span>
                </div>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-gradient-to-br from-[#165B62] to-[#0F434A] p-5 rounded-xl text-white shadow-md flex flex-col justify-between border border-white/30">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-emerald-100">Accesos Rápidos</h3>
                <p className="text-xs text-white/80 mt-1">Gestión directa de terreno e inventario</p>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4">
                <button
                  onClick={onOpenPublicQrReport}
                  className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-left transition-colors border border-white/20 cursor-pointer"
                >
                  <QrCode className="w-4 h-4 text-emerald-200 mb-1" />
                  <p className="text-xs font-bold">Reporte QR</p>
                  <p className="text-[11px] text-emerald-100">Terreno sin Login</p>
                </button>

                <button
                  onClick={onOpenNewSparePart}
                  className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-left transition-colors border border-white/20 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-200 mb-1" />
                  <p className="text-xs font-bold">+ Insumo</p>
                  <p className="text-[11px] text-emerald-100">Alta de Repuesto</p>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Col: Top Machines Rankings */}
        <div className="space-y-6">
          {/* Top Machines by Cost */}
          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-[#165B62]" />
                Top Máquinas por Costo
              </h2>
            </div>

            <div className="space-y-4">
              {(() => {
                const maxCosto = Math.max(...top_maquinas.por_costo.map(i => i.costo_total), 1);
                return top_maquinas.por_costo.map((item, idx) => {
                  const pct = Math.round((item.costo_total / maxCosto) * 100);
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-[#D9EDEE] text-[#0F434A] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#3D848C]/60">
                            #{idx + 1}
                          </span>
                          <p className="text-[12px] font-bold text-slate-800">{item.nombre}</p>
                          <span className="text-[10px] text-slate-400">{item.codigo}</span>
                        </div>
                        <p className="text-[12px] font-extrabold text-slate-800">${item.costo_total.toFixed(2)}</p>
                      </div>
                      <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden border border-white/60">
                        <div
                          className="h-full bg-[#3D848C] rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-white/60 text-center">
              <button
                onClick={() => onNavigateTab('maquinas')}
                className="text-xs font-bold text-[#0F434A] hover:text-slate-900 cursor-pointer"
              >
                Ver Catálogo de Equipos y QR &rarr;
              </button>
            </div>
          </div>

          {/* Top Machines by Downtime */}
          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <Clock className="w-4 h-4 text-rose-600" />
                Top Máquinas por Downtime
              </h2>
            </div>

            <div className="space-y-4">
              {(() => {
                const maxDt = Math.max(...top_maquinas.por_downtime.map(i => Number(i.minutos_inactividad) || 0), 1);
                return top_maquinas.por_downtime.map((item, idx) => {
                  const mins = Number(item.minutos_inactividad) || 0;
                  const pct = Math.round((mins / maxDt) * 100);
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-rose-200">
                            #{idx + 1}
                          </span>
                          <p className="text-[12px] font-bold text-slate-800">{item.nombre}</p>
                          <span className="text-[10px] text-slate-400">{item.codigo}</span>
                        </div>
                        <p className="text-[12px] font-extrabold text-rose-700">{mins} min</p>
                      </div>
                      <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden border border-white/60">
                        <div
                          className="h-full bg-rose-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-white/60 text-center">
              <button
                onClick={() => onNavigateTab('maquinas')}
                className="text-xs font-bold text-[#0F434A] hover:text-slate-900 cursor-pointer"
              >
                Ver Catálogo de Equipos y QR &rarr;
              </button>
            </div>
          </div>

          {/* Top Machines by Failures */}
          <div className="glass-card p-5 rounded-xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Top Máquinas por Fallas
              </h2>
            </div>

            <div className="space-y-4">
              {(() => {
                const maxFallas = Math.max(...top_maquinas.por_fallas.map(i => i.fallas), 1);
                return top_maquinas.por_fallas.map((item, idx) => {
                  const pct = Math.round((item.fallas / maxFallas) * 100);
                  return (
                    <div key={item.id} className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="w-5 h-5 rounded-full bg-amber-50 text-amber-700 text-[10px] font-bold flex items-center justify-center shrink-0 border border-amber-200">
                            #{idx + 1}
                          </span>
                          <p className="text-[12px] font-bold text-slate-800">{item.nombre}</p>
                          <span className="text-[10px] text-slate-400">{item.codigo}</span>
                        </div>
                        <p className="text-[12px] font-extrabold text-amber-700">{item.fallas} fallas</p>
                      </div>
                      <div className="w-full bg-white/50 h-2.5 rounded-full overflow-hidden border border-white/60">
                        <div
                          className="h-full bg-amber-400 rounded-full transition-all duration-700"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            <div className="mt-4 pt-3 border-t border-white/60 text-center">
              <button
                onClick={() => onNavigateTab('maquinas')}
                className="text-xs font-bold text-[#0F434A] hover:text-slate-900 cursor-pointer"
              >
                Ver Catálogo de Equipos y QR &rarr;
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* Sección: Horas Registradas por Mantenimiento */}
      {(otHoursData.length > 0 || userHoursData.length > 0) && (
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#165B62]" />
              Horas Registradas en Mantenimiento
            </h2>
            <span className="text-[11px] text-slate-400">{formatMinutesToTime(userHoursData.reduce((s, u) => s + u.totalMinutes, 0))} total</span>
          </div>

          {/* Comparativa Mes Actual vs Anterior */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
            <div className="p-3 bg-white/40 rounded-lg border border-white/60 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mes Anterior</p>
              <p className="text-lg font-extrabold text-slate-800 mt-1">{formatMinutesToTime(periodComparison.prevTotalMinutes)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{periodComparison.prevCommentsCount} registros</p>
              <p className="text-[10px] text-slate-400">{periodComparison.prevMonthLabel}</p>
            </div>
            <div className="p-3 bg-white/40 rounded-lg border border-white/60 text-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Mes Actual</p>
              <p className="text-lg font-extrabold text-[#0F434A] mt-1">{formatMinutesToTime(periodComparison.currentTotalMinutes)}</p>
              <p className="text-[10px] text-slate-400 mt-0.5">{periodComparison.currentCommentsCount} registros</p>
              <p className="text-[10px] text-slate-400">{periodComparison.currentMonthLabel}</p>
            </div>
            <div className="p-3 bg-white/40 rounded-lg border border-white/60 text-center flex flex-col justify-center">
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Variación</p>
              <div className="flex items-center justify-center gap-1.5 mt-1">
                <span className={`text-lg font-extrabold ${periodComparison.pctChange > 0 ? 'text-emerald-600' : periodComparison.pctChange < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                  {periodComparison.pctChange > 0 ? '+' : ''}{periodComparison.pctChange}%
                </span>
                {periodComparison.pctChange > 0 ? (
                  <TrendingUp className="w-4 h-4 text-emerald-600" />
                ) : periodComparison.pctChange < 0 ? (
                  <TrendingUp className="w-4 h-4 text-rose-600 rotate-180" />
                ) : null}
              </div>
              <p className="text-[10px] text-slate-400 mt-0.5">
                {periodComparison.diff > 0 ? '+' : ''}{formatMinutesToTime(Math.abs(periodComparison.diff))} vs anterior
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Horas por OT */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Horas por Órden de Trabajo</h3>
              {otHoursData.length === 0 ? (
                <p className="text-slate-400 text-xs italic">Sin horas registradas en el período.</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const maxMin = Math.max(...otHoursData.map(i => i.totalMinutes), 1);
                    return otHoursData.slice(0, 8).map((wo) => {
                      const pct = Math.round((wo.totalMinutes / maxMin) * 100);
                      return (
                        <div key={wo.id} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-[11px] font-bold text-[#0F434A] bg-[#D9EDEE] px-1.5 py-0.5 rounded-md shrink-0">{wo.numero}</span>
                              <p className="text-[12px] font-semibold text-slate-700 truncate">{wo.maquina?.nombre || 'Sin máquina'}</p>
                            </div>
                            <span className="text-[12px] font-extrabold text-[#0F434A] shrink-0 ml-2">{formatMinutesToTime(wo.totalMinutes)}</span>
                          </div>
                          <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden border border-white/60">
                            <div
                              className="h-full bg-[#3D848C] rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>

            {/* Horas por Usuario */}
            <div>
              <h3 className="text-xs font-bold text-slate-600 mb-3 uppercase tracking-wider">Horas por Técnico</h3>
              {userHoursData.length === 0 ? (
                <p className="text-slate-400 text-xs italic">Sin horas registradas en el período.</p>
              ) : (
                <div className="space-y-3">
                  {(() => {
                    const maxMin = Math.max(...userHoursData.map(i => i.totalMinutes), 1);
                    return userHoursData.map((u) => {
                      const pct = Math.round((u.totalMinutes / maxMin) * 100);
                      return (
                        <div key={`${u.nombre}-${u.apellido}`} className="space-y-1.5">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="w-6 h-6 rounded-full bg-[#D9EDEE] text-[#0F434A] text-[10px] font-bold flex items-center justify-center shrink-0 border border-[#3D848C]/60">
                                {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <p className="text-[12px] font-semibold text-slate-700 truncate">{u.nombre} {u.apellido}</p>
                                <p className="text-[10px] text-slate-400">{u.otCount} comentario{u.otCount !== 1 ? 's' : ''}</p>
                              </div>
                            </div>
                            <span className="text-[12px] font-extrabold text-[#0F434A] shrink-0 ml-2">{formatMinutesToTime(u.totalMinutes)}</span>
                          </div>
                          <div className="w-full bg-white/50 h-2 rounded-full overflow-hidden border border-white/60">
                            <div
                              className="h-full bg-[#165B62] rounded-full transition-all duration-700"
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Tendencia de Horas */}
      {trendData.length > 0 && (
        <div className="glass-card p-5 rounded-xl">
          <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
            <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#165B62]" />
              Tendencia de Horas Registradas
            </h2>
            <div className="flex items-center gap-1 bg-white/50 rounded-lg p-0.5 border border-white/60">
              <button
                onClick={() => setTrendMode('week')}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  trendMode === 'week'
                    ? 'bg-[#3D848C] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Semanal
              </button>
              <button
                onClick={() => setTrendMode('month')}
                className={`px-3 py-1 rounded-md text-[11px] font-bold transition-all cursor-pointer ${
                  trendMode === 'month'
                    ? 'bg-[#3D848C] text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-700'
                }`}
              >
                Mensual
              </button>
            </div>
          </div>

          {(() => {
            const n = trendData.length;
            const maxMin = Math.max(...trendData.map(d => d.minutes), 1);
            const maxBarHeight = 140;
            const avgMinutes = Math.round(trendData.reduce((s, d) => s + d.minutes, 0) / n);

            // Linear regression: y = mx + b
            const xValues = trendData.map((_, i) => i);
            const yValues = trendData.map(d => d.minutes);
            const xMean = xValues.reduce((s, x) => s + x, 0) / n;
            const yMean = yValues.reduce((s, y) => s + y, 0) / n;
            const numerator = xValues.reduce((s, x, i) => s + (x - xMean) * (yValues[i] - yMean), 0);
            const denominator = xValues.reduce((s, x) => s + (x - xMean) ** 2, 0);
            const slope = denominator !== 0 ? numerator / denominator : 0;
            const intercept = yMean - slope * xMean;
            const trendLine = xValues.map(x => Math.max(slope * x + intercept, 0));

            // SVG dimensions
            const svgWidth = 100; // percentage
            const svgHeight = maxBarHeight;
            const gapPct = 0.5; // gap between bars in %
            const barWidthPct = (100 / n) - gapPct;

            // Build SVG path points
            const points = trendLine.map((y, i) => {
              const xPct = (i / (n - 1 || 1)) * 100;
              const yPx = svgHeight - (Math.min(y, maxMin) / maxMin) * svgHeight;
              return { x: xPct, y: yPx };
            });
            const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            // Half vs half comparison
            const mid = Math.floor(n / 2);
            const firstHalf = trendData.slice(0, mid || 1);
            const secondHalf = trendData.slice(mid || 1);
            const firstHalfAvg = firstHalf.length > 0 ? Math.round(firstHalf.reduce((s, d) => s + d.minutes, 0) / firstHalf.length) : 0;
            const secondHalfAvg = secondHalf.length > 0 ? Math.round(secondHalf.reduce((s, d) => s + d.minutes, 0) / secondHalf.length) : 0;
            const halfDiff = secondHalfAvg - firstHalfAvg;
            const halfPct = firstHalfAvg > 0 ? Math.round((halfDiff / firstHalfAvg) * 100) : (secondHalfAvg > 0 ? 100 : 0);
            const halfLabel = Math.abs(halfPct) < 5 ? 'Estable' : halfPct > 0 ? 'Tendencia ↑' : 'Tendencia ↓';
            const halfColor = Math.abs(halfPct) < 5 ? 'text-slate-500' : halfPct > 0 ? 'text-emerald-600' : 'text-rose-600';
            const halfBg = Math.abs(halfPct) < 5 ? 'bg-slate-50 border-slate-200' : halfPct > 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200';

            return (
              <div className="mt-2">
                {/* Chart container */}
                <div className="relative" style={{ height: svgHeight + 30 }}>
                  {/* Average line */}
                  <div
                    className="absolute left-0 right-0 z-10 pointer-events-none"
                    style={{ bottom: (avgMinutes / maxMin) * svgHeight + 24 }}
                  >
                    <div className="flex items-center gap-1.5">
                      <div className="flex-1 border-t-2 border-dashed border-amber-400/80" />
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200 whitespace-nowrap">
                        Prom: {formatMinutesToTime(avgMinutes)}
                      </span>
                    </div>
                  </div>

                  {/* Trend line SVG overlay */}
                  <svg
                    className="absolute top-0 left-0 w-full pointer-events-none z-10"
                    style={{ height: svgHeight }}
                    viewBox={`0 0 100 ${svgHeight}`}
                    preserveAspectRatio="none"
                  >
                    <path
                      d={pathD}
                      fill="none"
                      stroke="#f59e0b"
                      strokeWidth="0.8"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      vectorEffect="non-scaling-stroke"
                    />
                    {/* Dots at each data point */}
                    {points.map((p, i) => (
                      <circle
                        key={i}
                        cx={p.x}
                        cy={p.y}
                        r="1.2"
                        fill="#f59e0b"
                        stroke="white"
                        strokeWidth="0.4"
                        vectorEffect="non-scaling-stroke"
                      />
                    ))}
                  </svg>

                  {/* Bars */}
                  <div className="flex items-end gap-1 h-full">
                    {trendData.map((d, idx) => {
                      const barHeight = Math.max((d.minutes / maxMin) * svgHeight, 4);
                      const isAboveAvg = d.minutes >= avgMinutes;
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                          {/* Tooltip on hover */}
                          <div className="absolute bottom-full mb-1 hidden group-hover:block z-20">
                            <div className="bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded-lg shadow-lg whitespace-nowrap">
                              {formatMinutesToTime(d.minutes)}{isAboveAvg ? ' ▲' : ' ▼'}
                            </div>
                          </div>
                          {/* Value label */}
                          <p className={`text-[9px] font-bold mb-0.5 ${isAboveAvg ? 'text-emerald-600' : 'text-slate-500'}`}>{formatMinutesToTime(d.minutes)}</p>
                          {/* Bar */}
                          <div
                            className={`w-full max-w-[40px] rounded-t-lg transition-all duration-500 cursor-pointer ${
                              isAboveAvg
                                ? 'bg-gradient-to-t from-[#165B62] to-emerald-500 hover:from-[#0F434A] hover:to-[#165B62]'
                                : 'bg-gradient-to-t from-slate-400 to-slate-300 hover:from-slate-500 hover:to-slate-400'
                            }`}
                            style={{ height: `${barHeight}px` }}
                          />
                          {/* Label */}
                          <p className="text-[9px] text-slate-500 mt-1 text-center leading-tight font-medium">{d.label}</p>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary line */}
                <div className="mt-3 pt-2 border-t border-white/60 space-y-2">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-500">Total: <span className="font-bold text-[#0F434A]">{formatMinutesToTime(trendData.reduce((s, d) => s + d.minutes, 0))}</span></span>
                    <span className="text-slate-500">Promedio: <span className="font-bold text-amber-600">{formatMinutesToTime(avgMinutes)}</span> / período</span>
                  </div>
                  {/* Half vs half comparison */}
                  <div className={`flex items-center justify-between p-2 rounded-xl border ${halfBg}`}>
                    <div className="flex items-center gap-3 text-[11px]">
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">1ra Mitad</p>
                        <p className="font-bold text-slate-700">{formatMinutesToTime(firstHalfAvg)}</p>
                      </div>
                      <span className="text-slate-300">→</span>
                      <div className="text-center">
                        <p className="text-[9px] text-slate-400 uppercase font-bold">2da Mitad</p>
                        <p className="font-bold text-slate-700">{formatMinutesToTime(secondHalfAvg)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[11px] font-extrabold ${halfColor}`}>
                        {halfPct > 0 ? '+' : ''}{halfPct}%
                      </span>
                      <span className={`text-[10px] font-bold ${halfColor} px-1.5 py-0.5 rounded-full`}> {halfLabel}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* Detalle de Trabajadores - Solo Admin/SuperAdmin */}
      {currentUser && (currentUser.rol === 'super_admin' || currentUser.rol === 'administrador') && (
        <div className="space-y-4">
          <button
            onClick={() => setShowWorkers(!showWorkers)}
            className="w-full glass-card p-4 rounded-lg flex items-center justify-between hover:bg-white/20 transition-colors cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl">
                <Users className="w-5 h-5" />
              </div>
              <div className="text-left">
                <p className="text-[14px] font-bold text-slate-800">Detalle de Trabajadores</p>
                <p className="text-[12px] text-slate-500">Rendimiento, OTs participadas y tiempo de trabajo por técnico</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {showWorkers ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
            </div>
          </button>

          {showWorkers && (
            <WorkerDetailPanel desde={desde} hasta={hasta} />
          )}
        </div>
      )}

    </div>
  );
};
