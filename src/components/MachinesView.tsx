import React, { useState, useEffect } from 'react';
import {
  Wrench,
  Plus,
  Search,
  QrCode,
  Gauge,
  Activity,
  Layers,
  ChevronRight,
  RefreshCw,
  Building,
  CheckCircle2,
  X
} from 'lucide-react';
import { Machine } from '../types';
import { api } from '../services/api';
import { MachineDetailModal } from './MachineDetailModal';

export const MachinesView: React.FC = () => {
  const [machines, setMachines] = useState<Machine[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [areaFilter, setAreaFilter] = useState('');

  // Selected Machine for Detail Modal
  const [selectedMachine, setSelectedMachine] = useState<Machine | null>(null);

  // New Machine Modal State
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newNombre, setNewNombre] = useState('');
  const [newCodigo, setNewCodigo] = useState('');
  const [newMarca, setNewMarca] = useState('');
  const [newArea, setNewArea] = useState('Extrusión y Moldeo');
  const [newPlanta, setNewPlanta] = useState('Planta Central');
  const [newDescripcion, setNewDescripcion] = useState('');

  const loadMachines = async () => {
    setLoading(true);
    try {
      const data = await api.getMachines({ q: searchTerm, area: areaFilter });
      setMachines(data);
    } catch (e) {
      console.error('Error loading machines', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMachines();
  }, [searchTerm, areaFilter]);

  const handleCreateMachineSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newCodigo.trim()) return;

    try {
      await api.createMachine({
        nombre: newNombre.trim(),
        codigo: newCodigo.trim(),
        marca: newMarca.trim() || null,
        area: newArea.trim() || null,
        planta: newPlanta.trim() || null,
        descripcion: newDescripcion.trim() || null,
        ficha_tecnica: ["Mantenimiento Estándar CMMS"]
      });

      setNewNombre('');
      setNewCodigo('');
      setNewMarca('');
      setNewDescripcion('');
      setIsCreateOpen(false);
      loadMachines();
    } catch (e: any) {
      alert(`Error al crear máquina: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Wrench className="w-6 h-6 text-[#165B62]" />
            Catálogo de Maquinaria y Equipos Industriales
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Generación de códigos QR, ficha técnica, lecturas de horómetro y métricas de falla MTTR/MTBF
          </p>
        </div>

        <button
          onClick={() => {
            setNewCodigo(`MQ-EQ-${Math.floor(100 + Math.random() * 900)}`);
            setIsCreateOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Equipo</span>
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-panel p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código, nombre o marca..."
            className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <select
            value={areaFilter}
            onChange={(e) => setAreaFilter(e.target.value)}
            className="px-3 py-2 text-xs glass-input rounded-xl focus:outline-none font-medium text-slate-700"
          >
            <option value="">Todas las áreas</option>
            <option value="Extrusión y Moldeo">Extrusión y Moldeo</option>
            <option value="Estampado">Estampado</option>
            <option value="Servicios Generales">Servicios Generales</option>
            <option value="Empaque y Logística">Empaque y Logística</option>
          </select>
        </div>
      </div>

      {/* Machines Grid */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-3xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando catálogo de máquinas...</p>
        </div>
      ) : machines.length === 0 ? (
        <div className="py-12 text-center text-slate-400 glass-panel rounded-3xl p-8">
          <Wrench className="w-8 h-8 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-semibold text-slate-700">No hay máquinas registradas en esta área</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {machines.map(m => (
            <div
              key={m.id}
              onClick={() => setSelectedMachine(m)}
              className="glass-card p-5 rounded-2xl hover:border-[#3D848C] cursor-pointer transition-all flex flex-col justify-between group space-y-3"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs font-extrabold text-[#0F434A] bg-[#D9EDEE] px-2 py-0.5 rounded-lg border border-[#3D848C]/50">
                    {m.codigo}
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 bg-white/60 text-slate-600 rounded-full border border-white/80">
                    {m.area || 'General'}
                  </span>
                </div>

                <h3 className="font-extrabold text-slate-800 text-sm group-hover:text-[#0F434A] transition-colors">
                  {m.nombre}
                </h3>

                <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                  {m.descripcion || 'Sin descripción ingresada'}
                </p>
              </div>

              <div className="pt-3 border-t border-white/60 flex items-center justify-between text-xs">
                <span className="text-slate-400 text-[11px]">Marca: <strong className="text-slate-700">{m.marca || 'Genérica'}</strong></span>
                <span className="font-bold text-[#0F434A] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                  Ver QR & Ficha <ChevronRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Machine Detail Modal */}
      <MachineDetailModal
        machine={selectedMachine}
        onClose={() => setSelectedMachine(null)}
        onReload={loadMachines}
      />

      {/* Create Machine Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Dar de Alta Nuevo Equipo</h3>
              <button onClick={() => setIsCreateOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateMachineSubmit} className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código Identificador *</label>
                  <input
                    type="text"
                    required
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="Ej: MQ-PRP-001"
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Marca / Fabricante</label>
                  <input
                    type="text"
                    value={newMarca}
                    onChange={(e) => setNewMarca(e.target.value)}
                    placeholder="Ej: Siemens / Atlas Copco"
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Equipo *</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Envasadora Automática Rápida #3"
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Área de Producción</label>
                  <select
                    value={newArea}
                    onChange={(e) => setNewArea(e.target.value)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  >
                    <option value="Extrusión y Moldeo">Extrusión y Moldeo</option>
                    <option value="Estampado">Estampado</option>
                    <option value="Servicios Generales">Servicios Generales</option>
                    <option value="Empaque y Logística">Empaque y Logística</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Planta</label>
                  <input
                    type="text"
                    value={newPlanta}
                    onChange={(e) => setNewPlanta(e.target.value)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Función</label>
                <textarea
                  rows={2}
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  placeholder="Capacidad, voltajes, números de serie..."
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Registrar Equipo
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
