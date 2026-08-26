import React, { useState, useEffect } from 'react';
import {
  Layers,
  Key,
  Shield,
  Tag,
  CheckCircle,
  Plus,
  Trash2,
  RefreshCw,
  UserCheck
} from 'lucide-react';
import { CategoryMantenimiento, TipoSolicitud, EstadoOT, Specialty, AuthSessionToken } from '../types';
import { api } from '../services/api';

export const CatalogsView: React.FC = () => {
  const [categories, setCategories] = useState<CategoryMantenimiento[]>([]);
  const [requestTypes, setRequestTypes] = useState<TipoSolicitud[]>([]);
  const [statuses, setStatuses] = useState<EstadoOT[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tokens, setTokens] = useState<AuthSessionToken[]>([]);
  const [loading, setLoading] = useState(true);

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [isCorrective, setIsCorrective] = useState(false);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const catRes = await api.request<CategoryMantenimiento[]>('/categorias-mantenimiento');
      const reqRes = await api.request<TipoSolicitud[]>('/tipos-solicitud');
      const stRes = await api.request<EstadoOT[]>('/estados-ot');
      const spRes = await api.request<Specialty[]>('/especialidades');
      const tokRes = await api.getTokens();

      setCategories(catRes);
      setRequestTypes(reqRes);
      setStatuses(stRes);
      setSpecialties(spRes);
      setTokens(tokRes);
    } catch (e) {
      console.error('Error loading catalogs', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalogs();
  }, []);

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    try {
      await api.request<CategoryMantenimiento>('/categorias-mantenimiento', {
        method: 'POST',
        body: JSON.stringify({ nombre: newCatName.trim(), es_correctivo: isCorrective, activo: true })
      });
      setNewCatName('');
      loadCatalogs();
    } catch (e: any) {
      alert(`Error al crear categoría: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm">
        <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#165B62]" />
          Catálogos del Sistema, Roles & Sesiones Sanctum
        </h1>
        <p className="text-xs text-slate-600 mt-0.5">
          Configuración de tipos de solicitud, categorías de mantenimiento, especialidades y sesiones activas
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-3xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando catálogos del sistema...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Categories */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#165B62]" /> Categorías de Mantenimiento
            </h2>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800">{c.nombre}</span>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-lg border ${c.es_correctivo ? 'bg-amber-100/80 text-amber-900 border-amber-200' : 'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]/50'}`}>
                    {c.es_correctivo ? 'Correctivo' : 'Preventivo'}
                  </span>
                </div>
              ))}
            </div>

            <form onSubmit={handleCreateCategory} className="flex gap-2 pt-2 border-t border-white/60">
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                placeholder="Nueva categoría..."
                className="flex-1 px-3 py-1.5 text-xs glass-input rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white text-xs font-bold rounded-xl cursor-pointer transition-all"
              >
                + Añadir
              </button>
            </form>
          </div>

          {/* Request Types */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#165B62]" /> Tipos de Solicitud de Falla
            </h2>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {requestTypes.map((rt, i) => (
                <div key={i} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rt.nombre}</span>
                  <span className="text-[10px] font-bold bg-[#D9EDEE] text-[#0F434A] px-2 py-0.5 rounded-lg border border-[#3D848C]/50">Activo</span>
                </div>
              ))}
            </div>
          </div>

          {/* User Specialties */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#165B62]" /> Especialidades Técnicas
            </h2>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {specialties.map(sp => (
                <div key={sp.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-xs flex items-center justify-between">
                  <span className="font-bold text-slate-800">{sp.nombre}</span>
                  <span className="text-[10px] font-bold bg-[#D9EDEE] text-[#0F434A] px-2 py-0.5 rounded-lg border border-[#3D848C]/50">Habilitada</span>
                </div>
              ))}
            </div>
          </div>

          {/* Session Tokens */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-sm text-slate-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#165B62]" /> Sesiones y Tokens Sanctum
            </h2>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tokens.map(t => (
                <div key={t.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-xs flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{t.name}</p>
                    <p className="text-[10px] text-slate-400">Último uso: {t.last_used_at ? new Date(t.last_used_at).toLocaleTimeString() : 'Ahora'}</p>
                  </div>
                  {t.es_actual && (
                    <span className="text-[10px] font-bold bg-[#165B62] text-white px-2 py-0.5 rounded-full shadow-2xs">
                      Sesión Actual
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

    </div>
  );
};
