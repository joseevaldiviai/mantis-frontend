export interface DashboardSummary {
  periodo: {
    desde: string;
    hasta: string;
  };
  ordenes_trabajo: {
    total: number;
    por_estado: Record<string, number> | number[];
    por_prioridad: Record<string, number> | number[];
    backlog_abiertas: number;
    vencidas: number;
    correctivas: number;
    preventivas: number;
    mttr_minutos: number;
  };
  costos: {
    mano_obra: number;
    materiales: number;
    total: number;
  };
  tiempo_inactividad: {
    ordenes_con_downtime: number;
    minutos_totales: number | string;
    horas_totales: number;
  };
  mantenimiento_preventivo: {
    planes_activos: number;
    planes_atrasados: number;
  };
  inventario: {
    repuestos_bajo_stock: number;
    valor_total_estimado: number;
  };
  top_maquinas: {
    por_costo: Array<{ id: number; nombre: string; codigo: string; costo_total: number }>;
    por_downtime: Array<{ id: number; nombre: string; codigo: string; minutos_inactividad: number | string }>;
    por_fallas: Array<{ id: number; nombre: string; codigo: string; fallas: number }>;
  };
}
