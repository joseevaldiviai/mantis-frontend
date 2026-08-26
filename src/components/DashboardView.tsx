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
  Plus,
  FileSpreadsheet,
  QrCode,
  Activity,
  CheckCircle2,
  PieChart
} from 'lucide-react';
import { DashboardSummary } from '../types';
import { api } from '../services/api';

interface DashboardViewProps {
  onNavigateTab: (tab: string) => void;
  onOpenNewOT: () => void;
  onOpenNewSparePart: () => void;
  onOpenPublicQrReport: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onNavigateTab,
  onOpenNewOT,
  onOpenNewSparePart,
  onOpenPublicQrReport
}) => {
  const [desde, setDesde] = useState('2026-08-01');
  const [hasta, setHasta] = useState('2026-08-07');
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const loadSummary = async () => {
    setLoading(true);
    try {
      const data = await api.getDashboardSummary(desde, hasta);
      setSummary(data);
    } catch (e) {
      console.error('Error loading dashboard summary', e);
    } finally {
      setLoading(false);
    }
  };

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

  return (
    <div className="space-y-6">
      
      {/* Top Banner & Filter Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 glass-panel p-5 rounded-3xl">
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

          <button
            onClick={onOpenNewOT}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Crear OT</span>
          </button>
        </div>
      </div>

      {/* Low Stock Alert Banner (If Any) */}
      {inventario.repuestos_bajo_stock > 0 && (
        <div className="p-4 glass-card bg-amber-50/60 border-amber-200/80 rounded-2xl flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-100 text-amber-800 rounded-xl shrink-0">
              <AlertTriangle className="w-5 h-5 text-amber-700" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-950">
                Alerta de Inventario: {inventario.repuestos_bajo_stock} Repuesto(s) Bajo Stock Mínimo
              </p>
              <p className="text-[11px] text-amber-800">
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
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-2xl group"
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
          <div className="mt-3 flex items-center gap-2 text-[11px] text-slate-500 border-t border-white/60 pt-2">
            <span className="text-rose-600 font-bold">{ordenes_trabajo.vencidas} vencidas</span>
            <span>•</span>
            <span className="text-[#0F434A] font-medium">{ordenes_trabajo.correctivas} correctivas / {ordenes_trabajo.preventivas} preventivas</span>
          </div>
        </div>

        {/* Card 2: Total Costs */}
        <div
          onClick={() => onNavigateTab('inventario')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-2xl group"
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
          <div className="mt-3 flex items-center justify-between text-[11px] text-slate-500 border-t border-white/60 pt-2">
            <span>Mano Obra: ${costos.mano_obra.toFixed(0)}</span>
            <span>Repuestos: ${costos.materiales.toFixed(0)}</span>
          </div>
        </div>

        {/* Card 3: Downtime & MTTR */}
        <div
          onClick={() => onNavigateTab('maquinas')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-2xl group"
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
          <div className="mt-3 text-[11px] text-slate-500 border-t border-white/60 pt-2">
            <span>{tiempo_inactividad.ordenes_con_downtime} OTs generaron paro de producción</span>
          </div>
        </div>

        {/* Card 4: Inventory Health */}
        <div
          onClick={() => onNavigateTab('inventario')}
          className="cursor-pointer glass-card glass-card-hover p-5 rounded-2xl group"
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
          <div className="mt-3 flex items-center justify-between text-[11px] border-t border-white/60 pt-2">
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
          <div className="glass-card p-5 rounded-3xl">
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
                  <p className="text-[11px] font-semibold text-slate-500 truncate">{stName}</p>
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
                      <div className="flex justify-between text-[11px] mb-1">
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
            <div className="glass-card p-5 rounded-3xl flex flex-col justify-between">
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

              <div className="mt-4 pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Cumplimiento de Pautas</span>
                <span className="px-2.5 py-0.5 bg-[#D9EDEE] text-[#0F434A] font-bold rounded-md border border-[#3D848C]/50">98.5% OK</span>
              </div>
            </div>

            {/* Quick Actions Shortcuts */}
            <div className="bg-gradient-to-br from-[#165B62] to-[#0F434A] p-5 rounded-3xl text-white shadow-md flex flex-col justify-between border border-white/30">
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
                  <p className="text-[10px] text-emerald-100">Terreno sin Login</p>
                </button>

                <button
                  onClick={onOpenNewSparePart}
                  className="p-2.5 bg-white/15 hover:bg-white/25 rounded-xl text-left transition-colors border border-white/20 cursor-pointer"
                >
                  <Package className="w-4 h-4 text-emerald-200 mb-1" />
                  <p className="text-xs font-bold">+ Insumo</p>
                  <p className="text-[10px] text-emerald-100">Alta de Repuesto</p>
                </button>
              </div>
            </div>

          </div>

        </div>

        {/* Right Col: Top Machines Rankings */}
        <div className="space-y-6">
          <div className="glass-card p-5 rounded-3xl">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/60">
              <h2 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-[#165B62]" />
                Top Máquinas por Costo / Downtime
              </h2>
            </div>

            {/* Ranking list */}
            <div className="space-y-3">
              {top_maquinas.por_costo.map((item, idx) => (
                <div key={item.id} className="p-3 bg-white/40 rounded-2xl border border-white/60 flex items-center justify-between shadow-2xs">
                  <div className="flex items-center gap-2.5">
                    <span className="w-6 h-6 rounded-full bg-[#D9EDEE] text-[#0F434A] text-xs font-bold flex items-center justify-center shrink-0 border border-[#3D848C]/60">
                      #{idx + 1}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-800">{item.nombre}</p>
                      <p className="text-[10px] text-slate-500">{item.codigo}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-slate-800">${item.costo_total.toFixed(2)}</p>
                    <p className="text-[10px] text-slate-500">Costo total OT</p>
                  </div>
                </div>
              ))}
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

    </div>
  );
};
