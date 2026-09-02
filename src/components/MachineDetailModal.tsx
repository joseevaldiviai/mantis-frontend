import React, { useState, useEffect } from 'react';
import {
  X,
  QrCode,
  Activity,
  FileSpreadsheet,
  Clock,
  Wrench,
  Gauge,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  ChevronDown
} from 'lucide-react';
import { Machine, MachineKpi, MeterReading, WorkOrder } from '../types';
import { api } from '../services/api';

interface MachineDetailModalProps {
  machine: Machine | null;
  onClose: () => void;
  onReload: () => void;
}

export const MachineDetailModal: React.FC<MachineDetailModalProps> = ({
  machine,
  onClose,
  onReload
}) => {
  const [activeTab, setActiveTab] = useState<'qr' | 'contadores' | 'kpis' | 'historial'>('qr');
  const [openSections, setOpenSections] = useState<Set<string>>(new Set(['qr']));
  const toggleSection = (id: string) => {
    setOpenSections(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };
  const [kpis, setKpis] = useState<MachineKpi | null>(null);
  const [historyOTs, setHistoryOTs] = useState<WorkOrder[]>([]);

  // Meter Reading State
  const [meterType, setMeterType] = useState('Horas de Uso');
  const [meterValue, setMeterValue] = useState(14500);
  const [isSubmittingMeter, setIsSubmittingMeter] = useState(false);

  // QR Regeneration State
  const [qrToken, setQrToken] = useState<string>('');
  const [isRegeneratingQr, setIsRegeneratingQr] = useState(false);
  const [qrImageUrl, setQrImageUrl] = useState<string>('');

  useEffect(() => {
    if (machine) {
      setQrToken(machine.qr_token);
      let currentUrl = '';
      api.getMachineQrImageUrl(machine.id).then(url => {
        currentUrl = url;
        setQrImageUrl(url);
      }).catch(() => {});
      api.getMachineKpis(machine.id).then(setKpis).catch(() => {});
      api.getWorkOrders().then(ots => {
        setHistoryOTs(ots.filter(w => w.maquina.id === machine.id));
      });
      return () => {
        if (currentUrl && currentUrl.startsWith('blob:')) URL.revokeObjectURL(currentUrl);
      };
    }
  }, [machine]);

  if (!machine) return null;

  const handleRegenerateQr = async () => {
    if (!confirm('¿Desea regenerar el token QR? El código QR físico impreso anteriormente quedará invalidado.')) return;
    setIsRegeneratingQr(true);
    try {
      await api.regenerateMachineQr(machine.id);
      const refreshed = await api.getMachine(machine.id);
      setQrToken(refreshed.qr_token);
      const newImageUrl = await api.getMachineQrImageUrl(machine.id);
      setQrImageUrl(newImageUrl);
      onReload();
    } catch (e: any) {
      alert(`Error al regenerar QR: ${e.message}`);
    } finally {
      setIsRegeneratingQr(false);
    }
  };

  const handleAddMeterReading = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmittingMeter(true);
    try {
      await api.addMeterReading(machine.id, meterType, Number(meterValue));
      alert('Lectura de contador registrada con éxito');
      setMeterValue(meterValue + 50);
      api.getMachineKpis(machine.id).then(setKpis);
    } catch (e: any) {
      alert(`Error: ${e.message}`);
    } finally {
      setIsSubmittingMeter(false);
    }
  };

  const handleExportHistoryCsv = async () => {
    try {
      await api.downloadMachineHistoryCsv(
        machine.id,
        `Historial_Mantenimiento_${machine.codigo}_${new Date().toISOString().slice(0, 10)}.csv`
      );
    } catch (e: any) {
      alert(`Error al exportar historial: ${e.message}`);
    }
  };

  const handleDownloadQr = async () => {
    try {
      const url = await api.getMachineQrImageUrl(machine.id);
      const a = document.createElement('a');
      a.href = url;
      a.download = `QR_${machine.codigo}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e: any) {
      alert(`Error al descargar QR: ${e.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="glass-modal rounded-xl max-w-2xl w-full p-6 shadow-2xl max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-white/60">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg text-slate-800">{machine.nombre}</span>
              <span className="text-[11px] font-bold px-2 py-0.5 rounded-lg bg-[#D9EDEE] text-[#0F434A] font-mono border border-[#3D848C]/50">
                {machine.codigo}
              </span>
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Marca: {machine.marca || 'N/A'} • Área: {machine.area || 'Planta Principal'}
            </p>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation - Desktop */}
        <div className="hidden md:flex items-center gap-1 border-b border-white/60 py-2 text-xs font-semibold">
          <button
            onClick={() => setActiveTab('qr')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'qr' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <QrCode className="w-3.5 h-3.5" /> Ficha & Código QR
          </button>

          <button
            onClick={() => setActiveTab('contadores')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'contadores' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Gauge className="w-3.5 h-3.5" /> Horómetro / Contadores
          </button>

          <button
            onClick={() => setActiveTab('kpis')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'kpis' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Activity className="w-3.5 h-3.5" /> KPIs (MTTR / Costos)
          </button>

          <button
            onClick={() => setActiveTab('historial')}
            className={`px-3 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer ${
              activeTab === 'historial' ? 'bg-[#D9EDEE] text-[#0F434A] font-bold border border-[#3D848C]/60' : 'text-slate-600 hover:bg-white/40'
            }`}
          >
            <Wrench className="w-3.5 h-3.5" /> Historial OTs ({historyOTs.length})
          </button>
        </div>

        {/* Accordion - Mobile */}
        <div className="md:hidden overflow-y-auto py-4 space-y-3">
          {/* QR & Ficha */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('qr')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><QrCode className="w-4 h-4 text-[#165B62]" /> Ficha & Código QR</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('qr') ? 'rotate-180' : ''}`} />
            </button>
            {openSections.has('qr') && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-1 gap-4 items-center text-xs">
                  <div className="p-4 bg-[#D9EDEE]/60 border border-[#3D848C]/50 rounded-lg text-center space-y-3">
                    <p className="font-bold text-[#0F434A] text-xs uppercase tracking-wider">Código QR Terreno</p>
                    <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white inline-block shadow-xs">
                      <img src={qrImageUrl} alt="Machine QR" className="w-36 h-36 mx-auto rounded-lg" />
                    </div>
                    <p className="font-mono text-[12px] text-[#0F434A] font-bold break-all">{qrToken}</p>
                    <div className="flex items-center justify-center gap-2 pt-2">
                      <button onClick={handleDownloadQr} className="flex items-center gap-1 px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl transition-colors cursor-pointer"><Download className="w-3.5 h-3.5" /><span>Descargar QR</span></button>
                      <button onClick={handleRegenerateQr} disabled={isRegeneratingQr} className="flex items-center gap-1 px-3 py-1.5 bg-white/80 border border-white text-slate-800 font-bold rounded-xl hover:bg-white transition-colors cursor-pointer"><RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingQr ? 'animate-spin' : ''}`} /><span>Regenerar QR</span></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="p-3 bg-white/40 rounded-lg border border-white/60 space-y-1">
                      <p className="font-bold text-slate-700 text-xs">Ficha Técnica</p>
                      {machine.ficha_tecnica && machine.ficha_tecnica.length > 0 ? (
                        <ul className="space-y-1 pt-1">{machine.ficha_tecnica.map((spec, i) => <li key={i} className="text-slate-600 flex items-center gap-1.5"><span className="w-1.5 h-1.5 rounded-full bg-[#165B62]"></span><span>{spec}</span></li>)}</ul>
                      ) : <p className="text-slate-400 italic">Sin especificaciones</p>}
                    </div>
                    <div className="p-3 bg-white/40 rounded-lg border border-white/60 space-y-1">
                      <p className="font-bold text-slate-700 text-xs">Ubicación</p>
                      <p className="text-slate-600">Área: <strong>{machine.area || 'N/A'}</strong></p>
                      <p className="text-slate-600">Planta: <strong>{machine.planta || 'Planta Central'}</strong></p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Contadores */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('contadores')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Gauge className="w-4 h-4 text-[#165B62]" /> Horómetro / Contadores</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('contadores') ? 'rotate-180' : ''}`} />
            </button>
            {openSections.has('contadores') && (
              <div className="px-5 pb-5">
                <form onSubmit={handleAddMeterReading} className="p-4 bg-white/40 rounded-lg border border-white/60 space-y-3">
                  <p className="font-bold text-slate-800 text-xs">Registrar Lectura:</p>
                  <div className="grid grid-cols-1 gap-3">
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold text-xs">Tipo de Contador</label>
                      <select value={meterType} onChange={e => setMeterType(e.target.value)} className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none text-xs">
                        <option value="Horas de Uso">Horas de Uso</option>
                        <option value="Ciclos de Prensa">Ciclos de Prensa</option>
                        <option value="Kilómetros">Kilómetros</option>
                        <option value="Unidades Producidas">Unidades Producidas</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-slate-600 mb-1 font-semibold text-xs">Valor Acumulado</label>
                      <input type="number" value={meterValue} onChange={e => setMeterValue(Number(e.target.value))} className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none text-xs" />
                    </div>
                  </div>
                  <button type="submit" disabled={isSubmittingMeter} className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all">{isSubmittingMeter ? 'Guardando...' : 'Guardar Lectura'}</button>
                </form>
              </div>
            )}
          </div>

          {/* KPIs */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('kpis')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Activity className="w-4 h-4 text-[#165B62]" /> KPIs (MTTR / Costos)</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('kpis') ? 'rotate-180' : ''}`} />
            </button>
            {openSections.has('kpis') && kpis && (
              <div className="px-5 pb-5">
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="p-3 bg-[#D9EDEE]/80 rounded-lg border border-[#3D848C]/60"><p className="text-[11px] text-[#0F434A] font-bold uppercase">MTTR</p><p className="text-xl font-black text-slate-800 mt-1">{kpis.ordenes_trabajo.mttr_minutos} min</p></div>
                  <div className="p-3 bg-[#D9EDEE]/80 rounded-lg border border-[#3D848C]/60"><p className="text-[11px] text-[#0F434A] font-bold uppercase">MTBF</p><p className="text-xl font-black text-slate-800 mt-1">{kpis.ordenes_trabajo.mtbf_horas} hrs</p></div>
                  <div className="p-3 bg-white/40 rounded-lg border border-white/60"><p className="text-[11px] text-slate-500 font-bold uppercase">Total OTs</p><p className="text-xl font-black text-slate-800 mt-1">{kpis.ordenes_trabajo.total}</p></div>
                  <div className="p-3 bg-white/40 rounded-lg border border-white/60"><p className="text-[11px] text-slate-500 font-bold uppercase">Costo Mano de Obra</p><p className="text-xl font-black text-[#0F434A] mt-1">${kpis.costos.mano_obra}</p></div>
                  <div className="p-3 bg-white/40 rounded-lg border border-white/60"><p className="text-[11px] text-slate-500 font-bold uppercase">Costo Repuestos</p><p className="text-xl font-black text-[#0F434A] mt-1">${kpis.costos.materiales}</p></div>
                  <div className="p-3 bg-white/40 rounded-lg border border-white/60"><p className="text-[11px] text-slate-500 font-bold uppercase">Downtime Total</p><p className="text-xl font-black text-rose-700 mt-1">{kpis.tiempo_inactividad.horas_totales} hrs</p></div>
                </div>
              </div>
            )}
          </div>

          {/* Historial */}
          <div className="glass-panel rounded-xl overflow-hidden">
            <button onClick={() => toggleSection('historial')} className="w-full flex items-center justify-between px-5 py-4 cursor-pointer">
              <span className="flex items-center gap-2 text-xs font-bold text-slate-800"><Wrench className="w-4 h-4 text-[#165B62]" /> Historial OTs ({historyOTs.length})</span>
              <ChevronDown className={`w-5 h-5 text-slate-500 transition-transform ${openSections.has('historial') ? 'rotate-180' : ''}`} />
            </button>
            {openSections.has('historial') && (
              <div className="px-5 pb-5">
                <div className="flex items-center justify-between mb-3">
                  <p className="font-bold text-slate-800 text-xs">Órdenes de Trabajo:</p>
                  <button onClick={handleExportHistoryCsv} className="flex items-center gap-1 px-3 py-1 bg-[#D9EDEE] hover:bg-[#3D848C] text-[#0F434A] hover:text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"><FileSpreadsheet className="w-3.5 h-3.5" /> Exportar CSV</button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {historyOTs.length === 0 ? <p className="text-slate-400 italic py-4 text-center">Sin historial.</p> : historyOTs.map(w => (
                    <div key={w.id} className="p-3 bg-white/40 border border-white/60 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2"><span className="font-bold text-slate-800">{w.numero}</span><span className="text-[11px] font-bold px-2 py-0.5 bg-white/60 text-slate-700 rounded-full border border-white/80">{w.estado.nombre}</span></div>
                        <p className="text-[12px] text-slate-600 mt-0.5 truncate">{w.descripcion_problema_inicial}</p>
                      </div>
                      <div className="text-right shrink-0"><p className="font-extrabold text-[#0F434A]">${w.costo_total}</p><p className="text-[11px] text-slate-400">{new Date(w.created_at).toLocaleDateString('es-ES')}</p></div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Tab Content - Desktop */}
        <div className="hidden md:block flex-1 overflow-y-auto py-4 space-y-4">
          
          {/* TAB 1: QR CODE & SPECS */}
          {activeTab === 'qr' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 items-center text-xs">
              
              {/* QR Render Card */}
              <div className="p-4 bg-[#D9EDEE]/60 border border-[#3D848C]/50 rounded-lg text-center space-y-3">
                <p className="font-bold text-[#0F434A] text-xs uppercase tracking-wider">Código QR Terreno</p>
                <div className="bg-white/80 backdrop-blur-sm p-3 rounded-lg border border-white inline-block shadow-xs">
                  <img src={qrImageUrl} alt="Machine QR" className="w-36 h-36 mx-auto rounded-lg" />
                </div>
                <p className="font-mono text-[12px] text-[#0F434A] font-bold break-all">{qrToken}</p>

                <div className="flex items-center justify-center gap-2 pt-2">
                  <button
                    onClick={handleDownloadQr}
                    className="flex items-center gap-1 px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Descargar QR</span>
                  </button>
                  <button
                    onClick={handleRegenerateQr}
                    disabled={isRegeneratingQr}
                    className="flex items-center gap-1 px-3 py-1.5 bg-white/80 border border-white text-slate-800 font-bold rounded-xl hover:bg-white transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRegeneratingQr ? 'animate-spin' : ''}`} />
                    <span>Regenerar QR</span>
                  </button>
                </div>
              </div>

              {/* Machine Technical Specs */}
              <div className="space-y-3">
                <div className="p-3 bg-white/40 rounded-lg border border-white/60 space-y-1">
                  <p className="font-bold text-slate-700 text-xs">Ficha Técnica & Parámetros</p>
                  {machine.ficha_tecnica && machine.ficha_tecnica.length > 0 ? (
                    <ul className="space-y-1 pt-1">
                      {machine.ficha_tecnica.map((spec, i) => (
                        <li key={i} className="text-slate-600 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#165B62]"></span>
                          <span>{spec}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-slate-400 italic">Sin especificaciones cargadas</p>
                  )}
                </div>

                <div className="p-3 bg-white/40 rounded-lg border border-white/60 space-y-1">
                  <p className="font-bold text-slate-700 text-xs">Ubicación y Registro</p>
                  <p className="text-slate-600">Área: <strong>{machine.area || 'N/A'}</strong></p>
                  <p className="text-slate-600">Planta: <strong>{machine.planta || 'Planta Central'}</strong></p>
                  <p className="text-slate-600">Fecha Alta: <strong>{new Date(machine.fecha_registro).toLocaleDateString('es-ES')}</strong></p>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: CONTADORES */}
          {activeTab === 'contadores' && (
            <div className="space-y-4 text-xs">
              
              <form onSubmit={handleAddMeterReading} className="p-4 bg-white/40 rounded-lg border border-white/60 space-y-3">
                <p className="font-bold text-slate-800 text-xs">Registrar Lectura de Horómetro o Contador:</p>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Tipo de Contador</label>
                    <select
                      value={meterType}
                      onChange={(e) => setMeterType(e.target.value)}
                      className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                    >
                      <option value="Horas de Uso">Horas de Uso</option>
                      <option value="Ciclos de Prensa">Ciclos de Prensa</option>
                      <option value="Kilómetros">Kilómetros</option>
                      <option value="Unidades Producidas">Unidades Producidas</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-600 mb-1 font-semibold">Valor Acumulado Actual</label>
                    <input
                      type="number"
                      value={meterValue}
                      onChange={(e) => setMeterValue(Number(e.target.value))}
                      className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingMeter}
                  className="px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-bold rounded-xl text-xs cursor-pointer transition-all"
                >
                  {isSubmittingMeter ? 'Guardando...' : 'Guardar Lectura'}
                </button>
              </form>

            </div>
          )}

          {/* TAB 3: KPIS */}
          {activeTab === 'kpis' && kpis && (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 bg-[#D9EDEE]/80 rounded-lg border border-[#3D848C]/60">
                <p className="text-[11px] text-[#0F434A] font-bold uppercase">MTTR (Minutos)</p>
                <p className="text-xl font-black text-slate-800 mt-1">{kpis.ordenes_trabajo.mttr_minutos} min</p>
              </div>

              <div className="p-3 bg-[#D9EDEE]/80 rounded-lg border border-[#3D848C]/60">
                <p className="text-[11px] text-[#0F434A] font-bold uppercase">MTBF (Horas entre Fallas)</p>
                <p className="text-xl font-black text-slate-800 mt-1">{kpis.ordenes_trabajo.mtbf_horas} hrs</p>
              </div>

              <div className="p-3 bg-white/40 rounded-lg border border-white/60">
                <p className="text-[11px] text-slate-500 font-bold uppercase">Total OTs Ejecutadas</p>
                <p className="text-xl font-black text-slate-800 mt-1">{kpis.ordenes_trabajo.total}</p>
              </div>

              <div className="p-3 bg-white/40 rounded-lg border border-white/60">
                <p className="text-[11px] text-slate-500 font-bold uppercase">Costo Mano de Obra</p>
                <p className="text-xl font-black text-[#0F434A] mt-1">${kpis.costos.mano_obra}</p>
              </div>

              <div className="p-3 bg-white/40 rounded-lg border border-white/60">
                <p className="text-[11px] text-slate-500 font-bold uppercase">Costo Repuestos</p>
                <p className="text-xl font-black text-[#0F434A] mt-1">${kpis.costos.materiales}</p>
              </div>

              <div className="p-3 bg-white/40 rounded-lg border border-white/60">
                <p className="text-[11px] text-slate-500 font-bold uppercase">Downtime Total</p>
                <p className="text-xl font-black text-rose-700 mt-1">{kpis.tiempo_inactividad.horas_totales} hrs</p>
              </div>
            </div>
          )}

          {/* TAB 4: HISTORIAL OTS */}
          {activeTab === 'historial' && (
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <p className="font-bold text-slate-800">Órdenes de Trabajo del Equipo:</p>
                <button
                  onClick={handleExportHistoryCsv}
                  className="flex items-center gap-1 px-3 py-1 bg-[#D9EDEE] hover:bg-[#3D848C] text-[#0F434A] hover:text-slate-900 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" /> Exportar Historial CSV
                </button>
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {historyOTs.length === 0 ? (
                  <p className="text-slate-400 italic py-4 text-center">Sin historial de mantenimiento registrado.</p>
                ) : (
                  historyOTs.map(w => (
                    <div key={w.id} className="p-3 bg-white/40 border border-white/60 rounded-lg flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-800">{w.numero}</span>
                          <span className="text-[11px] font-bold px-2 py-0.5 bg-white/60 text-slate-700 rounded-full border border-white/80">
                            {w.estado.nombre}
                          </span>
                        </div>
                        <p className="text-[12px] text-slate-600 mt-0.5 truncate">{w.descripcion_problema_inicial}</p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="font-extrabold text-[#0F434A]">${w.costo_total}</p>
                        <p className="text-[11px] text-slate-400">{new Date(w.created_at).toLocaleDateString('es-ES')}</p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="pt-3 border-t border-white/60 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
          >
            Cerrar Ficha
          </button>
        </div>

      </div>
    </div>
  );
};
