import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Camera, CameraOff, X, RefreshCw, ScanLine, Zap, SwitchCamera } from 'lucide-react';
import { Html5Qrcode } from 'html5-qrcode';

interface QrCameraScannerProps {
  onScan: (decodedText: string) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const QrCameraScanner: React.FC<QrCameraScannerProps> = ({ onScan, isOpen, onClose }) => {
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [continuousMode, setContinuousMode] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanCount, setScanCount] = useState(0);
  const [facingMode, setFacingMode] = useState<'environment' | 'user'>('environment');
  const [canSwitchCamera, setCanSwitchCamera] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScanRef = useRef<string>('');
  const cooldownRef = useRef(false);
  const continuousModeRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    continuousModeRef.current = continuousMode;
  }, [continuousMode]);

  const handleDetected = useCallback((decodedText: string) => {
    // In single mode: skip if same code within 3s
    // In continuous mode: skip if same code within 1.5s
    const cooldownMs = continuousModeRef.current ? 1500 : 3000;
    if (cooldownRef.current || decodedText === lastScanRef.current) return;
    lastScanRef.current = decodedText;
    cooldownRef.current = true;
    setTimeout(() => { cooldownRef.current = false; }, cooldownMs);

    // Vibrate on mobile
    if (navigator.vibrate) navigator.vibrate(200);

    setLastScannedCode(decodedText);
    setScanCount(prev => prev + 1);

    if (!continuousModeRef.current) {
      // Single mode: close immediately
      onScan(decodedText);
    }
    // In continuous mode: just show the banner, user confirms manually
  }, [onScan]);

  const startScanner = async () => {
    if (!containerRef.current) return;

    setError(null);
    setScanning(true);

    try {
      if (scannerRef.current) {
        try { await scannerRef.current.stop(); } catch {}
        try { scannerRef.current.clear(); } catch {}
      }

      const scanner = new Html5Qrcode('qr-camera-reader');
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1.0,
        },
        (decodedText) => handleDetected(decodedText),
        () => {}
      );

      // Check if multiple cameras are available
      try {
        const devices = await Html5Qrcode.getCameras();
        setCanSwitchCamera(devices.length > 1);
      } catch {
        setCanSwitchCamera(false);
      }

      setHasPermission(true);
    } catch (err: any) {
      console.error('QR Scanner error:', err);
      if (err?.toString?.().includes('Permission')) {
        setHasPermission(false);
        setError('Permiso de cámara denegado. Habilita el acceso en la configuración del navegador.');
      } else {
        setError('No se pudo iniciar la cámara. Verifica que no esté en uso por otra aplicación.');
      }
      setScanning(false);
    }
  };

  const stopScanner = async () => {
    if (scannerRef.current) {
      try { await scannerRef.current.stop(); } catch {}
      try { scannerRef.current.clear(); } catch {}
      scannerRef.current = null;
    }
    setScanning(false);
  };

  const handleConfirmScan = () => {
    if (lastScannedCode) {
      onScan(lastScannedCode);
    }
  };

  const handleRescan = () => {
    setLastScannedCode(null);
    lastScanRef.current = '';
  };

  const handleSwitchCamera = async () => {
    const newMode = facingMode === 'environment' ? 'user' : 'environment';
    setFacingMode(newMode);
    setLastScannedCode(null);
    lastScanRef.current = '';
    await stopScanner();
    // Small delay to release camera stream
    setTimeout(() => startScanner(), 300);
  };

  useEffect(() => {
    if (isOpen) {
      startScanner();
      setLastScannedCode(null);
      setScanCount(0);
      setFacingMode('environment');
      lastScanRef.current = '';
    } else {
      stopScanner();
    }
    return () => { stopScanner(); };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
      <div className="glass-modal rounded-3xl max-w-sm w-full p-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-base text-slate-800">Escanear QR</h3>
              <p className="text-[10px] text-slate-500">Apunta la cámara al código QR de la máquina</p>
            </div>
          </div>
          <button
            onClick={() => { stopScanner(); onClose(); }}
            className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Camera viewport */}
        <div className="mt-4 space-y-3">
          <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-slate-700 aspect-square">
            <div
              ref={containerRef}
              id="qr-camera-reader"
              className="w-full h-full [&>video]:rounded-2xl [&>video]:object-cover"
            />

            {/* Scan overlay */}
            {scanning && (
              <div className="absolute inset-0 pointer-events-none">
                {/* Switch camera button */}
                {canSwitchCamera && (
                  <button
                    onClick={handleSwitchCamera}
                    className="absolute top-3 right-3 z-10 p-2 bg-slate-900/60 hover:bg-slate-900/80 text-white rounded-full transition-colors cursor-pointer pointer-events-auto"
                    title={facingMode === 'environment' ? 'Cambiar a cámara frontal' : 'Cambiar a cámara trasera'}
                  >
                    <SwitchCamera className="w-4 h-4" />
                  </button>
                )}
                <div className="absolute top-4 left-4 w-8 h-8 border-t-2 border-l-2 border-[#3D848C] rounded-tl-lg" />
                <div className="absolute top-4 right-4 w-8 h-8 border-t-2 border-r-2 border-[#3D848C] rounded-tr-lg" />
                <div className="absolute bottom-4 left-4 w-8 h-8 border-b-2 border-l-2 border-[#3D848C] rounded-bl-lg" />
                <div className="absolute bottom-4 right-4 w-8 h-8 border-b-2 border-r-2 border-[#3D848C] rounded-br-lg" />
                <div className="absolute left-4 right-4 top-1/2 h-0.5 bg-[#3D848C]/60 animate-pulse" />
              </div>
            )}

            {/* Scanned code banner (overlay on camera) */}
            {scanning && lastScannedCode && continuousMode && (
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-900/95 via-slate-900/80 to-transparent p-4 pt-8 pointer-events-auto">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                  <span className="text-[10px] font-bold text-emerald-400 uppercase">
                    Detectado ({scanCount})
                  </span>
                </div>
                <p className="font-mono text-sm font-bold text-white break-all mb-3">{lastScannedCode}</p>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleConfirmScan}
                    className="flex-1 px-3 py-2 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-xl transition-colors cursor-pointer"
                  >
                    Usar Este Código
                  </button>
                  <button
                    onClick={handleRescan}
                    className="px-3 py-2 text-xs font-semibold text-white/80 hover:text-white bg-white/10 hover:bg-white/20 rounded-xl transition-colors cursor-pointer"
                  >
                    Otro QR
                  </button>
                </div>
              </div>
            )}

            {/* Error overlay */}
            {!scanning && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/80 text-white p-4">
                <CameraOff className="w-10 h-10 text-slate-400 mb-2" />
                <p className="text-xs text-slate-300 text-center">{error || 'Cámara no disponible'}</p>
              </div>
            )}
          </div>

          {/* Continuous mode toggle */}
          <div className="flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <ScanLine className="w-3.5 h-3.5 text-slate-500" />
              <span className="text-[11px] font-semibold text-slate-600">Modo Continuo</span>
            </div>
            <button
              onClick={() => {
                setContinuousMode(!continuousMode);
                setLastScannedCode(null);
                lastScanRef.current = '';
              }}
              className={`relative w-10 h-5 rounded-full transition-colors cursor-pointer ${
                continuousMode ? 'bg-[#3D848C]' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${
                  continuousMode ? 'translate-x-5' : ''
                }`}
              />
            </button>
          </div>
          <p className="text-[10px] text-slate-400 -mt-1 px-1">
            {continuousMode
              ? 'La cámara se mantiene abierta. Escanea varios códigos y confirma cuál usar.'
              : 'Se cierra automáticamente al detectar un código.'}
          </p>

          {/* Controls */}
          <div className="flex items-center gap-2">
            {scanning ? (
              <button
                onClick={stopScanner}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-900 hover:text-white bg-rose-500 hover:bg-rose-600 rounded-xl transition-colors cursor-pointer"
              >
                <CameraOff className="w-4 h-4" />
                <span>Detener Cámara</span>
              </button>
            ) : (
              <button
                onClick={startScanner}
                className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl transition-colors cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Reintentar Cámara</span>
              </button>
            )}
            <button
              onClick={() => { stopScanner(); onClose(); }}
              className="px-3 py-2.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
            >
              Cerrar
            </button>
          </div>

          {/* Permission hint */}
          {hasPermission === false && (
            <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-700 text-center">
              Ve a <strong>Configuración → Privacidad → Cámara</strong> y habilita el acceso para este sitio.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
