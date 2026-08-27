import React, { useState, useRef } from 'react';
import {
  QrCode,
  Search,
  Camera,
  ImagePlus,
  Building2,
  Gauge,
  Activity,
  Clock,
  Wrench,
  FileText,
  BookOpen,
  GraduationCap,
  FolderOpen,
  AlertTriangle,
  Plus,
  RefreshCw,
  Calendar,
  CheckCircle2,
  XCircle,
  ChevronRight,
  Shield
} from 'lucide-react';
import jsQR from 'jsqr';
import { QrPublicInfo, WorkOrder } from '../types';
import { api } from '../services/api';
import { QrCameraScanner } from './QrCameraScanner';

/** Scan a File for QR codes using jsQR (pure JS, works reliably with images) */
async function scanImageWithJsQR(file: File): Promise<string | null> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) { resolve(null); return; }

      // Ensure minimum size for better detection
      let w = img.width;
      let h = img.height;
      const minSize = 300;
      if (w < minSize || h < minSize) {
        const scale = minSize / Math.min(w, h);
        w = Math.floor(w * scale);
        h = Math.floor(h * scale);
      }

      canvas.width = w;
      canvas.height = h;
      ctx.drawImage(img, 0, 0, w, h);

      const imageData = ctx.getImageData(0, 0, w, h);
      const code = jsQR(imageData.data, w, h, { inversionAttempts: 'attemptBoth' });
      URL.revokeObjectURL(img.src);
      resolve(code?.data ?? null);
    };
    img.onerror = () => resolve(null);
    img.src = URL.createObjectURL(file);
  });
}

interface QrScannerViewProps {
  onCreateWorkOrder?: (machineId: number, machineName: string) => void;
}

export const QrScannerView: React.FC<QrScannerViewProps> = ({ onCreateWorkOrder }) => {
  const [qrCode, setQrCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QrPublicInfo | null>(null);
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [isImageScanning, setIsImageScanning] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Extract QR token from a value that could be a full URL or just the code
  const extractQrToken = (raw: string): string => {
    const trimmed = raw.trim();
    if (!trimmed) return '';

    // If it's a URL, extract the last meaningful path segment
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const segments = url.pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment) return decodeURIComponent(lastSegment);
      } catch {}
    }

    // Remove any surrounding quotes or whitespace
    let token = trimmed.replace(/^["']+|["']+$/g, '').trim();

    // If it contains a URL-like pattern mid-string, try to extract
    const urlMatch = token.match(/https?:\/\/[^\s]+/);
    if (urlMatch) {
      try {
        const url = new URL(urlMatch[0]);
        const segments = url.pathname.split('/').filter(Boolean);
        const lastSegment = segments[segments.length - 1];
        if (lastSegment) return decodeURIComponent(lastSegment);
      } catch {}
    }

    return token;
  };



  const handleSearch = async () => {
    if (!qrCode.trim()) return;
    setLoading(true);
    setError(null);
    setQrData(null);
    try {
      const token = extractQrToken(qrCode);
      const data = await api.getPublicQrInfo(token);
      setQrData(data);
    } catch (err: any) {
      setError('No se encontró equipo con ese código QR o no hay conexión con la API.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSearch();
  };

  const handleScanFromImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImageScanning(true);
    setError(null);

    try {
      if (!file.type.startsWith('image/')) {
        setError(`El archivo no es una imagen válida. Tipo: ${file.type}`);
        return;
      }

      const result = await scanImageWithJsQR(file);
      if (!result) {
        setError('No se detectó código QR en la imagen. Asegúrate de que el código sea visible y esté bien enfocado.');
        return;
      }

      const token = extractQrToken(result);
      setQrCode(token);
      setQrData(null);
      const data = await api.getPublicQrInfo(token);
      setQrData(data);
      setError(null);
    } catch {
      setError('Error al procesar la imagen. Intenta con otra foto.');
    } finally {
      setIsImageScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6">

      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <QrCode className="w-6 h-6 text-[#165B62]" />
            Escáner QR de Maquinaria
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Consulta la ficha técnica, historial de mantenimiento y documentos de cualquier equipo escaneando o ingresando su código QR
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="glass-panel p-4 rounded-2xl flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={qrCode}
            onChange={(e) => setQrCode(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ingresa el código QR o token del equipo (ej: a-56-234, 39c6ae1f-...)"
            className="w-full pl-9 pr-3 py-2.5 text-xs glass-input rounded-xl focus:outline-none font-mono"
          />
        </div>
        <button
          onClick={() => setIsCameraOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-[#D9EDEE] hover:bg-[#A9CDD0] border border-[#3D848C]/60 rounded-xl transition-all cursor-pointer shrink-0"
          title="Escanear código QR con la cámara"
        >
          <Camera className="w-4 h-4" />
          <span className="hidden sm:inline">Cámara</span>
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture={false}
          onChange={handleScanFromImage}
          className="hidden"
          id="qr-file-input"
        />
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isImageScanning}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-700 bg-[#D9EDEE] hover:bg-[#A9CDD0] border border-[#3D848C]/60 rounded-xl transition-all cursor-pointer shrink-0"
          title="Subir imagen y escanear código QR"
        >
          {isImageScanning ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <ImagePlus className="w-4 h-4" />
          )}
          <span className="hidden sm:inline">{isImageScanning ? 'Analizando...' : 'Imagen'}</span>
        </button>
        <button
          onClick={handleSearch}
          disabled={loading || !qrCode.trim()}
          className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer disabled:opacity-50 shrink-0"
        >
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : (
            <Search className="w-4 h-4" />
          )}
          <span>{loading ? 'Buscando...' : 'Buscar Equipo'}</span>
        </button>
      </div>

      {/* Error */}
      {error && (
        <div className="glass-panel p-4 rounded-2xl border border-rose-200 bg-rose-50/50 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <p className="flex-1 text-xs font-medium text-rose-700">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-rose-400 hover:text-rose-600 cursor-pointer shrink-0"
          >
            <XCircle className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Results */}
      {qrData && (
        <div className="space-y-6">

          {/* ═══ Machine Info Card ═══ */}
          <div className="glass-panel p-6 rounded-3xl shadow-sm">
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#3D848C] to-[#165B62] flex items-center justify-center text-white shrink-0 shadow-md">
                  <Wrench className="w-7 h-7" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-lg font-extrabold text-slate-800">{qrData.maquina.nombre}</h2>
                    <span className="font-mono text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[#D9EDEE] text-[#0F434A] border border-[#3D848C]/50">
                      {qrData.maquina.codigo}
                    </span>
                    {qrData.maquina.activo ? (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Activo
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200">
                        <XCircle className="w-3 h-3" /> Inactivo
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {qrData.maquina.marca && <span>Marca: <strong>{qrData.maquina.marca}</strong> • </span>}
                    <span>Área: <strong>{qrData.maquina.area || 'N/A'}</strong> • </span>
                    <span>Planta: <strong>{qrData.maquina.planta || 'N/A'}</strong></span>
                  </p>
                  {qrData.maquina.descripcion && (
                    <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">{qrData.maquina.descripcion}</p>
                  )}
                </div>
              </div>

              {/* Create Work Order Button */}
              <button
                onClick={() => onCreateWorkOrder?.(qrData.maquina.id, qrData.maquina.nombre)}
                className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                <span>Crear Orden de Trabajo</span>
              </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/60">
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Total Mantenimientos</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{qrData.total_mantenimientos}</p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Historial OTs</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">{qrData.historial.length}</p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Próximo Mant.</p>
                <p className="text-sm font-bold text-slate-800 mt-0.5">
                  {qrData.proximo_mantenimiento
                    ? new Date(qrData.proximo_mantenimiento).toLocaleDateString('es-ES')
                    : 'Sin programar'}
                </p>
              </div>
              <div className="p-3 bg-white/40 rounded-xl border border-white/60">
                <p className="text-[10px] text-slate-500 font-bold uppercase">Documentos</p>
                <p className="text-xl font-black text-slate-800 mt-0.5">
                  {qrData.manuales.length + qrData.tutoriales.length + qrData.otros_documentos.length}
                </p>
              </div>
            </div>
          </div>

          {/* ═══ Ficha Técnica ═══ */}
          {qrData.maquina.ficha_tecnica && qrData.maquina.ficha_tecnica.length > 0 && (
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-[#165B62]" /> Ficha Técnica
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {qrData.maquina.ficha_tecnica.map((spec, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs text-slate-600 bg-white/30 p-2 rounded-lg border border-white/40">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#165B62] shrink-0" />
                    <span>{spec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ Maintenance History ═══ */}
          <div className="glass-panel p-5 rounded-2xl">
            <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-[#165B62]" /> Historial de Mantenimiento ({qrData.historial.length})
            </h3>
            {qrData.historial.length === 0 ? (
              <div className="py-8 text-center">
                <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400">Sin historial de mantenimiento registrado para este equipo.</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {qrData.historial.map((ot) => (
                  <div key={ot.id} className="p-3 bg-white/40 border border-white/60 rounded-xl flex items-center justify-between">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-8 h-8 rounded-lg bg-[#D9EDEE] flex items-center justify-center text-[#0F434A] shrink-0">
                        <Wrench className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-800">{ot.numero}</span>
                          <span className="text-[10px] font-bold px-2 py-0.5 bg-white/60 text-slate-700 rounded-full border border-white/80">
                            {ot.estado?.nombre || 'N/A'}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 truncate mt-0.5">{ot.descripcion_problema_inicial}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0 ml-3">
                      <p className="text-xs font-extrabold text-[#0F434A]">${ot.costo_total}</p>
                      <p className="text-[10px] text-slate-400">{new Date(ot.created_at).toLocaleDateString('es-ES')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ═══ Documents Section ═══ */}
          {(qrData.manuales.length > 0 || qrData.tutoriales.length > 0 || qrData.otros_documentos.length > 0) && (
            <div className="glass-panel p-5 rounded-2xl">
              <h3 className="text-xs font-extrabold text-slate-700 uppercase tracking-wide mb-3 flex items-center gap-1.5">
                <FolderOpen className="w-3.5 h-3.5 text-[#165B62]" /> Documentos y Recursos
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Manuales */}
                {qrData.manuales.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Manuales ({qrData.manuales.length})
                    </p>
                    {qrData.manuales.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white/40 border border-white/60 rounded-xl hover:bg-[#D9EDEE]/50 transition-colors text-xs text-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#165B62] shrink-0" />
                        <span className="truncate">{doc.titulo}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Tutoriales */}
                {qrData.tutoriales.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <GraduationCap className="w-3 h-3" /> Tutoriales ({qrData.tutoriales.length})
                    </p>
                    {qrData.tutoriales.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white/40 border border-white/60 rounded-xl hover:bg-[#D9EDEE]/50 transition-colors text-xs text-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#165B62] shrink-0" />
                        <span className="truncate">{doc.titulo}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
                      </a>
                    ))}
                  </div>
                )}

                {/* Otros documentos */}
                {qrData.otros_documentos.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-slate-500 uppercase flex items-center gap-1">
                      <FileText className="w-3 h-3" /> Otros ({qrData.otros_documentos.length})
                    </p>
                    {qrData.otros_documentos.map((doc) => (
                      <a
                        key={doc.id}
                        href={doc.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 p-2 bg-white/40 border border-white/60 rounded-xl hover:bg-[#D9EDEE]/50 transition-colors text-xs text-slate-700"
                      >
                        <FileText className="w-3.5 h-3.5 text-[#165B62] shrink-0" />
                        <span className="truncate">{doc.titulo}</span>
                        <ChevronRight className="w-3 h-3 text-slate-400 shrink-0 ml-auto" />
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

        </div>
      )}

      {/* Empty state */}
      {!qrData && !loading && !error && (
        <div className="glass-panel py-16 text-center rounded-3xl">
          <QrCode className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-sm font-bold text-slate-700">Ingresa un código QR para consultar el equipo</p>
          <p className="text-xs text-slate-400 mt-1">Puedes escanear el código QR con la cámara o escribirlo manualmente en el campo de búsqueda.</p>
          <button
            onClick={() => setIsCameraOpen(true)}
            className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            <span>Abrir Cámara QR</span>
          </button>
        </div>
      )}

      {/* Camera Scanner Modal */}
      <QrCameraScanner
        isOpen={isCameraOpen}
        onClose={() => setIsCameraOpen(false)}
        onScan={(code) => {
          const token = extractQrToken(code);
          setQrCode(token);
          setIsCameraOpen(false);
          // Auto-search with scanned code
          setLoading(true);
          setError(null);
          setQrData(null);
          api.getPublicQrInfo(token).then((data) => {
            setQrData(data);
            setError(null);
          }).catch(() => {
            setError(`No se encontró equipo con el código "${token}". Verifica que el QR pertenezca a una máquina registrada.`);
          }).finally(() => {
            setLoading(false);
          });
        }}
      />

    </div>
  );
};
