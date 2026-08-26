import React, { useState } from 'react';
import { X, QrCode, AlertCircle, Camera, CheckCircle2, Send, Building } from 'lucide-react';
import { api } from '../services/api';
import { Priority, Machine } from '../types';

interface PublicQrReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onReportCreated: () => void;
}

export const PublicQrReportModal: React.FC<PublicQrReportModalProps> = ({
  isOpen,
  onClose,
  onReportCreated
}) => {
  const [qrToken, setQrToken] = useState('MANTIS-QR-EQ2001-A9X');
  const [machineInfo, setMachineInfo] = useState<Machine | null>(null);
  const [loadingQr, setLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);

  // Form State
  const [reporterName, setReporterName] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [priority, setPriority] = useState<Priority>('alta');
  const [description, setDescription] = useState('');
  const [photoUrl, setFotoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleLookupQr = async () => {
    if (!qrToken.trim()) return;
    setLoadingQr(true);
    setQrError(null);
    try {
      const res = await api.getPublicQrInfo(qrToken.trim());
      setMachineInfo(res.maquina);
    } catch (err: any) {
      setQrError('No se encontró equipo con ese código o token QR');
      setMachineInfo(null);
    } finally {
      setLoadingQr(false);
    }
  };

  const handleSubmitReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reporterName.trim() || !description.trim()) return;

    setIsSubmitting(true);
    try {
      const ot = await api.reportPublicBreakdown(qrToken.trim(), {
        reportado_por_nombre: reporterName,
        reportado_por_contacto: contactInfo,
        prioridad: priority,
        descripcion_problema_inicial: description,
        foto_inicial_url: photoUrl || null
      });

      setSubmitSuccess(`¡Orden de Trabajo ${ot.numero} generada con éxito para ${ot.maquina.nombre}!`);
      setTimeout(() => {
        onReportCreated();
        setSubmitSuccess(null);
        onClose();
      }, 2000);
    } catch (err: any) {
      alert(`Error al generar reporte: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-emerald-100 max-h-[90vh] overflow-y-auto">
        
        <div className="flex items-center justify-between pb-4 border-b border-stone-100">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-100 text-emerald-800 rounded-lg">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-stone-900">Reporte Terreno vía QR (Public API)</h3>
              <p className="text-xs text-stone-500">Reporta una falla sin requerir inicio de sesión</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-stone-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {submitSuccess ? (
          <div className="py-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <h4 className="text-base font-bold text-stone-900">{submitSuccess}</h4>
            <p className="text-xs text-stone-500">El equipo de mantenimiento ha sido notificado en el Dashboard Principal.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmitReport} className="py-4 space-y-4">
            
            {/* Step 1: Token Input or Select */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">
                Token QR o Código de la Máquina
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={qrToken}
                  onChange={(e) => setQrToken(e.target.value)}
                  placeholder="Ej: MANTIS-QR-EQ2001-A9X"
                  className="flex-1 px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400 font-mono"
                />
                <button
                  type="button"
                  onClick={handleLookupQr}
                  disabled={loadingQr}
                  className="px-3 py-2 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shrink-0"
                >
                  {loadingQr ? 'Buscando...' : 'Buscar Equipo'}
                </button>
              </div>

              {/* Sample QR presets */}
              <div className="flex items-center gap-1.5 mt-2 flex-wrap text-[11px] text-stone-500">
                <span>Presets de prueba:</span>
                <button
                  type="button"
                  onClick={() => { setQrToken('MANTIS-QR-EQ2001-A9X'); handleLookupQr(); }}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-100 text-emerald-800 rounded border border-stone-200"
                >
                  Extrusora Linea A
                </button>
                <button
                  type="button"
                  onClick={() => { setQrToken('MANTIS-QR-EQ2002-K3Y'); handleLookupQr(); }}
                  className="px-2 py-0.5 bg-stone-100 hover:bg-emerald-100 text-emerald-800 rounded border border-stone-200"
                >
                  Prensa 200T
                </button>
              </div>

              {qrError && (
                <p className="text-xs text-rose-600 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  {qrError}
                </p>
              )}

              {machineInfo && (
                <div className="mt-3 p-3 bg-emerald-50/70 border border-emerald-200 rounded-xl flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-emerald-950">{machineInfo.nombre}</p>
                    <p className="text-[11px] text-emerald-700">{machineInfo.codigo} • Área: {machineInfo.area || 'General'}</p>
                  </div>
                  <span className="text-[10px] font-bold bg-emerald-200 text-emerald-800 px-2 py-0.5 rounded-full">
                    Equipo Identificado
                  </span>
                </div>
              )}
            </div>

            {/* Reporter Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Tu Nombre / Operador *</label>
                <input
                  type="text"
                  required
                  value={reporterName}
                  onChange={(e) => setReporterName(e.target.value)}
                  placeholder="Ej: Marcos Ramírez"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-700 mb-1">Teléfono o Contacto</label>
                <input
                  type="text"
                  value={contactInfo}
                  onChange={(e) => setContactInfo(e.target.value)}
                  placeholder="Ej: +56 9 8877 6655"
                  className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
                />
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Nivel de Urgencia / Prioridad</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              >
                <option value="baja">Baja - Puede esperar planeación</option>
                <option value="media">Media - Atención en el turno</option>
                <option value="alta">Alta - Detiene producción parcialmente</option>
                <option value="critica">Crítica - PARADA DE PLANTA URGENTE</option>
              </select>
            </div>

            {/* Problem Description */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1">Descripción de la Falla / Síntomas *</label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe el ruido, fugas, humo, vibración o comportamiento anómalo de la máquina..."
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Optional Photo URL */}
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-1 flex items-center gap-1">
                <Camera className="w-3.5 h-3.5 text-stone-500" />
                URL Fotografía de Evidencia (Opcional)
              </label>
              <input
                type="url"
                value={photoUrl}
                onChange={(e) => setFotoUrl(e.target.value)}
                placeholder="https://ejemplo.com/foto_terreno.jpg"
                className="w-full px-3 py-2 text-xs bg-stone-50 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-400"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-100">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !reporterName.trim() || !description.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 rounded-lg shadow-sm"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSubmitting ? 'Enviando Reporte...' : 'Enviar Reporte a Mantenimiento'}</span>
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
};
