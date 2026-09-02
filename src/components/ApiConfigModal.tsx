import React, { useState } from 'react';
import { X, Server, Key, RefreshCw, CheckCircle, AlertTriangle, Globe } from 'lucide-react';
import { api } from '../services/api';

interface ApiConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiConfigModal: React.FC<ApiConfigModalProps> = ({ isOpen, onClose }) => {
  const [baseUrl, setBaseUrl] = useState(api.getBaseUrl());
  const [token, setToken] = useState(api.getToken());
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [isTesting, setIsTesting] = useState(false);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);
    try {
      api.setBaseUrl(baseUrl);
      api.setToken(token);
      const company = await api.getCurrentCompany();
      setTestResult({
        success: true,
        msg: `Conexión exitosa a la API Sanctum (${company.nombre || 'Empresa detectada'})`
      });
    } catch (err: any) {
      setTestResult({
        success: false,
        msg: `No se pudo conectar a ${baseUrl}: ${err.message || 'Verifique CORS o token'}`
      });
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    api.setBaseUrl(baseUrl);
    api.setToken(token);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
      <div className="glass-modal rounded-xl max-w-lg w-full p-6 shadow-2xl">
        
        <div className="flex items-center justify-between pb-4 border-b border-white/60">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-800">Configuración de API & Conexión Sanctum</h3>
              <p className="text-xs text-slate-500">Ajusta los endpoints backend y credenciales del CMMS Mantis</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="py-5 space-y-4">
          
          {/* Base URL */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-[#165B62]" />
              URL Base de la API Laravel ({baseUrl})
            </label>
            <input
              type="text"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="http://localhost:8080/api"
              className="w-full px-3 py-2 text-sm glass-input rounded-xl focus:outline-none font-mono"
            />
            <p className="text-[12px] text-slate-400 mt-1">Por defecto: <code className="text-[#0F434A]">http://localhost:8080/api</code></p>
          </div>

          {/* Token Sanctum */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-[#165B62]" />
              Bearer Token Sanctum
            </label>
            <input
              type="password"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Ingresa el token obtenido en /api/auth/login"
              className="w-full px-3 py-2 text-sm glass-input rounded-xl focus:outline-none font-mono"
            />
          </div>

          {/* Test Status Feedback */}
          {testResult && (
            <div className={`p-3 rounded-lg text-xs flex items-start gap-2 ${
              testResult.success ? 'bg-[#D9EDEE] text-[#0F434A] border border-[#3D848C]/60' : 'bg-rose-50/80 text-rose-800 border border-rose-200'
            }`}>
              {testResult.success ? <CheckCircle className="w-4 h-4 text-[#165B62] shrink-0 mt-0.5" /> : <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              <span>{testResult.msg}</span>
            </div>
          )}

        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-white/60">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 bg-white/60 hover:bg-white border border-white/80 rounded-xl transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin text-[#165B62]' : ''}`} />
            <span>{isTesting ? 'Probando...' : 'Probar Conexión'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-4 py-2 text-xs font-semibold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              Guardar Cambios
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
