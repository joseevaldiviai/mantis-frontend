import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  Building2,
  Plus,
  Search,
  CheckCircle,
  Clock,
  DollarSign,
  RefreshCw,
  X
} from 'lucide-react';
import { PurchaseOrder, Vendor, SparePart } from '../types';
import { api } from '../services/api';

export const PurchasesVendorsView: React.FC = () => {
  const [activeSubTab, setActiveTab] = useState<'orders' | 'vendors'>('orders');
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [spareParts, setSpareParts] = useState<SparePart[]>([]);
  const [loading, setLoading] = useState(true);

  // New Vendor Modal
  const [isVendorModalOpen, setIsVendorModalOpen] = useState(false);
  const [vendorName, setVendorName] = useState('');
  const [vendorContact, setVendorContact] = useState('');
  const [vendorPhone, setVendorPhone] = useState('');
  const [vendorEmail, setVendorEmail] = useState('');

  // New Purchase Order Modal
  const [isPoModalOpen, setIsPoModalOpen] = useState(false);
  const [poVendorId, setPoVendorId] = useState<number | ''>('');
  const [poPartId, setPoPartId] = useState<number | ''>('');
  const [poQuantity, setPoQuantity] = useState(10);
  const [poNotes, setPoNotes] = useState('');

  const loadData = async () => {
    setLoading(true);
    try {
      const poData = await api.getPurchaseOrders();
      const vData = await api.getVendors();
      const spData = await api.getSpareParts();
      setOrders(poData);
      setVendors(vData);
      setSpareParts(spData);

      if (vData.length > 0) setPoVendorId(vData[0].id);
      if (spData.length > 0) setPoPartId(spData[0].id);
    } catch (e) {
      console.error('Error loading purchases & vendors data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateVendor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!vendorName.trim()) return;

    try {
      await api.createVendor({
        nombre: vendorName.trim(),
        contacto_nombre: vendorContact.trim() || null,
        telefono: vendorPhone.trim() || null,
        email: vendorEmail.trim() || null,
        direccion: 'Sede Industrial',
        notas: 'Proveedor de insumos CMMS'
      });

      setVendorName('');
      setVendorContact('');
      setVendorPhone('');
      setVendorEmail('');
      setIsVendorModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(`Error al crear proveedor: ${e.message}`);
    }
  };

  const handleCreatePurchaseOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!poVendorId || !poPartId) return;

    const part = spareParts.find(s => s.id === Number(poPartId));
    if (!part) return;

    try {
      await api.createPurchaseOrder({
        vendor_id: Number(poVendorId),
        items: [
          {
            spare_part_id: part.id,
            nombre: part.nombre,
            cantidad: Number(poQuantity),
            costo_unitario: part.costo_unitario || 25.00
          }
        ],
        notas: poNotes.trim() || 'Reabastecimiento de inventario'
      });

      setPoNotes('');
      setIsPoModalOpen(false);
      loadData();
    } catch (e: any) {
      alert(`Error al generar Orden de Compra: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-panel p-6 rounded-3xl shadow-sm">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <ShoppingCart className="w-6 h-6 text-[#165B62]" />
            Compras, Repuestos & Proveedores
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Órdenes de compra para reabastecimiento de insumos bajo stock y catálogo de proveedores
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsVendorModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white/60 hover:bg-white text-slate-700 rounded-xl text-xs font-semibold transition-colors border border-white/80 cursor-pointer"
          >
            <Building2 className="w-4 h-4 text-[#0F434A]" />
            <span>+ Proveedor</span>
          </button>

          <button
            onClick={() => setIsPoModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white rounded-xl text-xs font-bold shadow-xs transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nueva Orden de Compra</span>
          </button>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex items-center gap-2 border-b border-white/60 pb-2 text-xs font-bold">
        <button
          onClick={() => setActiveTab('orders')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'orders' ? 'bg-[#3D848C] text-slate-900 shadow-xs' : 'bg-white/40 text-slate-600 border border-white/60 hover:bg-white/60'
          }`}
        >
          Órdenes de Compra ({orders.length})
        </button>

        <button
          onClick={() => setActiveTab('vendors')}
          className={`px-4 py-2 rounded-xl transition-all cursor-pointer ${
            activeSubTab === 'vendors' ? 'bg-[#3D848C] text-slate-900 shadow-xs' : 'bg-white/40 text-slate-600 border border-white/60 hover:bg-white/60'
          }`}
        >
          Catálogo de Proveedores ({vendors.length})
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-3xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando módulo de compras...</p>
        </div>
      ) : activeSubTab === 'orders' ? (
        
        /* ORDERS LIST */
        <div className="space-y-3">
          {orders.map(po => (
            <div key={po.id} className="glass-card p-4 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-xs text-slate-800 font-mono">{po.numero}</span>
                  <span className="text-[11px] font-bold px-2 py-0.5 bg-[#D9EDEE] text-[#0F434A] rounded-lg border border-[#3D848C]/50 uppercase">
                    {po.estado}
                  </span>
                </div>

                <p className="text-xs font-bold text-slate-800 mt-1">Proveedor: {po.vendor?.nombre || 'General'}</p>
                <p className="text-[12px] text-slate-500 mt-0.5">{po.items.map(i => `${i.nombre} (${i.cantidad} u)`).join(', ')}</p>
              </div>

              <div className="text-right shrink-0">
                <p className="text-base font-black text-slate-800">${Number(po.total).toFixed(2)}</p>
                <p className="text-[11px] text-slate-400">Emisión: {po.created_at ? new Date(po.created_at).toLocaleDateString('es-ES') : 'Reciente'}</p>
              </div>
            </div>
          ))}
        </div>

      ) : (

        /* VENDORS CATALOG */
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {vendors.map(v => (
            <div key={v.id} className="glass-card p-5 rounded-2xl space-y-2">
              <h3 className="font-bold text-slate-800 text-xs">{v.nombre}</h3>
              <p className="text-[12px] text-slate-600">Contacto: <strong>{v.contacto_nombre || 'N/A'}</strong></p>
              <p className="text-[12px] text-slate-600">Teléfono: <strong>{v.telefono || 'N/A'}</strong></p>
              <p className="text-[12px] text-slate-600">Email: <strong>{v.email || 'N/A'}</strong></p>
            </div>
          ))}
        </div>

      )}

      {/* Vendor Modal */}
      {isVendorModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Registrar Proveedor</h3>
              <button onClick={() => setIsVendorModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateVendor} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Nombre / Razón Social *</label>
                <input
                  type="text"
                  required
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Ej: HidroFlex Soluciones SpA"
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Contacto Principal</label>
                <input
                  type="text"
                  value={vendorContact}
                  onChange={(e) => setVendorContact(e.target.value)}
                  placeholder="Ej: Marcos Retamal"
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    value={vendorPhone}
                    onChange={(e) => setVendorPhone(e.target.value)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={vendorEmail}
                    onChange={(e) => setVendorEmail(e.target.value)}
                    className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsVendorModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl cursor-pointer transition-all"
                >
                  Guardar Proveedor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PO Modal */}
      {isPoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-white/60">
              <h3 className="font-bold text-base text-slate-800">Nueva Orden de Compra</h3>
              <button onClick={() => setIsPoModalOpen(false)} className="p-1 text-slate-400 hover:text-slate-700 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreatePurchaseOrder} className="py-4 space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Proveedor *</label>
                <select
                  value={poVendorId}
                  onChange={(e) => setPoVendorId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                >
                  {vendors.map(v => (
                    <option key={v.id} value={v.id}>{v.nombre}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Repuesto a Reabastecer *</label>
                <select
                  value={poPartId}
                  onChange={(e) => setPoPartId(Number(e.target.value))}
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                >
                  {spareParts.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.codigo} - {s.nombre} (Stock: {s.stock_actual})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Cantidad a Comprar</label>
                <input
                  type="number"
                  min="1"
                  value={poQuantity}
                  onChange={(e) => setPoQuantity(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-1.5 glass-input rounded-xl font-bold focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Notas u Observaciones</label>
                <textarea
                  rows={2}
                  value={poNotes}
                  onChange={(e) => setPoNotes(e.target.value)}
                  placeholder="Dirección de entrega, fecha de despacho..."
                  className="w-full px-3 py-1.5 glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsPoModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl cursor-pointer transition-all"
                >
                  Emitir Orden de Compra
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
