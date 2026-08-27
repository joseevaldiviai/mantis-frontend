import React, { useState, useEffect } from 'react';
import {
  Package,
  Plus,
  Search,
  AlertTriangle,
  FileSpreadsheet,
  Edit2,
  Trash2,
  CheckCircle,
  XCircle,
  TrendingDown,
  RefreshCw,
  Layers,
  X,
  Check
} from 'lucide-react';
import { SparePart } from '../types';
import { api } from '../services/api';

interface InventoryViewProps {
  isCreateModalOpen: boolean;
  onCloseCreateModal: () => void;
}

export const InventoryView: React.FC<InventoryViewProps> = ({
  isCreateModalOpen,
  onCloseCreateModal
}) => {
  const [parts, setParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterLowStockOnly, setFilterLowStockOnly] = useState(false);

  // Edit Modal State
  const [editingPart, setEditingPart] = useState<SparePart | null>(null);

  // Quick Stock Adjustment Modal State
  const [adjustPart, setAdjustPart] = useState<SparePart | null>(null);
  const [adjustQuantity, setAdjustQuantity] = useState<number>(1);
  const [adjustDirection, setAdjustDirection] = useState<'add' | 'subtract'>('add');

  // New Part Form State
  const [newCodigo, setNewCodigo] = useState('');
  const [newNombre, setNewNombre] = useState('');
  const [newDescripcion, setNewDescripcion] = useState('');
  const [newUnidad, setNewUnidad] = useState('Unidad');
  const [newStockActual, setNewStockActual] = useState(10);
  const [newStockMinimo, setNewStockMinimo] = useState(5);
  const [newCostoUnitario, setNewCostoUnitario] = useState(25.00);

  const loadParts = async () => {
    setLoading(true);
    try {
      const data = await api.getSpareParts({ q: searchTerm });
      setParts(data);
    } catch (e) {
      console.error('Failed to load spare parts', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadParts();
  }, [searchTerm]);

  const handleCreatePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNombre.trim() || !newCodigo.trim()) return;

    try {
      await api.createSparePart({
        codigo: newCodigo.trim(),
        nombre: newNombre.trim(),
        descripcion: newDescripcion.trim() || null,
        unidad_medida: newUnidad.trim(),
        stock_actual: Number(newStockActual),
        stock_minimo: Number(newStockMinimo),
        costo_unitario: Number(newCostoUnitario),
        activo: true
      });
      
      // Reset form
      setNewCodigo('');
      setNewNombre('');
      setNewDescripcion('');
      onCloseCreateModal();
      loadParts();
    } catch (err: any) {
      alert(`Error al crear repuesto: ${err.message}`);
    }
  };

  const handleUpdatePartSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPart) return;

    try {
      await api.updateSparePart(editingPart.id, {
        codigo: editingPart.codigo,
        nombre: editingPart.nombre,
        descripcion: editingPart.descripcion,
        unidad_medida: editingPart.unidad_medida,
        stock_actual: Number(editingPart.stock_actual),
        stock_minimo: Number(editingPart.stock_minimo),
        costo_unitario: Number(editingPart.costo_unitario)
      });
      setEditingPart(null);
      loadParts();
    } catch (err: any) {
      alert(`Error al actualizar repuesto: ${err.message}`);
    }
  };

  const handleConfirmStockAdjustment = async () => {
    if (!adjustPart || adjustQuantity <= 0) return;
    try {
      const delta = adjustDirection === 'add' ? adjustQuantity : -adjustQuantity;
      await api.setSparePartStock(adjustPart.id, delta);
      setAdjustPart(null);
      setAdjustQuantity(1);
      loadParts();
    } catch (err: any) {
      alert(`Error al ajustar stock: ${err.message}`);
    }
  };

  const handleDeletePart = async (id: number) => {
    if (!confirm('¿Desea desactivar o eliminar este repuesto del catálogo?')) return;
    try {
      await api.deleteSparePart(id);
      loadParts();
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const handleExportCsv = async () => {
    const filename = `Mantis_Inventario_Repuestos_${new Date().toISOString().slice(0, 10)}.csv`;
    try {
      await api.downloadInventoryCsv(filename);
    } catch (e: any) {
      alert(`Error al exportar inventario: ${e.message}`);
    }
  };

  const filteredParts = parts.filter(p => {
    if (filterLowStockOnly) {
      return p.stock_actual <= p.stock_minimo;
    }
    return true;
  });

  const lowStockCount = parts.filter(p => p.stock_actual <= p.stock_minimo).length;
  const totalValuation = parts.reduce((sum, p) => sum + (p.stock_actual * (p.costo_unitario || 0)), 0);

  return (
    <div className="space-y-6">
      
      {/* Top Title & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-5 rounded-3xl">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Package className="w-6 h-6 text-[#165B62]" />
            Gestión de Inventario de Repuestos e Insumos
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Control de existencias, punto de reorden, valorización y solicitudes desde OT
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/60 hover:bg-white/80 text-slate-700 rounded-xl text-xs font-semibold border border-white/80 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-[#0F434A]" />
            <span>Exportar CSV</span>
          </button>

          <button
            onClick={() => {
              setNewCodigo(`REP-${Math.floor(1000 + Math.random() * 9000)}`);
              setNewNombre('');
              setNewDescripcion('');
              onCloseCreateModal(); // toggle trigger
            }}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Repuesto</span>
          </button>
        </div>
      </div>

      {/* Metrics Header */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
            <Package className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Total Insumos Registrados</p>
            <p className="text-xl font-black text-slate-800">{parts.length} ítems</p>
          </div>
        </div>

        <div className={`p-4 rounded-2xl glass-card flex items-center gap-3 ${
          lowStockCount > 0 ? 'bg-amber-50/70 border-amber-200/80' : ''
        }`}>
          <div className={`p-3 rounded-xl ${lowStockCount > 0 ? 'bg-amber-100 text-amber-800' : 'bg-[#D9EDEE] text-[#0F434A]'}`}>
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">En Riesgo (Bajo Stock)</p>
            <p className="text-xl font-black text-amber-900">{lowStockCount} insumos</p>
          </div>
        </div>

        <div className="glass-card p-4 rounded-2xl flex items-center gap-3">
          <div className="p-3 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-xs text-slate-500 font-medium">Valorización del Inventario</p>
            <p className="text-xl font-black text-slate-800">${totalValuation.toLocaleString('es-ES', { minimumFractionDigits: 2 })}</p>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 glass-card p-4 rounded-2xl">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por código o nombre..."
            className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <button
            type="button"
            onClick={() => setFilterLowStockOnly(!filterLowStockOnly)}
            className={`px-3 py-2 text-xs font-semibold rounded-xl border transition-all cursor-pointer ${
              filterLowStockOnly
                ? 'bg-amber-100 text-amber-900 border-amber-300 font-bold'
                : 'bg-white/50 text-slate-700 border-white/80 hover:bg-white/80'
            }`}
          >
            {filterLowStockOnly ? '✓ Mostrando Solo Bajo Stock' : 'Ver Solo Bajo Stock'}
          </button>
        </div>
      </div>

      {/* Inventory Table */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {loading ? (
          <div className="py-12 text-center text-slate-500">
            <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
            <p className="text-xs font-medium">Cargando inventario de repuestos...</p>
          </div>
        ) : filteredParts.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">No se encontraron repuestos</p>
            <p className="text-xs text-slate-500">Prueba ajustando los criterios de búsqueda o agrega un nuevo insumo.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-white/40 border-b border-white/60 text-slate-600 font-bold uppercase tracking-wider">
                <tr>
                  <th className="px-4 py-3">Código</th>
                  <th className="px-4 py-3">Nombre / Descripción</th>
                  <th className="px-4 py-3 text-center">Unidad</th>
                  <th className="px-4 py-3 text-center">Stock Actual</th>
                  <th className="px-4 py-3 text-center">Stock Mínimo</th>
                  <th className="px-4 py-3 text-right">Costo Unit ($)</th>
                  <th className="px-4 py-3 text-right">Total Valor ($)</th>
                  <th className="px-4 py-3 text-center">Estado</th>
                  <th className="px-4 py-3 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/50 font-medium text-slate-800">
                {filteredParts.map((part) => {
                  const isLow = part.stock_actual <= part.stock_minimo;
                  const totalPartVal = part.stock_actual * (part.costo_unitario || 0);

                  return (
                    <tr key={part.id} className="hover:bg-white/50 transition-colors">
                      <td className="px-4 py-3 font-mono font-bold text-[#0A2E33]">
                        {part.codigo}
                      </td>
                      <td className="px-4 py-3 max-w-xs">
                        <p className="font-bold text-slate-800">{part.nombre}</p>
                        {part.descripcion && (
                          <p className="text-[12px] text-slate-500 truncate">{part.descripcion}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {part.unidad_medida}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="inline-flex items-center gap-1.5">
                          <span className={`text-sm font-extrabold ${isLow ? 'text-amber-800' : 'text-slate-800'}`}>
                            {part.stock_actual}
                          </span>
                          <button
                            onClick={() => setAdjustPart(part)}
                            className="px-2 py-0.5 bg-[#D9EDEE] hover:bg-[#A9CDD0] text-[#0F434A] font-bold text-[11px] rounded-lg border border-[#3D848C]/60 cursor-pointer"
                            title="Ajustar stock rápido"
                          >
                            ± Stock
                          </button>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-center text-slate-500">
                        {part.stock_minimo}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        ${(part.costo_unitario || 0).toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-right font-extrabold text-slate-800">
                        ${totalPartVal.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 text-center">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100/90 text-amber-800 border border-amber-300">
                            <AlertTriangle className="w-3 h-3" /> Reorden
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-[#D9EDEE] text-[#0F434A] border border-[#3D848C]">
                            <CheckCircle className="w-3 h-3" /> OK
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => setEditingPart({ ...part })}
                            className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-white/80 rounded-xl transition-colors cursor-pointer"
                            title="Editar repuesto"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeletePart(part.id)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                            title="Desactivar/Eliminar"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stock Adjustment Modal */}
      {adjustPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-sm w-full p-5 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-sm text-slate-800">Ajuste Rápido de Stock</h3>
              <button onClick={() => setAdjustPart(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div>
                <p className="text-xs font-bold text-slate-800">{adjustPart.nombre}</p>
                <p className="text-[12px] text-slate-500">Stock Actual: <strong className="text-slate-800">{adjustPart.stock_actual} {adjustPart.unidad_medida}</strong></p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAdjustDirection('add')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                    adjustDirection === 'add' ? 'bg-[#3D848C] text-slate-900 border-[#165B62]' : 'bg-white/40 text-slate-700 border-white/60'
                  }`}
                >
                  + Entrada (Ingreso)
                </button>
                <button
                  type="button"
                  onClick={() => setAdjustDirection('subtract')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl border cursor-pointer transition-all ${
                    adjustDirection === 'subtract' ? 'bg-rose-500 text-white border-rose-600' : 'bg-white/40 text-slate-700 border-white/60'
                  }`}
                >
                  - Salida (Consumo)
                </button>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Cantidad a Ajustar</label>
                <input
                  type="number"
                  min="1"
                  value={adjustQuantity}
                  onChange={(e) => setAdjustQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full px-3 py-2 text-sm glass-input rounded-xl text-center font-extrabold focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
              <button
                type="button"
                onClick={() => setAdjustPart(null)}
                className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmStockAdjustment}
                className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-[#3D848C] hover:bg-[#165B62] hover:text-white rounded-xl cursor-pointer transition-all"
              >
                Confirmar Ajuste
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Part Modal */}
      {editingPart && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Editar Insumo / Repuesto</h3>
              <button onClick={() => setEditingPart(null)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUpdatePartSubmit} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Código de Repuesto *</label>
                <input
                  type="text"
                  required
                  value={editingPart.codigo}
                  onChange={(e) => setEditingPart({ ...editingPart, codigo: e.target.value })}
                  className="w-full px-3 py-1.5 glass-input rounded-xl font-mono focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Insumo *</label>
                <input
                  type="text"
                  required
                  value={editingPart.nombre}
                  onChange={(e) => setEditingPart({ ...editingPart, nombre: e.target.value })}
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción</label>
                <textarea
                  rows={2}
                  value={editingPart.descripcion || ''}
                  onChange={(e) => setEditingPart({ ...editingPart, descripcion: e.target.value })}
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidad de Medida</label>
                  <input
                    type="text"
                    value={editingPart.unidad_medida}
                    onChange={(e) => setEditingPart({ ...editingPart, unidad_medida: e.target.value })}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unitario ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingPart.costo_unitario || 0}
                    onChange={(e) => setEditingPart({ ...editingPart, costo_unitario: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Actual</label>
                  <input
                    type="number"
                    value={editingPart.stock_actual}
                    onChange={(e) => setEditingPart({ ...editingPart, stock_actual: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Mínimo (Punto Reorden)</label>
                  <input
                    type="number"
                    value={editingPart.stock_minimo}
                    onChange={(e) => setEditingPart({ ...editingPart, stock_minimo: parseInt(e.target.value) || 0 })}
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setEditingPart(null)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-[#3D848C] hover:bg-[#165B62] hover:text-white rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Guardar Cambios
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inline Create Modal Triggered by prop or header */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Registrar Nuevo Repuesto / Insumo</h3>
              <button onClick={onCloseCreateModal} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePartSubmit} className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Código SKU *</label>
                  <input
                    type="text"
                    required
                    value={newCodigo}
                    onChange={(e) => setNewCodigo(e.target.value)}
                    placeholder="Ej: REP-FLT-001"
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-mono focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Unidad Medida</label>
                  <select
                    value={newUnidad}
                    onChange={(e) => setNewUnidad(e.target.value)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  >
                    <option value="Unidad">Unidad</option>
                    <option value="Pieza">Pieza</option>
                    <option value="Kit">Kit</option>
                    <option value="Tambor">Tambor</option>
                    <option value="Litro">Litro</option>
                    <option value="Metro">Metro</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre del Repuesto *</label>
                <input
                  type="text"
                  required
                  value={newNombre}
                  onChange={(e) => setNewNombre(e.target.value)}
                  placeholder="Ej: Filtro de Aceite Hidráulico HF-6510"
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Descripción / Especificaciones</label>
                <textarea
                  rows={2}
                  value={newDescripcion}
                  onChange={(e) => setNewDescripcion(e.target.value)}
                  placeholder="Detalles técnicos, compatibilidad con máquinas..."
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Inicial</label>
                  <input
                    type="number"
                    value={newStockActual}
                    onChange={(e) => setNewStockActual(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Stock Mínimo</label>
                  <input
                    type="number"
                    value={newStockMinimo}
                    onChange={(e) => setNewStockMinimo(parseInt(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Costo Unit ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newCostoUnitario}
                    onChange={(e) => setNewCostoUnitario(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={onCloseCreateModal}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-slate-900 bg-[#3D848C] hover:bg-[#165B62] hover:text-white rounded-xl shadow-xs cursor-pointer transition-all"
                >
                  Crear Repuesto
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
