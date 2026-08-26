export interface Machine {
  id: number;
  nombre: string;
  codigo: string;
  qr_token: string;
  marca: string | null;
  descripcion: string | null;
  area: string | null;
  planta: string | null;
  activo: boolean;
  ficha_tecnica: string[] | null;
  fecha_registro: string;
}

export interface MachineDocument {
  id: number;
  machine_id: number;
  tipo: string;
  titulo: string;
  url: string;
  descripcion: string | null;
  uploaded_by_id: number;
  created_at: string | null;
}

export interface MeterReading {
  id: string | number;
  machine_id: string | number;
  tipo: string;
  valor: number;
  created_at: string;
}

export interface MachineKpi {
  periodo: {
    desde: string;
    hasta: string;
  };
  ordenes_trabajo: {
    total: number;
    backlog_abiertas: number;
    correctivas: number;
    preventivas: number | string;
    mttr_minutos: number;
    mtbf_horas: number;
  };
  costos: {
    mano_obra: number;
    materiales: number;
    total: number;
    promedio_por_ot: number;
  };
  tiempo_inactividad: {
    ordenes_con_downtime: number;
    minutos_totales: number | string;
    horas_totales: number;
  };
  mantenimiento: {
    ultimo_mantenimiento: string | null;
    proximo_programado: string | null;
    planes_preventivos_activos: number;
  };
}
