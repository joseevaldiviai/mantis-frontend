import React, { useState, useEffect } from 'react';
import {
  Users,
  Building2,
  Plus,
  Search,
  UserCheck,
  UserPlus,
  Edit,
  Trash2,
  CheckCircle2,
  XCircle,
  RefreshCw,
  X,
  Check,
  Building,
  KeyRound,
  Eye,
  EyeOff,
  BarChart3,
  UserCog,
  ShieldCheck,
  Factory,
  Wrench,
  DollarSign,
  Clock,
  Package,
  TrendingUp,
  AlertTriangle,
  Calendar
} from 'lucide-react';
import { User, Company, UserRole, Specialty, DashboardSummary } from '../types';
import { api } from '../services/api';

interface UsersCompaniesViewProps {
  user?: User | null;
  onUserSwitch?: () => void;
}

export const UsersCompaniesView: React.FC<UsersCompaniesViewProps> = ({ user: userProp, onUserSwitch }) => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | 'all'>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Modals state
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  const [isCreateCompanyOpen, setIsCreateCompanyOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);

  // Form states for user
  const [userForm, setUserForm] = useState({
    company_id: 1,
    nombre: '',
    apellido: '',
    ci: '',
    email: '',
    telefono: '',
    cargo: '',
    curso: '',
    password: '',
    rol: 'tecnico' as UserRole,
    activo: true,
    especialidadIds: [] as number[]
  });
  const [showPassword, setShowPassword] = useState(false);

  // Form state for company
  const [companyForm, setCompanyForm] = useState({
    nombre: '',
    nit_ruc: '',
    activo: true
  });

  const [currentUser, setCurrentUser] = useState<User | null>(userProp ?? null);
  const [availableSpecialties, setAvailableSpecialties] = useState<Specialty[]>([]);

  // Resumen modal state
  const [isResumenOpen, setIsResumenOpen] = useState(false);
  const [resumenData, setResumenData] = useState<DashboardSummary | null>(null);
  const [resumenLoading, setResumenLoading] = useState(false);
  const [resumenDesde, setResumenDesde] = useState('2026-08-01');
  const [resumenHasta, setResumenHasta] = useState('2026-08-31');

  const loadData = async () => {
    setLoading(true);
    try {
      // Primero obtener el usuario actual para saber su rol
      const meResult = await api.getMe().catch((e) => {
        console.error('Error obteniendo usuario actual:', e);
        return null;
      });
      if (meResult) {
        setCurrentUser(meResult);
      }

      // Cargar empresas según el rol
      let compsResult: Company[] = [];
      if (meResult?.rol === 'super_admin') {
        // Super admin: puede ver todas las empresas
        compsResult = await api.getCompanies().catch((e) => {
          console.error('[UsersCompaniesView] Error cargando empresas:', e);
          return [] as Company[];
        });
      } else {
        // Otros roles: solo ven su propia empresa
        const myCompany = await api.getCurrentCompany().catch((e) => {
          console.error('[UsersCompaniesView] Error cargando empresa actual:', e);
          return null;
        });
        if (myCompany) {
          compsResult = [myCompany];
        }
      }

      const usersResult = await api.getUsers().catch((e) => {
        console.error('Error cargando usuarios:', e);
        return [] as User[];
      });
      const specsResult = await api.request<Specialty[]>('/especialidades').catch(() => [] as Specialty[]);

      setCompanies(compsResult);
      setUsers(usersResult);
      setAvailableSpecialties(specsResult);

      if (meResult) {
        setCurrentUser(meResult);
      }
    } catch (error) {
      console.error('Error al cargar datos de usuarios y empresas', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // ========== Stats ==========
  const totalEmpresas = companies.length;
  const totalUsuarios = users.length;
  const usuariosActivos = users.filter(u => u.activo).length;
  const usuariosInactivos = users.filter(u => !u.activo).length;
  const adminsCount = users.filter(u => u.rol === 'administrador').length;
  const tecnicosCount = users.filter(u => u.rol === 'tecnico').length;
  const produccionCount = users.filter(u => u.rol === 'produccion').length;
  const superAdminsCount = users.filter(u => u.rol === 'super_admin').length;

  // ========== Resumen del Sistema ==========
  const loadResumen = async (desde: string, hasta: string) => {
    setResumenLoading(true);
    try {
      const data = await api.getDashboardSummary(desde, hasta);
      setResumenData(data);
    } catch (e) {
      console.error('Error cargando resumen del sistema:', e);
    } finally {
      setResumenLoading(false);
    }
  };

  const handleOpenResumen = () => {
    setIsResumenOpen(true);
    loadResumen(resumenDesde, resumenHasta);
  };

  const handleResumenDateChange = (desde: string, hasta: string) => {
    setResumenDesde(desde);
    setResumenHasta(hasta);
    loadResumen(desde, hasta);
  };

  // ========== Handlers ==========
  const handleOpenCreateUser = () => {
    // Buscar la empresa por ID del usuario actual, o usar la primera disponible
    let defaultCompanyId: number;
    if (currentUser?.rol === 'super_admin') {
      // Super admin: usar empresa seleccionada en el filtro, o la primera de la lista
      defaultCompanyId = typeof selectedCompanyId === 'number'
        ? selectedCompanyId
        : (companies[0]?.id ?? 1);
    } else {
      // Otros roles: usar su propia empresa
      const myCompany = companies.find(c => c.id === currentUser?.company_id);
      defaultCompanyId = myCompany?.id ?? currentUser?.company_id ?? (companies[0]?.id ?? 1);
    }
    setUserForm({
      company_id: defaultCompanyId,
      nombre: '',
      apellido: '',
      ci: '',
      email: '',
      telefono: '',
      cargo: '',
      curso: '',
      password: '',
      rol: 'tecnico',
      activo: true,
      especialidadIds: []
    });
    setShowPassword(false);
    setEditingUser(null);
    setIsCreateUserOpen(true);
  };

  const handleOpenEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      company_id: user.company_id || 1,
      nombre: user.nombre || '',
      apellido: user.apellido || '',
      ci: user.ci || '',
      email: user.email || '',
      telefono: user.telefono || '',
      cargo: user.cargo || '',
      curso: user.curso || '',
      password: '',
      rol: (user.rol as UserRole) || 'tecnico',
      activo: user.activo ?? true,
      especialidadIds: user.especialidades ? user.especialidades.map(s => Number(s.id)) : []
    });
    setShowPassword(false);
    setIsCreateUserOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userForm.nombre.trim() || !userForm.email.trim()) return;

    try {
      if (editingUser) {
        await api.updateUser(editingUser.id, {
          nombre: userForm.nombre,
          apellido: userForm.apellido,
          email: userForm.email,
          telefono: userForm.telefono,
          cargo: userForm.cargo,
          curso: userForm.curso,
          password: userForm.password || undefined,
          rol: userForm.rol,
          activo: userForm.activo,
          especialidad_ids: userForm.especialidadIds
        });
      } else {
        const createData: Record<string, unknown> = {
          nombre: userForm.nombre,
          apellido: userForm.apellido,
          ci: userForm.ci || `${Math.floor(Math.random() * 89999999 + 10000000)}-K`,
          email: userForm.email,
          telefono: userForm.telefono,
          cargo: userForm.cargo,
          curso: userForm.curso,
          password: userForm.password || undefined,
          rol: userForm.rol,
          especialidad_ids: userForm.especialidadIds
        };
        // Solo super_admin envía company_id explícitamente;
        // el backend asigna la empresa del usuario autenticado para los demás roles.
        if (currentUser?.rol === 'super_admin') {
          createData.company_id = userForm.company_id;
        }
        const newUser = await api.createUser(createData);
        if (newUser && newUser.id) {
          setUsers(prev => [...prev, newUser]);
        }
      }
      setIsCreateUserOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error guardando usuario', err);
      alert(`Error al guardar el usuario: ${err?.message || 'Error desconocido'}`);
    }
  };

  const handleToggleUserActive = async (user: User) => {
    try {
      await api.updateUser(user.id, { activo: !user.activo });
      await loadData();
    } catch (err: any) {
      console.error('Error cambiando estado del usuario', err);
      alert(`Error al cambiar estado: ${err?.message || 'Error desconocido'}`);
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`¿Eliminar al usuario ${user.nombre} ${user.apellido}?`)) return;
    try {
      await api.deleteUser(user.id);
      setUsers(prev => prev.filter(u => u.id !== user.id));
      await loadData();
    } catch (err: any) {
      console.error('Error al eliminar usuario', err);
      alert(`Error al eliminar usuario: ${err?.message || 'Error desconocido'}`);
    }
  };

  const handleSaveCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyForm.nombre.trim()) return;

    try {
      if (editingCompany) {
        await api.updateCompany(editingCompany.id, {
          nombre: companyForm.nombre,
          nit_ruc: companyForm.nit_ruc,
          activo: companyForm.activo
        });
      } else {
        await api.createCompany({
          nombre: companyForm.nombre,
          nit_ruc: companyForm.nit_ruc
        });
      }
      setIsCreateCompanyOpen(false);
      await loadData();
    } catch (err: any) {
      console.error('Error guardando empresa', err);
      alert(`Error al guardar la empresa: ${err?.message || 'Error desconocido'}`);
    }
  };

  const handleSetCurrentSessionUser = async (user: User) => {
    try {
      const comp = companies.find(c => c.id === user.company_id) || companies[0];
      localStorage.setItem('mantis_data_user', JSON.stringify(user));
      if (comp) {
        localStorage.setItem('mantis_data_company', JSON.stringify(comp));
      }
      setCurrentUser(user);
      if (onUserSwitch) onUserSwitch();
      alert(`Sesión simulada cambiada a: ${user.nombre} ${user.apellido} (${user.rol}) - ${comp?.nombre}`);
    } catch (e) {
      console.error('Error cambiando sesión de usuario', e);
    }
  };

  // ========== Filtered Users ==========
  const filteredUsers = users.filter(u => {
    const matchCompany = selectedCompanyId === 'all' || u.company_id === selectedCompanyId;
    const matchRole = roleFilter === 'all' || u.rol === roleFilter;
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q ||
      u.nombre.toLowerCase().includes(q) ||
      u.apellido.toLowerCase().includes(q) ||
      u.email.toLowerCase().includes(q) ||
      u.ci.toLowerCase().includes(q) ||
      (u.cargo && u.cargo.toLowerCase().includes(q));
    return matchCompany && matchRole && matchSearch;
  });

  const getRoleBadge = (rol: string) => {
    switch (rol) {
      case 'super_admin':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-purple-100 text-purple-900 border border-purple-200">Super Admin</span>;
      case 'administrador':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-[#D9EDEE] text-[#0F434A] border border-[#3D848C]/60">Administrador</span>;
      case 'tecnico':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-100 text-sky-900 border border-sky-200">Técnico</span>;
      case 'produccion':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-900 border border-amber-200">Producción</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700">{rol}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="glass-panel p-6 rounded-xl shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <Users className="w-6 h-6 text-[#165B62]" />
            Gestión de Usuarios y Empresas
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Administra personal, roles de acceso, credenciales Sanctum y empresas registradas
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Nueva Empresa: super_admin ve el botón, admin ve tooltip informativo */}
          {currentUser?.rol === 'super_admin' ? (
            <button
              onClick={() => {
                setCompanyForm({ nombre: '', nit_ruc: '', activo: true });
                setEditingCompany(null);
                setIsCreateCompanyOpen(true);
              }}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white/70 hover:bg-white border border-white/80 rounded-xl shadow-2xs transition-all cursor-pointer"
            >
              <Building className="w-4 h-4 text-[#165B62]" />
              <span>+ Nueva Empresa</span>
            </button>
          ) : currentUser?.rol === 'administrador' ? (
            <div className="relative group">
              <button
                disabled
                className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-400 bg-slate-100 border border-slate-200 rounded-xl cursor-not-allowed opacity-60"
              >
                <Building className="w-4 h-4" />
                <span>+ Nueva Empresa</span>
              </button>
              <div className="absolute right-0 top-full mt-1.5 w-56 p-2.5 rounded-xl bg-slate-800 text-white text-[12px] font-medium shadow-xl opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-10">
                <p>Solo los <span className="font-bold text-purple-300">Super Admins</span> pueden crear empresas.</p>
                <p className="text-slate-400 mt-1">Contacta al administrador global del sistema.</p>
                <div className="absolute -top-1 right-4 w-2 h-2 bg-slate-800 rotate-45" />
              </div>
            </div>
          ) : null}

          {(currentUser?.rol === 'administrador' || currentUser?.rol === 'super_admin') && (
            <button
              onClick={handleOpenCreateUser}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer"
            >
              <UserPlus className="w-4 h-4" />
              <span>+ Registrar Usuario</span>
            </button>
          )}
        </div>
      </div>

      {/* ═══ Resumen del Sistema + Empresas ═══ */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando empresas y estadísticas...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Card Resumen del Sistema — clickeable */}
          <button
            onClick={handleOpenResumen}
            className="glass-card p-4 rounded-lg border border-[#3D848C]/40 bg-gradient-to-br from-[#D9EDEE]/60 to-white/40 text-left transition-all hover:shadow-md hover:border-[#3D848C] cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#165B62]" />
                <span className="text-[12px] font-bold text-slate-600 uppercase tracking-wide">Resumen Sistema</span>
              </div>
              <span className="text-[11px] font-bold text-[#165B62] bg-[#D9EDEE] px-2 py-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                Ver KPIs →
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <p className="text-lg font-black text-slate-800 leading-tight">{totalEmpresas}</p>
                <p className="text-[11px] text-slate-500">Empresas</p>
              </div>
              <div>
                <p className="text-lg font-black text-slate-800 leading-tight">{totalUsuarios}</p>
                <p className="text-[11px] text-slate-500">Usuarios</p>
              </div>
              <div>
                <p className="text-lg font-black text-emerald-700 leading-tight">{usuariosActivos}</p>
                <p className="text-[11px] text-slate-500">Activos</p>
              </div>
              <div>
                <p className="text-lg font-black text-rose-600 leading-tight">{usuariosInactivos}</p>
                <p className="text-[11px] text-slate-500">Inactivos</p>
              </div>
            </div>
            <div className="mt-3 pt-2 border-t border-white/60 flex items-center gap-3 text-[11px] text-slate-500">
              <span className="flex items-center gap-1"><UserCog className="w-3 h-3 text-sky-600" /> {adminsCount} admin{adminsCount !== 1 ? 's' : ''}</span>
              <span className="flex items-center gap-1"><Factory className="w-3 h-3 text-amber-600" /> {tecnicosCount + produccionCount} técnico{tecnicosCount + produccionCount !== 1 ? 's' : ''}</span>
            </div>
          </button>

          {/* Cards de Empresas */}
          {companies.map(comp => {
            const compUsers = users.filter(u => u.company_id === comp.id);
            const compActive = compUsers.filter(u => u.activo).length;
            const isSel = selectedCompanyId === comp.id;
            return (
              <button
                key={comp.id}
                onClick={() => setSelectedCompanyId(comp.id)}
                className={`p-4 rounded-lg border text-left transition-all relative cursor-pointer ${
                  isSel
                    ? 'bg-[#D9EDEE] border-[#3D848C] text-[#0F434A] shadow-xs'
                    : 'glass-card text-slate-700 hover:bg-white/60'
                }`}
              >
                <div className="flex items-center justify-between gap-1">
                  <span className="text-xs font-bold truncate">{comp.nombre}</span>
                  {isSel && <Check className="w-3.5 h-3.5 text-[#165B62] shrink-0" />}
                </div>
                <p className="text-[11px] text-slate-400 mt-0.5 font-mono">{comp.nit_ruc || 'Sin RUT/NIT'}</p>
                <div className="mt-2 flex items-center gap-3">
                  <div>
                    <p className="text-base font-black leading-tight">{compUsers.length}</p>
                    <p className="text-[11px] text-slate-500">usuarios</p>
                  </div>
                  <div className="h-6 w-px bg-slate-300/50" />
                  <div>
                    <p className="text-base font-black text-emerald-700 leading-tight">{compActive}</p>
                    <p className="text-[11px] text-slate-500">activos</p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-1">
                  <span className={`w-2 h-2 rounded-full ${comp.activo ? 'bg-emerald-500' : 'bg-rose-400'}`} />
                  <span className="text-[11px] text-slate-400">{comp.activo ? 'Activa' : 'Inactiva'}</span>
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* ═══ Filtros y búsqueda ═══ */}
      <div className="glass-panel p-4 rounded-lg flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nombre, email, RUT/CI o cargo..."
            className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
          />
        </div>

        {/* Company & Role Filters */}
        <div className="flex items-center gap-2 w-full md:w-auto flex-wrap">
          {/* Company filter */}
          <select
            value={selectedCompanyId === 'all' ? 'all' : String(selectedCompanyId)}
            onChange={(e) => setSelectedCompanyId(e.target.value === 'all' ? 'all' : Number(e.target.value))}
            className="px-3 py-2 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-slate-700 focus:border-[#3D848C] focus:outline-none cursor-pointer"
          >
            <option value="all" className="text-slate-700 bg-white">Todas las empresas</option>
            {companies.map(c => (
              <option key={c.id} value={c.id} className="text-slate-800 bg-white">{c.nombre}</option>
            ))}
          </select>

          {/* Role filter pills */}
          <div className="flex items-center gap-1">
            {[
              { id: 'all', label: 'Todos' },
              { id: 'administrador', label: 'Admin' },
              { id: 'tecnico', label: 'Técnicos' },
              { id: 'produccion', label: 'Producción' },
              { id: 'super_admin', label: 'Super' }
            ].map(r => (
              <button
                key={r.id}
                onClick={() => setRoleFilter(r.id)}
                className={`px-2.5 py-1.5 rounded-lg text-[12px] font-bold transition-all shrink-0 cursor-pointer ${
                  roleFilter === r.id
                    ? 'bg-slate-800 text-white shadow-2xs'
                    : 'bg-white/40 text-slate-600 hover:bg-white/70'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* ═══ Tabla de Usuarios ═══ */}
      {loading ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-xl p-8">
          <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
          <p className="text-xs font-medium">Cargando lista de usuarios...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="py-12 text-center text-slate-500 glass-panel rounded-xl p-8">
          <UserCheck className="w-10 h-10 text-slate-300 mx-auto mb-2" />
          <p className="text-sm font-bold text-slate-700">No se encontraron usuarios</p>
          <p className="text-xs text-slate-400 mt-1">Intenta ajustando los filtros o registra un nuevo usuario.</p>
        </div>
      ) : (
        <div className="glass-panel rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-white/60">
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Usuario</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 hidden sm:table-cell">Email</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600 hidden md:table-cell">Empresa</th>
                  <th className="text-left px-4 py-3 font-bold text-slate-600">Rol</th>
                  <th className="text-center px-4 py-3 font-bold text-slate-600">Estado</th>
                  <th className="text-right px-4 py-3 font-bold text-slate-600">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const comp = companies.find(c => c.id === u.company_id);
                  const isMe = currentUser?.id === u.id;

                  return (
                    <tr
                      key={u.id}
                      className={`border-b border-white/40 transition-all hover:bg-white/30 ${
                        isMe ? 'bg-[#D9EDEE]/20' : ''
                      }`}
                    >
                      {/* Usuario */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#3D848C] to-[#165B62] flex items-center justify-center text-white font-bold text-[12px] shadow-2xs shrink-0">
                            {u.nombre.charAt(0)}{u.apellido.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <p className="font-bold text-slate-800">{u.nombre} {u.apellido}</p>
                              {isMe && (
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-[#D9EDEE] text-[#0F434A] border border-[#3D848C]">
                                  Tú
                                </span>
                              )}
                            </div>
                            {u.cargo && (
                              <p className="text-[12px] text-slate-400">{u.cargo}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Email */}
                      <td className="px-4 py-3 hidden sm:table-cell">
                        <p className="text-slate-600 truncate max-w-[200px]">{u.email}</p>
                      </td>

                      {/* Empresa */}
                      <td className="px-4 py-3 hidden md:table-cell">
                        <span className="flex items-center gap-1 text-slate-500">
                          <Building2 className="w-3 h-3 text-slate-400" />
                          {comp?.nombre || '—'}
                        </span>
                      </td>

                      {/* Rol */}
                      <td className="px-4 py-3">
                        {getRoleBadge(u.rol)}
                      </td>

                      {/* Estado */}
                      <td className="px-4 py-3 text-center">
                        {u.activo ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Activo
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-rose-600 font-semibold">
                            <XCircle className="w-3.5 h-3.5" /> Inactivo
                          </span>
                        )}
                      </td>

                      {/* Acciones */}
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleUserActive(u)}
                            className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all ${
                              u.activo
                                ? 'text-[#0F434A] hover:bg-rose-50 hover:text-rose-700'
                                : 'text-emerald-700 hover:bg-emerald-50'
                            }`}
                            title={u.activo ? 'Desactivar usuario' : 'Activar usuario'}
                          >
                            {u.activo ? <XCircle className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            onClick={() => handleSetCurrentSessionUser(u)}
                            className="p-1 rounded-lg text-slate-400 hover:text-[#165B62] hover:bg-[#D9EDEE]/50 cursor-pointer"
                            title="Simular sesión de este usuario"
                          >
                            <KeyRound className="w-3.5 h-3.5" />
                          </button>

                          {(currentUser?.rol === 'administrador' || currentUser?.rol === 'super_admin') && (
                            <>
                              <button
                                onClick={() => handleOpenEditUser(u)}
                                className="p-1 rounded-lg text-slate-400 hover:text-slate-800 hover:bg-white/80 cursor-pointer"
                                title="Editar usuario"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteUser(u)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer"
                                title="Eliminar usuario"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Footer count */}
          <div className="px-4 py-2.5 border-t border-white/40 bg-white/20 flex items-center justify-between text-[12px] text-slate-500">
            <span>Mostrando {filteredUsers.length} de {totalUsuarios} usuarios</span>
            <span>{totalEmpresas} empresas registradas</span>
          </div>
        </div>
      )}

      {/* ═══ CREATE / EDIT USER MODAL ═══ */}
      {isCreateUserOpen && (currentUser?.rol === 'administrador' || currentUser?.rol === 'super_admin') && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-modal rounded-xl max-w-xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
                  <UserPlus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800">
                    {editingUser ? 'Editar Usuario' : 'Registrar Nuevo Usuario'}
                  </h3>
                  <p className="text-xs text-slate-500">Asigna credenciales, empresa tenant y especialidades técnicas</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateUserOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUser} className="space-y-4 mt-4">
              {/* Company Selection */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Empresa (Tenant)</label>
                <select
                  value={userForm.company_id}
                  onChange={(e) => setUserForm({ ...userForm, company_id: Number(e.target.value) })}
                  className={`w-full px-3 py-2 text-xs rounded-xl border focus:outline-none ${
                    currentUser?.rol !== 'super_admin'
                      ? 'bg-slate-100 text-slate-600 border-slate-200 cursor-not-allowed'
                      : 'bg-white text-slate-800 border-slate-300 focus:border-[#3D848C]'
                  }`}
                  disabled={currentUser?.rol !== 'super_admin'}
                >
                  {companies.length === 0 && <option value="">Cargando empresas...</option>}
                  {(currentUser?.rol === 'super_admin'
                    ? companies
                    : companies.filter(c => c.id === currentUser?.company_id)
                  ).map(c => (
                    <option key={c.id} value={c.id} className="text-slate-800 bg-white">
                      {c.nombre} ({c.nit_ruc || 'Sin RUC'})
                    </option>
                  ))}
                </select>
                {currentUser?.rol !== 'super_admin' && (
                  <p className="text-[11px] text-slate-400 mt-1">Solo Super Admin puede cambiar de empresa</p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Nombre *</label>
                  <input
                    type="text"
                    required
                    value={userForm.nombre}
                    onChange={(e) => setUserForm({ ...userForm, nombre: e.target.value })}
                    placeholder="Ej. Carlos"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Apellido *</label>
                  <input
                    type="text"
                    required
                    value={userForm.apellido}
                    onChange={(e) => setUserForm({ ...userForm, apellido: e.target.value })}
                    placeholder="Ej. Mantis"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cédula / CI / RUT</label>
                  <input
                    type="text"
                    value={userForm.ci}
                    onChange={(e) => setUserForm({ ...userForm, ci: e.target.value })}
                    placeholder="12345678-K"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Teléfono Móvil</label>
                  <input
                    type="text"
                    value={userForm.telefono}
                    onChange={(e) => setUserForm({ ...userForm, telefono: e.target.value })}
                    placeholder="+56 9 8765 4321"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico *</label>
                  <input
                    type="email"
                    required
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    placeholder="usuario@empresa.com"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Rol en el Sistema</label>
                  <select
                    value={userForm.rol}
                    onChange={(e) => setUserForm({ ...userForm, rol: e.target.value as UserRole })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-300 bg-white text-slate-800 focus:border-[#3D848C] focus:outline-none font-medium"
                  >
                    <option value="administrador" className="text-slate-800 bg-white">Administrador</option>
                    <option value="tecnico" className="text-slate-800 bg-white">Técnico</option>
                    <option value="produccion" className="text-slate-800 bg-white">Producción</option>
                    <option value="super_admin" className="text-slate-800 bg-white">Super Admin</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {editingUser ? 'Nueva Contraseña (opcional)' : 'Contraseña'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    placeholder={editingUser ? 'Dejar vacío para mantener la actual' : '••••••••'}
                    className="w-full px-3 py-2 pr-10 text-xs glass-input rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer transition-colors"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-[11px] text-slate-400 mt-1">
                  {editingUser
                    ? 'Si se deja vacío, no se cambiará la contraseña actual.'
                    : 'Si se deja vacío, el usuario no podrá iniciar sesión.'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Cargo / Puesto</label>
                  <input
                    type="text"
                    value={userForm.cargo}
                    onChange={(e) => setUserForm({ ...userForm, cargo: e.target.value })}
                    placeholder="Ej. Técnico Electromecánico Senior"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Curso / Certificación</label>
                  <input
                    type="text"
                    value={userForm.curso}
                    onChange={(e) => setUserForm({ ...userForm, curso: e.target.value })}
                    placeholder="Ej. Alineación Láser & Predictivo"
                    className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Specialty checkboxes */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-2">Especialidades Técnicas</label>
                <div className="grid grid-cols-2 gap-2 bg-white/30 p-3 rounded-lg border border-white/60">
                  {availableSpecialties.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic p-1 col-span-2">
                      No hay especialidades cargadas para esta empresa todavía.
                    </p>
                  ) : (
                    availableSpecialties.map(sp => {
                      const spId = Number(sp.id);
                      const isChecked = userForm.especialidadIds.includes(spId);
                      return (
                        <label key={sp.id} className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setUserForm({ ...userForm, especialidadIds: [...userForm.especialidadIds, spId] });
                              } else {
                                setUserForm({ ...userForm, especialidadIds: userForm.especialidadIds.filter(id => id !== spId) });
                              }
                            }}
                            className="rounded border-slate-300 text-[#165B62] focus:ring-[#3D848C]"
                          />
                          <span className="truncate">{sp.nombre}</span>
                        </label>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Active Toggle */}
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="userActive"
                  checked={userForm.activo}
                  onChange={(e) => setUserForm({ ...userForm, activo: e.target.checked })}
                  className="rounded border-slate-300 text-[#165B62] focus:ring-[#3D848C]"
                />
                <label htmlFor="userActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Usuario Activo (Permite iniciar sesión con Sanctum)
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsCreateUserOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  {editingUser ? 'Guardar Cambios' : 'Registrar Usuario'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ CREATE / EDIT COMPANY MODAL ═══ */}
      {isCreateCompanyOpen && currentUser?.rol === 'super_admin' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4">
          <div className="glass-modal rounded-xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800">
                    {editingCompany ? 'Editar Empresa' : 'Registrar Nueva Empresa'}
                  </h3>
                  <p className="text-xs text-slate-500">Crea un entorno aislado para cada planta o cliente</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateCompanyOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCompany} className="space-y-4 mt-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Nombre de la Empresa / Planta *</label>
                <input
                  type="text"
                  required
                  value={companyForm.nombre}
                  onChange={(e) => setCompanyForm({ ...companyForm, nombre: e.target.value })}
                  placeholder="Ej. Lácteos del Sur SpA"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">RUT / NIT / Identificador Fiscal</label>
                <input
                  type="text"
                  value={companyForm.nit_ruc}
                  onChange={(e) => setCompanyForm({ ...companyForm, nit_ruc: e.target.value })}
                  placeholder="Ej. 76.543.210-K"
                  className="w-full px-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="companyActive"
                  checked={companyForm.activo}
                  onChange={(e) => setCompanyForm({ ...companyForm, activo: e.target.checked })}
                  className="rounded border-slate-300 text-[#165B62] focus:ring-[#3D848C]"
                />
                <label htmlFor="companyActive" className="text-xs font-bold text-slate-700 cursor-pointer">
                  Empresa Activa en el Sistema
                </label>
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-white/60">
                <button
                  type="button"
                  onClick={() => setIsCreateCompanyOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-white/60 rounded-xl cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl shadow-xs transition-all cursor-pointer"
                >
                  Guardar Empresa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ═══ MODAL: Resumen del Sistema (KPIs) ═══ */}
      {isResumenOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/30 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="glass-modal rounded-xl max-w-3xl w-full p-6 shadow-2xl my-8">
            <div className="flex items-center justify-between pb-4 border-b border-white/60">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-[#D9EDEE] text-[#0F434A] rounded-xl border border-[#3D848C]/50">
                  <BarChart3 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-slate-800">Resumen General del Sistema</h3>
                  <p className="text-xs text-slate-500">Métricas globales de mantenimiento, inventario y costos</p>
                </div>
              </div>
              <button
                onClick={() => setIsResumenOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-700 rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Date filter */}
            <div className="flex items-center gap-2 mt-4 mb-5">
              <span className="text-[12px] font-bold text-slate-500">Período:</span>
              <input
                type="date"
                value={resumenDesde}
                onChange={(e) => handleResumenDateChange(e.target.value, resumenHasta)}
                className="px-2 py-1 text-xs glass-input rounded-lg focus:outline-none"
              />
              <span className="text-slate-400">—</span>
              <input
                type="date"
                value={resumenHasta}
                onChange={(e) => handleResumenDateChange(resumenDesde, e.target.value)}
                className="px-2 py-1 text-xs glass-input rounded-lg focus:outline-none"
              />
            </div>

            {resumenLoading ? (
              <div className="py-12 text-center">
                <RefreshCw className="w-6 h-6 text-[#165B62] animate-spin mx-auto mb-2" />
                <p className="text-xs text-slate-500">Cargando métricas del sistema...</p>
              </div>
            ) : resumenData ? (
              <div className="space-y-4">
                {/* KPIs Row 1: Órdenes de Trabajo */}
                <div>
                  <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <Wrench className="w-3.5 h-3.5 text-[#165B62]" /> Órdenes de Trabajo
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="glass-card p-3 rounded-xl text-center">
                      <p className="text-xl font-black text-slate-800">{resumenData.ordenes_trabajo.total}</p>
                      <p className="text-[11px] text-slate-500">Total OT</p>
                    </div>
                    <div className="glass-card p-3 rounded-xl text-center">
                      <p className="text-xl font-black text-amber-700">{resumenData.ordenes_trabajo.backlog_abiertas}</p>
                      <p className="text-[11px] text-slate-500">Backlog Abiertas</p>
                    </div>
                    <div className="glass-card p-3 rounded-xl text-center">
                      <p className="text-xl font-black text-rose-600">{resumenData.ordenes_trabajo.vencidas}</p>
                      <p className="text-[11px] text-slate-500">Vencidas</p>
                    </div>
                    <div className="glass-card p-3 rounded-xl text-center">
                      <p className="text-xl font-black text-sky-700">{resumenData.ordenes_trabajo.mttr_minutos}<span className="text-xs font-normal"> min</span></p>
                      <p className="text-[11px] text-slate-500">MTTR</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-2">
                    <div className="glass-card p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center"><AlertTriangle className="w-4 h-4 text-orange-600" /></div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{resumenData.ordenes_trabajo.correctivas}</p>
                        <p className="text-[11px] text-slate-500">Correctivas</p>
                      </div>
                    </div>
                    <div className="glass-card p-3 rounded-xl flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center"><Calendar className="w-4 h-4 text-emerald-600" /></div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{resumenData.ordenes_trabajo.preventivas}</p>
                        <p className="text-[11px] text-slate-500">Preventivas</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPIs Row 2: Costos y Downtime */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Costos */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-[#165B62]" /> Costos
                    </h4>
                    <div className="glass-card p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Mano de Obra</span>
                        <span className="text-xs font-bold text-slate-800">${resumenData.costos.mano_obra.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Materiales</span>
                        <span className="text-xs font-bold text-slate-800">${resumenData.costos.materiales.toLocaleString()}</span>
                      </div>
                      <div className="pt-2 border-t border-white/60 flex items-center justify-between">
                        <span className="text-xs font-bold text-slate-800">Total</span>
                        <span className="text-sm font-black text-[#165B62]">${resumenData.costos.total.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Tiempo Inactividad */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-[#165B62]" /> Tiempo de Inactividad
                    </h4>
                    <div className="glass-card p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Órdenes con Downtime</span>
                        <span className="text-xs font-bold text-slate-800">{resumenData.tiempo_inactividad.ordenes_con_downtime}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Horas Totales</span>
                        <span className="text-xs font-bold text-slate-800">{resumenData.tiempo_inactividad.horas_totales}h</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Minutos Totales</span>
                        <span className="text-xs font-bold text-slate-800">{resumenData.tiempo_inactividad.minutos_totales} min</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* KPIs Row 3: Mantenimiento Preventivo e Inventario */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Mantenimiento Preventivo */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-[#165B62]" /> Mantenimiento Preventivo
                    </h4>
                    <div className="glass-card p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Planes Activos</span>
                        <span className="text-xs font-bold text-emerald-700">{resumenData.mantenimiento_preventivo.planes_activos}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Planes Atrasados</span>
                        <span className="text-xs font-bold text-rose-600">{resumenData.mantenimiento_preventivo.planes_atrasados}</span>
                      </div>
                    </div>
                  </div>

                  {/* Inventario */}
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <Package className="w-3.5 h-3.5 text-[#165B62]" /> Inventario
                    </h4>
                    <div className="glass-card p-4 rounded-xl space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Repuestos Bajo Stock</span>
                        <span className="text-xs font-bold text-amber-700">{resumenData.inventario.repuestos_bajo_stock}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-600">Valor Total Estimado</span>
                        <span className="text-xs font-bold text-slate-800">${resumenData.inventario.valor_total_estimado.toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Top Máquinas por Costo */}
                {resumenData.top_maquinas.por_costo.length > 0 && (
                  <div>
                    <h4 className="text-[12px] font-bold text-slate-500 uppercase tracking-wide mb-2 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-[#165B62]" /> Top Máquinas por Costo
                    </h4>
                    <div className="glass-card rounded-xl overflow-hidden">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-white/60">
                            <th className="text-left px-3 py-2 font-bold text-slate-500">Máquina</th>
                            <th className="text-left px-3 py-2 font-bold text-slate-500">Código</th>
                            <th className="text-right px-3 py-2 font-bold text-slate-500">Costo Total</th>
                          </tr>
                        </thead>
                        <tbody>
                          {resumenData.top_maquinas.por_costo.slice(0, 5).map((m) => (
                            <tr key={m.id} className="border-b border-white/40 last:border-0">
                              <td className="px-3 py-2 font-medium text-slate-700">{m.nombre}</td>
                              <td className="px-3 py-2 text-slate-500 font-mono">{m.codigo}</td>
                              <td className="px-3 py-2 text-right font-bold text-slate-800">${m.costo_total.toLocaleString()}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Footer */}
                <div className="pt-3 border-t border-white/60 flex items-center justify-between text-[12px] text-slate-400">
                  <span>Período: {resumenData.periodo.desde} — {resumenData.periodo.hasta}</span>
                  <button
                    onClick={() => setIsResumenOpen(false)}
                    className="px-3 py-1.5 text-[12px] font-bold text-slate-900 hover:text-white bg-[#3D848C] hover:bg-[#165B62] rounded-xl cursor-pointer"
                  >
                    Cerrar
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                No hay datos disponibles para este período.
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
