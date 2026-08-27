import React, { useState } from 'react';
import {
  Lock,
  Mail,
  Eye,
  EyeOff,
  Building2,
  ArrowRight,
  RefreshCw,
  AlertCircle,
  Settings,
  QrCode,
  CheckCircle2,
  Users
} from 'lucide-react';
import { api } from '../services/api';
import { User, Company } from '../types';

interface LoginScreenProps {
  onLoginSuccess: (user: User, company: Company) => void;
  onOpenApiConfig: () => void;
  onOpenQrReport: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLoginSuccess,
  onOpenApiConfig,
  onOpenQrReport
}) => {
  const [email, setEmail] = useState('admin@mantis-cmms.com');
  const [password, setPassword] = useState('123456');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim() || !password.trim()) {
      setError('Por favor ingrese su correo electrónico y contraseña.');
      return;
    }

    setLoading(true);
    try {
      const authRes = await api.login(email, password);
      // Los super_admin no necesitan empresa asociada — saltamos el endpoint /empresas/actual
      if (authRes.user.rol === 'super_admin') {
        onLoginSuccess(authRes.user, null as unknown as Company);
      } else {
        const companyRes = await api.getCurrentCompany();
        onLoginSuccess(authRes.user, companyRes);
      }
    } catch (err: any) {
      console.error('Error al iniciar sesión:', err);
      setError(err.message || 'Error al autenticar. Verifique sus credenciales o conexión.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-gradient-to-br from-stone-100 via-emerald-50/40 to-stone-200 selection:bg-[#3D848C] selection:text-slate-900">
      
      <div className="max-w-4xl w-full grid grid-cols-1 lg:grid-cols-12 glass-panel rounded-3xl overflow-hidden shadow-2xl border border-white/80">
        
        {/* Left Side: Brand & Visual Banner */}
        <div className="lg:col-span-5 p-8 bg-gradient-to-br from-slate-900 via-slate-800 to-stone-900 text-white flex flex-col justify-between relative overflow-hidden">
          {/* Subtle Ambient Glow */}
          <div className="absolute -top-24 -left-24 w-60 h-60 bg-[#3D848C]/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-60 h-60 bg-[#165B62]/20 rounded-full blur-3xl pointer-events-none" />

          {/* Top Logo */}
          <div className="relative z-10 space-y-3">
            <div className="flex items-center gap-2.5">
              <img
                src="/logo-icon.png"
                alt="Mantis Intelligence System"
                className="w-10 h-10 rounded-2xl bg-white shadow-md object-contain p-1"
              />
              <div>
                <span className="text-xl font-black tracking-tight text-white block leading-tight">MANTIS</span>
                <span className="text-[11px] tracking-widest text-[#3D848C] font-bold uppercase block">Intelligence System · CMMS</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed pt-2">
              Sistema Inteligente de Gestión de Mantenimiento, Órdenes de Trabajo, Inventario de Repuestos y Control de Maquinaria.
            </p>
          </div>

          {/* Features Highlights */}
          <div className="relative z-10 space-y-3 my-8 text-xs text-slate-300">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[#3D848C]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Autenticación Tokens Sanctum Bearer</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[#3D848C]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Control Multi-Tenant por Planta & Empresa</span>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-[#3D848C]">
                <CheckCircle2 className="w-3.5 h-3.5" />
              </div>
              <span>Reportes de Falla Terreno mediante Código QR</span>
            </div>
          </div>

          {/* Bottom Info / Version */}
          <div className="relative z-10 pt-4 border-t border-white/10 flex items-center justify-between text-[12px] text-slate-400">
            <span>Versión 2.5 CMMS</span>
            <span className="px-2 py-0.5 rounded-full bg-white/10 text-slate-300 font-mono text-[11px]">
              API Live Laravel
            </span>
          </div>
        </div>

        {/* Right Side: Login Form & Quick Demo Buttons */}
        <div className="lg:col-span-7 p-8 sm:p-10 bg-white/70 backdrop-blur-md flex flex-col justify-between">
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800">Iniciar Sesión</h2>
                <p className="text-xs text-slate-500 mt-0.5">Ingresa tus credenciales de usuario</p>
              </div>

              <button
                type="button"
                onClick={onOpenApiConfig}
                className="p-2 text-slate-500 hover:text-slate-800 bg-white/80 hover:bg-white rounded-xl border border-white shadow-2xs transition-all cursor-pointer"
                title="Configuración de Conexión Laravel API / Sanctum"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Error Alert */}
            {error && (
              <div className="mb-4 p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-fadeIn">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            {/* Login Form */}
            <form onSubmit={handleLogin} className="space-y-4">
              
              {/* Email */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="usuario@mantis-cmms.com"
                    className="w-full pl-9 pr-3 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-10 py-2 text-xs glass-input rounded-xl focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-700 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 px-4 bg-[#3D848C] hover:bg-[#165B62] text-slate-900 hover:text-white font-extrabold text-xs rounded-xl shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Autenticando...</span>
                  </>
                ) : (
                  <>
                    <span>Ingresar al Sistema Mantis</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>


          </div>

          {/* Footer QR Quick Action */}
          <div className="mt-6 pt-4 border-t border-slate-200/60 flex items-center justify-between text-xs text-slate-500">
            <span>¿Eres técnico en terreno?</span>
            <button
              type="button"
              onClick={onOpenQrReport}
              className="text-[#0F434A] font-bold hover:underline flex items-center gap-1 cursor-pointer"
            >
              <QrCode className="w-3.5 h-3.5 text-[#165B62]" />
              <span>Reportar Falla por QR Sin Login</span>
            </button>
          </div>

        </div>

      </div>

    </div>
  );
};
