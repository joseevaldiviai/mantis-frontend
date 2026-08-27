import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Send,
  Bot,
  User,
  Loader2,
  Sparkles,
  FileText,
  Cpu,
  ClipboardList,
  FolderTree,
  RotateCcw,
} from 'lucide-react';
import { ragApi, RagMessage, RagSource } from '../services/ragApi';

const SOURCE_ICONS: Record<RagSource['tipo'], React.ElementType> = {
  documento: FileText,
  maquina: Cpu,
  orden_trabajo: ClipboardList,
  procedimiento: FolderTree,
};

const SUGGESTED_QUESTIONS = [
  '¿Cuál es el procedimiento de mantenimiento de la bomba BC-101?',
  '¿Cuáles son las últimas fallas reportadas?',
  '¿Qué repuestos tengo por debajo del stock mínimo?',
  '¿Cómo calibro el sensor de temperatura?',
];

function SourceBadge({ source }: { source: RagSource }) {
  const Icon = SOURCE_ICONS[source.tipo] || FileText;
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#D9EDEE]/60 text-[#0A2E33] text-[11px] font-medium border border-[#3D848C]/30">
      <Icon className="w-2.5 h-2.5 text-[#165B62]" />
      <span>{source.titulo}</span>
      {source.relevancia !== undefined && (
        <span className="text-[#3D848C]/70 ml-0.5">{Math.round(source.relevancia * 100)}%</span>
      )}
    </span>
  );
}

export const RagChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<RagMessage[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const [ragUrl, setRagUrl] = useState(ragApi.getBaseUrl());

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  useEffect(() => {
    setMessages([
      {
        id: 'welcome',
        role: 'assistant',
        content:
          '¡Hola! Soy el asistente de Mantis. Puedo responder preguntas sobre tus equipos, ' +
          'manuales, historial de mantenimientos y procedimientos.\n\n' +
          'Escribí tu pregunta o elegí una de las sugerencias de abajo.',
        timestamp: new Date(),
        sources: []
      }
    ]);
  }, []);

  const handleSend = async (text?: string) => {
    const question = (text || inputValue).trim();
    if (!question || isLoading) return;

    const userMsg: RagMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: question,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsLoading(true);

    try {
      const token = localStorage.getItem('mantis_api_token') || undefined;
      const result = await ragApi.sendMessage(question, token, [...messages, userMsg]);

      const assistantMsg: RagMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content: result.respuesta,
        timestamp: new Date(),
        sources: result.fuentes
      };

      setMessages(prev => [...prev, assistantMsg]);
    } catch (error: any) {
      const errorMsg: RagMessage = {
        id: `error-${Date.now()}`,
        role: 'system',
        content: `⚠️ Error al conectar con el asistente: ${error.message || 'Error desconocido'}`,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleClearChat = () => {
    setMessages([
      {
        id: 'welcome-new',
        role: 'assistant',
        content: 'Chat reiniciado. ¿En qué puedo ayudarte?',
        timestamp: new Date(),
        sources: []
      }
    ]);
  };

  const handleSaveConfig = () => {
    ragApi.setBaseUrl(ragUrl);
    setIsConfigOpen(false);
  };

  return (
    <div className="flex flex-col h-full glass-panel rounded-2xl overflow-hidden border border-white/60 shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/40 flex-shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#3D848C] to-[#165B62] flex items-center justify-center shadow-sm">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800">Asistente RAG</h3>
            <span className="text-[11px] text-slate-500">Conectado al backend</span>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={handleClearChat}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-lg transition-all"
            title="Limpiar chat"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={() => setIsConfigOpen(!isConfigOpen)}
            className="p-1.5 text-slate-500 hover:text-slate-800 hover:bg-white/60 rounded-lg transition-all"
            title="Configuración RAG"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>

      {/* Configuración colapsable */}
      {isConfigOpen && (
        <div className="px-4 py-3 border-b border-white/40 bg-white/30 space-y-2 flex-shrink-0">
          <div>
            <label className="block text-[11px] font-semibold text-slate-600 uppercase tracking-wider mb-1">
              URL del Backend RAG
            </label>
            <input
              type="text"
              value={ragUrl}
              onChange={e => setRagUrl(e.target.value)}
              placeholder="http://localhost:8000/api"
              className="w-full text-xs px-3 py-1.5 glass-input rounded-lg"
            />
          </div>
          <button
            onClick={handleSaveConfig}
            className="w-full px-3 py-1.5 text-[11px] font-semibold bg-[#3D848C] text-white rounded-lg hover:bg-[#165B62] transition-all"
          >
            Guardar URL
          </button>
        </div>
      )}

      {/* Área de mensajes */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map(msg => (
          <div key={msg.id} className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            {msg.role !== 'user' && (
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3D848C] to-[#165B62] flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm">
                <Bot className="w-3.5 h-3.5 text-white" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-[#3D848C] text-white rounded-br-md'
                  : msg.role === 'system'
                    ? 'bg-amber-50/80 text-amber-800 border border-amber-200/60 rounded-bl-md'
                    : 'glass-card text-slate-700 rounded-bl-md'
              }`}
            >
              <div
                dangerouslySetInnerHTML={{
                  __html: msg.content
                    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                    .replace(/\n/g, '<br />')
                }}
              />

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-white/40 flex flex-wrap gap-1">
                  {msg.sources.map((src, i) => (
                    <SourceBadge key={i} source={src} />
                  ))}
                </div>
              )}

              <div className={`mt-1 text-[10px] ${msg.role === 'user' ? 'text-white/60' : 'text-slate-400'}`}>
                {msg.timestamp.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
              </div>
            </div>

            {msg.role === 'user' && (
              <div className="w-7 h-7 rounded-lg bg-slate-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                <User className="w-3.5 h-3.5 text-slate-600" />
              </div>
            )}
          </div>
        ))}

        {isLoading && (
          <div className="flex gap-2 justify-start">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-[#3D848C] to-[#165B62] flex items-center justify-center flex-shrink-0 shadow-sm">
              <Bot className="w-3.5 h-3.5 text-white" />
            </div>
            <div className="glass-card rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
              <Loader2 className="w-3.5 h-3.5 text-[#3D848C] animate-spin" />
              <span className="text-xs text-slate-500">Buscando en la base de conocimiento...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Preguntas sugeridas */}
      {messages.length <= 1 && (
        <div className="px-4 pb-2 flex-shrink-0">
          <p className="text-[11px] text-slate-400 font-medium uppercase tracking-wider mb-1.5">Sugerencias</p>
          <div className="flex flex-wrap gap-1.5">
            {SUGGESTED_QUESTIONS.map((q, i) => (
              <button
                key={i}
                onClick={() => handleSend(q)}
                className="text-[11px] px-2.5 py-1 rounded-lg bg-white/50 hover:bg-white/80 text-slate-600 hover:text-slate-800 border border-white/60 hover:border-[#3D848C]/40 transition-all cursor-pointer text-left leading-tight"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Input */}
      <div className="px-4 py-3 border-t border-white/40 flex-shrink-0">
        <div className="flex items-end gap-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Escribí tu pregunta..."
            rows={1}
            className="flex-1 text-xs px-3.5 py-2.5 glass-input rounded-xl resize-none min-h-[36px] max-h-[100px]"
            style={{ fieldSizing: 'content' } as React.CSSProperties}
            disabled={isLoading}
          />
          <button
            onClick={() => handleSend()}
            disabled={!inputValue.trim() || isLoading}
            className="p-2.5 rounded-xl bg-[#3D848C] text-white hover:bg-[#165B62] disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm flex-shrink-0"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-[10px] text-slate-400 mt-1.5 text-center">
          Enter para enviar · Shift+Enter nueva línea
        </p>
      </div>
    </div>
  );
};
