import { UserRole } from './common';

export interface Specialty {
  id: number;
  nombre: string;
  activo: boolean;
}

export interface User {
  id: number;
  company_id: number | null;
  ci: string;
  telefono: string | null;
  nombre: string;
  apellido: string;
  cargo: string | null;
  curso: string | null;
  email: string;
  rol: UserRole | string;
  activo: boolean;
  created_at: string | null;
  especialidades?: Specialty[];
}

export interface Company {
  id: number;
  nombre: string;
  nit_ruc: string | null;
  activo: boolean;
  created_at: string | null;
}

export interface AuthSessionToken {
  id: string;
  name: string;
  last_used_at: string | null;
  created_at: string;
  es_actual: boolean;
}
