import React from 'react';
import { Sparkles, FileText, QrCode, Lock, Info, PanelLeftOpen } from 'lucide-react';

/**
 * Vista informativa del sistema RAG.
 * El chat interactivo ahora vive en un sidebar persistente a la izquierda
 * de toda la aplicación (RagChatPanel en App.tsx).
 */
export const RagView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="glass-panel rounded-2xl p-6 relative overflow-hidden">
        <div className="absolute -top-16 -right-16 w-48 h-48 bg-[#3D848C]/8 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#3D848C] to-[#165B62] flex items-center justify-center shadow-sm">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">Asistente IA (RAG)</h2>
              <span className="inline-block px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 text-[9px] font-bold uppercase tracking-wide">
                En desarrollo — próximamente
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 leading-relaxed max-w-xl">
            Un asistente que responde preguntas en lenguaje natural sobre tus equipos —
            manuales, historial de mantenimientos, procedimientos — citando siempre la fuente,
            usando <span className="font-semibold text-slate-800">Retrieval-Augmented Generation</span> sobre
            los datos reales de tu empresa.
          </p>

          <div className="mt-4 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#D9EDEE]/50 border border-[#3D848C]/30 w-fit">
            <PanelLeftOpen className="w-4 h-4 text-[#165B62]" />
            <span className="text-[11px] text-[#0F434A] font-medium">
              Abrí el chat desde el botón <strong>"Asistente IA"</strong> en la barra superior o desde la barra lateral izquierda
            </span>
          </div>
        </div>
      </div>

      {/* Características */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="glass-panel rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-[#D9EDEE] flex items-center justify-center mb-2">
            <Lock className="w-4 h-4 text-[#165B62]" />
          </div>
          <h3 className="font-bold text-xs text-slate-900 mb-1">Aislado por empresa</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Cada integración usa un token dedicado, scopeado a una sola empresa — nunca ve ni mezcla datos de otro tenant.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-[#D9EDEE] flex items-center justify-center mb-2">
            <FileText className="w-4 h-4 text-[#165B62]" />
          </div>
          <h3 className="font-bold text-xs text-slate-900 mb-1">Fuente de contexto</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Manuales por máquina, historial de mantenimientos y checklists — todo indexado automáticamente.
          </p>
        </div>

        <div className="glass-panel rounded-xl p-4">
          <div className="w-8 h-8 rounded-lg bg-[#D9EDEE] flex items-center justify-center mb-2">
            <QrCode className="w-4 h-4 text-[#165B62]" />
          </div>
          <h3 className="font-bold text-xs text-slate-900 mb-1">Desde el QR del equipo</h3>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Escaneá el QR de una máquina y preguntale directo al asistente sobre ese equipo puntual.
          </p>
        </div>
      </div>

      {/* Nota técnica */}
      <div className="glass-panel rounded-xl p-4 flex items-start gap-3">
        <div className="w-7 h-7 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5 text-slate-500" />
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          <span className="font-semibold text-slate-700">Nota técnica:</span> el backend ya expone
          los endpoints necesarios — documentos por máquina, historial, y el rol{' '}
          <code className="px-1 py-0.5 bg-slate-100 rounded text-[10px]">integracion</code> de
          solo lectura — para conectar cualquier pipeline de RAG sin cambios en el modelo de datos.
        </p>
      </div>

      {/* Flujo de conexión */}
      <div className="glass-panel rounded-xl p-5">
        <h3 className="font-bold text-xs text-slate-900 mb-3 flex items-center gap-2">
          <svg className="w-3.5 h-3.5 text-[#165B62]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
          Flujo de conexión RAG
        </h3>
        <div className="flex flex-col gap-2">
          {[
            { step: '1', title: 'Configurar token RAG', desc: 'Crear un token con rol "integracion" en el backend Laravel.' },
            { step: '2', title: 'Indexar documentos', desc: 'Los manuales y documentos por máquina se indexan automáticamente.' },
            { step: '3', title: 'Conectar el chat', desc: 'Pegar la URL del endpoint RAG y activar modo "Live" en la configuración del sidebar.' },
            { step: '4', title: '¡Preguntar!', desc: 'Escribir en lenguaje natural y recibir respuestas citando fuentes.' }
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3 p-2 rounded-lg hover:bg-white/30 transition-all">
              <span className="w-5 h-5 rounded-md bg-[#D9EDEE] text-[#0A2E33] text-[10px] font-bold flex items-center justify-center flex-shrink-0">
                {step}
              </span>
              <div>
                <p className="text-[11px] font-semibold text-slate-800">{title}</p>
                <p className="text-[10px] text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
