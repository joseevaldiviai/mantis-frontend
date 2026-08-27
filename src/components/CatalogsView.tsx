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
  UserCheck,
  Eye,
  EyeOff,
  Settings,
  Palette,
  Edit3,
  Save,
  X,
  Hash
} from 'lucide-react';
import { CategoryMantenimiento, TipoSolicitud, EstadoOT, Specialty, AuthSessionToken, User } from '../types';
import { api } from '../services/api';
import { notifyCatalogChange } from '../services/pushNotifications';

export const CatalogsView: React.FC = () => {
  const [categories, setCategories] = useState<CategoryMantenimiento[]>([]);
  const [requestTypes, setRequestTypes] = useState<TipoSolicitud[]>([]);
  const [statuses, setStatuses] = useState<EstadoOT[]>([]);
  const [specialties, setSpecialties] = useState<Specialty[]>([]);
  const [tokens, setTokens] = useState<AuthSessionToken[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Configuración de visibilidad de OT para técnicos
  const [mostrarOtATodos, setMostrarOtATodos] = useState(() => {
    return localStorage.getItem('mantis_mostrar_ot_a_todos') !== 'false';
  });

  // New Category Form
  const [newCatName, setNewCatName] = useState('');
  const [isCorrective, setIsCorrective] = useState(false);

  // New Tipo Solicitud Form
  const [newTipoSolicitud, setNewTipoSolicitud] = useState('');

  // New Especialidad Form
  const [newEspecialidad, setNewEspecialidad] = useState('');

  // Estado OT Form
  const [newEstadoNombre, setNewEstadoNombre] = useState('');
  const [newEstadoEsFinal, setNewEstadoEsFinal] = useState(false);
  const [newEstadoColor, setNewEstadoColor] = useState('#3D848C');
  const [newEstadoOrden, setNewEstadoOrden] = useState(1);
  const [generandoEstados, setGenerandoEstados] = useState(false);

  // Edit Estado
  const [editingEstadoId, setEditingEstadoId] = useState<number | null>(null);
  const [editingEstadoNombre, setEditingEstadoNombre] = useState('');
  const [editingEstadoOrden, setEditingEstadoOrden] = useState(1);

  const loadCatalogs = async () => {
    setLoading(true);
    try {
      const catRes = await api.request<CategoryMantenimiento[]>('/categorias-mantenimiento');
      const reqRes = await api.request<TipoSolicitud[]>('/tipos-solicitud');
      const stRes = await api.request<EstadoOT[]>('/estados-ot');
      const spRes = await api.request<Specialty[]>('/especialidades');
      const tokRes = await api.getTokens();
      const userRes = await api.getMe().catch(() => null);

      setCategories(catRes);
      setRequestTypes(reqRes);
      setStatuses(stRes);
      setSpecialties(spRes);
      setTokens(tokRes);
      setCurrentUser(userRes);
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
      notifyCatalogChange('Categorías', 'Creada', newCatName.trim());
    } catch (e: any) {
      alert(`Error al crear categoría: ${e.message}`);
    }
  };

  const handleCreateTipoSolicitud = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTipoSolicitud.trim()) return;
    try {
      await api.request<TipoSolicitud>('/tipos-solicitud', {
        method: 'POST',
        body: JSON.stringify({ nombre: newTipoSolicitud.trim(), activo: true })
      });
      setNewTipoSolicitud('');
      loadCatalogs();
      notifyCatalogChange('Tipos de Solicitud', 'Creado', newTipoSolicitud.trim());
    } catch (e: any) {
      alert(`Error al crear tipo de solicitud: ${e.message}`);
    }
  };

  const handleCreateEspecialidad = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEspecialidad.trim()) return;
    try {
      await api.request<Specialty>('/especialidades', {
        method: 'POST',
        body: JSON.stringify({ nombre: newEspecialidad.trim(), activo: true })
      });
      setNewEspecialidad('');
      loadCatalogs();
      notifyCatalogChange('Especialidades', 'Creada', newEspecialidad.trim());
    } catch (e: any) {
      alert(`Error al crear especialidad: ${e.message}`);
    }
  };

  const handleCreateEstado = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEstadoNombre.trim()) return;
    try {
      await api.request<EstadoOT>('/estados-ot', {
        method: 'POST',
        body: JSON.stringify({
          nombre: newEstadoNombre.trim(),
          es_estado_final: newEstadoEsFinal,
          activo: true,
          color: newEstadoColor,
          orden: newEstadoOrden
        })
      });
      setNewEstadoNombre('');
      setNewEstadoEsFinal(false);
      setNewEstadoColor('#3D848C');
      setNewEstadoOrden(statuses.reduce((max, s) => Math.max(max, s.orden), 0) + 1);
      loadCatalogs();
      notifyCatalogChange('Estados OT', 'Creado', newEstadoNombre.trim());
    } catch (e: any) {
      alert(`Error al crear estado: ${e.message}`);
    }
  };

  const handleToggleEstado = async (estado: EstadoOT) => {
    try {
      await api.request<EstadoOT>(`/estados-ot/${estado.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ activo: !estado.activo })
      });
      loadCatalogs();
      notifyCatalogChange('Estados OT', estado.activo ? 'Desactivado' : 'Activado', estado.nombre);
    } catch (e: any) {
      alert(`Error al cambiar estado: ${e.message}`);
    }
  };

  const handleUpdateEstado = async (estadoId: number) => {
    try {
      await api.request(`/estados-ot/${estadoId}`, {
        method: 'PATCH',
        body: JSON.stringify({ nombre: editingEstadoNombre, orden: editingEstadoOrden })
      });
      setEditingEstadoId(null);
      loadCatalogs();
      notifyCatalogChange('Estados OT', 'Editado', editingEstadoNombre);
    } catch (e: any) {
      alert(`Error al editar estado: ${e.message}`);
    }
  };

  const handleGenerarEstadosDefault = async () => {
    setGenerandoEstados(true);
    try {
      const defaults = [
        { nombre: 'Nuevo', es_estado_final: false, activo: true, color: '#3D848C', orden: 1 },
        { nombre: 'En Proceso', es_estado_final: false, activo: true, color: '#f59e0b', orden: 2 },
        { nombre: 'Finalizado', es_estado_final: true, activo: true, color: '#10b981', orden: 3 }
      ];
      for (const estado of defaults) {
        await api.request<EstadoOT>('/estados-ot', {
          method: 'POST',
          body: JSON.stringify(estado)
        });
      }
      loadCatalogs();
      notifyCatalogChange('Estados OT', 'Generados por defecto', 'Nuevo, En Proceso, Finalizado');
    } catch (e: any) {
      alert(`Error al generar estados: ${e.message}`);
    } finally {
      setGenerandoEstados(false);
    }
  };

  const handleToggleVisibilidadOT = async () => {
    const nuevoValor = !mostrarOtATodos;
    setMostrarOtATodos(nuevoValor);
    localStorage.setItem('mantis_mostrar_ot_a_todos', String(nuevoValor));
    notifyCatalogChange('Configuración', 'Visibilidad OT', nuevoValor ? 'Visible para todos' : 'Solo asignados');
  };

  const isAdmin = currentUser?.rol === 'super_admin' || currentUser?.rol === 'administrador';

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="glass-panel p-6 rounded-3xl shadow-sm">
        <h1 className="text-[18px] font-extrabold text-slate-800 flex items-center gap-2">
          <Layers className="w-6 h-6 text-[#165B62]" />
          Catálogos del Sistema, Roles & Sesiones Sanctum
        </h1>
        <p className="text-[13px] text-slate-600 mt-0.5">
          Configuración de tipos de solicitud, categorías de mantenimiento, especialidades y estados de OT
        </p>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-3xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-[13px] font-medium">Cargando catálogos del sistema...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Categories */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#165B62]" /> Categorías de Mantenimiento
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {categories.map(c => (
                <div key={c.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-[13px] flex items-center justify-between">
                  <span className="font-bold text-slate-800">{c.nombre}</span>
                  <span className={`text-[12px] font-bold px-2 py-0.5 rounded-lg border ${c.es_correctivo ? 'bg-amber-100/80 text-amber-900 border-amber-200' : 'bg-[#D9EDEE] text-[#0F434A] border-[#3D848C]/50'}`}>
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
                className="flex-1 px-3 py-1.5 text-[13px] glass-input rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white text-[13px] font-bold rounded-xl cursor-pointer transition-all"
              >
                + Añadir
              </button>
            </form>
          </div>

          {/* Request Types */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
              <Shield className="w-4 h-4 text-[#165B62]" /> Tipos de Solicitud de Falla
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {requestTypes.map((rt) => (
                <div key={rt.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-[13px] flex items-center justify-between">
                  <span className="font-bold text-slate-800">{rt.nombre}</span>
                  <span className="text-[12px] font-bold bg-[#D9EDEE] text-[#0F434A] px-2 py-0.5 rounded-lg border border-[#3D848C]/50">Activo</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateTipoSolicitud} className="flex gap-2 pt-2 border-t border-white/60">
              <input
                type="text"
                value={newTipoSolicitud}
                onChange={(e) => setNewTipoSolicitud(e.target.value)}
                placeholder="Nuevo tipo de solicitud..."
                className="flex-1 px-3 py-1.5 text-[13px] glass-input rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white text-[13px] font-bold rounded-xl cursor-pointer transition-all"
              >
                + Añadir
              </button>
            </form>
          </div>

          {/* User Specialties */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <h2 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[#165B62]" /> Especialidades Técnicas
            </h2>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {specialties.map(sp => (
                <div key={sp.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-[13px] flex items-center justify-between">
                  <span className="font-bold text-slate-800">{sp.nombre}</span>
                  <span className="text-[12px] font-bold bg-[#D9EDEE] text-[#0F434A] px-2 py-0.5 rounded-lg border border-[#3D848C]/50">Habilitada</span>
                </div>
              ))}
            </div>
            <form onSubmit={handleCreateEspecialidad} className="flex gap-2 pt-2 border-t border-white/60">
              <input
                type="text"
                value={newEspecialidad}
                onChange={(e) => setNewEspecialidad(e.target.value)}
                placeholder="Nueva especialidad..."
                className="flex-1 px-3 py-1.5 text-[13px] glass-input rounded-xl focus:outline-none"
              />
              <button
                type="submit"
                className="px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white text-[13px] font-bold rounded-xl cursor-pointer transition-all"
              >
                + Añadir
              </button>
            </form>
          </div>

          {/* Estados OT */}
          <div className="glass-card p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#165B62]" /> Estados de Orden de Trabajo
              </h2>
              <button
                onClick={handleGenerarEstadosDefault}
                disabled={generandoEstados}
                className="text-[12px] font-bold text-[#0F434A] bg-[#D9EDEE] hover:bg-[#A9CDD0] px-2.5 py-1 rounded-lg border border-[#3D848C]/60 transition-all cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                {generandoEstados ? <RefreshCw className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                Generar por defecto
              </button>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              {[...statuses].sort((a, b) => a.orden - b.orden).map(estado => (
                <div
                  key={estado.id}
                  className={`p-2.5 rounded-xl border text-[13px] flex items-center justify-between transition-all ${
                    editingEstadoId === estado.id
                      ? 'bg-blue-50/60 border-blue-300 ring-2 ring-blue-200'
                      : 'bg-white/40 border-white/60'
                  }`}
                >
                  {editingEstadoId === estado.id ? (
                    /* Edit mode */
                    <div className="flex items-center gap-2 flex-1">
                      <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: estado.color || '#3D848C' }} />
                      <input
                        type="text"
                        value={editingEstadoNombre}
                        onChange={(e) => setEditingEstadoNombre(e.target.value)}
                        className="flex-1 px-2 py-1 text-[13px] font-bold border border-blue-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-300"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleUpdateEstado(estado.id);
                          if (e.key === 'Escape') setEditingEstadoId(null);
                        }}
                      />
                      <input
                        type="number"
                        value={editingEstadoOrden}
                        onChange={(e) => setEditingEstadoOrden(parseInt(e.target.value) || 1)}
                        className="w-14 px-2 py-1 text-[13px] font-bold border border-blue-200 rounded-lg text-center focus:outline-none focus:ring-1 focus:ring-blue-300"
                      />
                      <button
                        onClick={() => handleUpdateEstado(estado.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded-lg cursor-pointer"
                        title="Guardar"
                      >
                        <Save className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setEditingEstadoId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded-lg cursor-pointer"
                        title="Cancelar"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    /* View mode */
                    <>
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full" style={{ backgroundColor: estado.color || '#3D848C' }} />
                        <span className="font-bold text-slate-800">{estado.nombre}</span>
                        <span className="text-[11px] text-slate-400 font-medium">Orden: {estado.orden}</span>
                        {estado.es_estado_final && (
                          <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded-md">Final</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            setEditingEstadoId(estado.id);
                            setEditingEstadoNombre(estado.nombre);
                            setEditingEstadoOrden(estado.orden);
                          }}
                          className="p-1 text-slate-400 hover:text-[#165B62] hover:bg-[#D9EDEE] rounded-lg transition-all cursor-pointer"
                          title="Editar nombre y orden"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleToggleEstado(estado)}
                          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${
                            estado.activo ? 'bg-[#3D848C]' : 'bg-slate-300'
                          }`}
                          title={estado.activo ? 'Desactivar' : 'Activar'}
                        >
                          <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform shadow-2xs ${
                            estado.activo ? 'translate-x-4.5' : 'translate-x-1'
                          }`} />
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* New estado form */}
            <form onSubmit={handleCreateEstado} className="pt-2 border-t border-white/60 space-y-2">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newEstadoNombre}
                  onChange={(e) => setNewEstadoNombre(e.target.value)}
                  placeholder="Nombre del nuevo estado..."
                  className="flex-1 px-3 py-1.5 text-[13px] glass-input rounded-xl focus:outline-none"
                />
                <input
                  type="number"
                  value={newEstadoOrden}
                  onChange={(e) => setNewEstadoOrden(parseInt(e.target.value) || 1)}
                  className="w-14 px-2 py-1.5 text-[13px] glass-input rounded-xl text-center focus:outline-none"
                  title="Orden"
                />
                <input
                  type="color"
                  value={newEstadoColor}
                  onChange={(e) => setNewEstadoColor(e.target.value)}
                  className="w-9 h-9 rounded-lg cursor-pointer border-0"
                  title="Color"
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-[12px] text-slate-600 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={newEstadoEsFinal}
                    onChange={(e) => setNewEstadoEsFinal(e.target.checked)}
                    className="rounded"
                  />
                  Es estado final
                </label>
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white text-[13px] font-bold rounded-xl cursor-pointer transition-all"
                >
                  + Crear Estado
                </button>
              </div>
            </form>
          </div>

          {/* Session Tokens */}
          <div className="glass-card p-5 rounded-2xl space-y-3 md:col-span-2">
            <h2 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
              <Key className="w-4 h-4 text-[#165B62]" /> Sesiones y Tokens Sanctum
            </h2>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {tokens.map(t => (
                <div key={t.id} className="p-2.5 bg-white/40 rounded-xl border border-white/60 text-[13px] flex items-center justify-between">
                  <div>
                    <p className="font-bold text-slate-800">{t.name}</p>
                    <p className="text-[12px] text-slate-400">Último uso: {t.last_used_at ? new Date(t.last_used_at).toLocaleTimeString() : 'Ahora'}</p>
                  </div>
                  {t.es_actual && (
                    <span className="text-[12px] font-bold bg-[#165B62] text-white px-2 py-0.5 rounded-full shadow-2xs">
                      Sesión Actual
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* Configuración de Visibilidad de OT */}
      {isAdmin && (
        <div className="glass-card p-5 rounded-2xl space-y-3">
          <h2 className="font-bold text-[14px] text-slate-800 flex items-center gap-2">
            <Settings className="w-4 h-4 text-[#165B62]" /> Configuración de Visibilidad de OT
          </h2>
          <p className="text-[13px] text-slate-500">
            Controla si los técnicos pueden ver todas las órdenes de trabajo o solo aquellas en las que fueron asignados como colaboradores.
          </p>
          
          <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-white/60">
            <div className="flex items-center gap-3">
              {mostrarOtATodos ? (
                <Eye className="w-5 h-5 text-[#165B62]" />
              ) : (
                <EyeOff className="w-5 h-5 text-slate-400" />
              )}
              <div>
                <p className="text-[13px] font-bold text-slate-800">
                  {mostrarOtATodos ? 'Todas las OT visibles para técnicos' : 'Solo OT asignadas visibles para técnicos'}
                </p>
                <p className="text-[12px] text-slate-500">
                  {mostrarOtATodos 
                    ? 'Los técnicos pueden ver y acceder a todas las órdenes de trabajo del sistema.' 
                    : 'Los técnicos solo ven las órdenes de trabajo donde fueron agregados como colaboradores.'}
                </p>
              </div>
            </div>
            
            <button
              onClick={handleToggleVisibilidadOT}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors cursor-pointer ${
                mostrarOtATodos ? 'bg-[#3D848C]' : 'bg-slate-300'
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-2xs ${
                mostrarOtATodos ? 'translate-x-6' : 'translate-x-1'
              }`} />
            </button>
          </div>

          <div className="flex items-start gap-2 p-2.5 bg-[#D9EDEE]/50 rounded-xl border border-[#3D848C]/30">
            <CheckCircle className="w-4 h-4 text-[#165B62] shrink-0 mt-0.5" />
            <p className="text-[12px] text-[#0F434A]">
              {mostrarOtATodos 
                ? 'Estado actual: Todos los usuarios con rol técnico pueden acceder a la lista completa de OT desde la pestaña de Órdenes de Trabajo.'
                : 'Estado actual: Los técnicos solo accederán a las OT donde el administrador los haya asignado como colaboradores. Las OT sin asignar no serán visibles para ellos.'}
            </p>
          </div>
        </div>
      )}

    </div>
  );
};
