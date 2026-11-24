export type ReportTabType =
  | 'resumen'
  | 'ventas'
  | 'dispensadores'
  | 'compras'
  | 'inventario'
  | 'salidas'
  | 'clientes';

export type ReportExportFormat = 'csv' | 'excel' | 'pdf';

export interface PredefinedVoiceCommand {
  id: string;
  etiqueta: string;
  fraseEjemplo: string;
  descripcion: string;
  tipo: ReportTabType;
  periodo: 'todo' | 'semana' | 'mes' | 'ano';
  formato?: ReportExportFormat;
  soloHoy?: boolean;
}

export interface ParsedVoiceIntent {
  matchedCommandId?: string;
  tipo: ReportTabType | 'sucursales';
  periodo: 'todo' | 'semana' | 'mes' | 'ano';
  desde?: string;
  hasta?: string;
  sucursalId?: number;
  sucursalNombre?: string;
  formato?: ReportExportFormat;
  preguntaIa: string;
}

export const PREDEFINED_VOICE_COMMANDS: PredefinedVoiceCommand[] = [
  {
    id: 'ventas-hoy',
    etiqueta: 'Ventas de hoy',
    fraseEjemplo: 'Muéstrame el reporte de ventas de hoy',
    descripcion: 'Ventas emitidas y total recaudado durante la jornada actual.',
    tipo: 'ventas',
    periodo: 'todo',
    soloHoy: true,
  },
  {
    id: 'ventas-semana',
    etiqueta: 'Ventas de la semana',
    fraseEjemplo: 'Generar reporte de ventas de esta semana',
    descripcion: 'Consolidado semanal de ventas por pista y tienda.',
    tipo: 'ventas',
    periodo: 'semana',
  },
  {
    id: 'ventas-mes',
    etiqueta: 'Ventas del mes',
    fraseEjemplo: 'Analiza las ventas del mes y dime los totales',
    descripcion: 'Desempeño mensual de ventas con comparativo combustible/tienda.',
    tipo: 'ventas',
    periodo: 'mes',
  },
  {
    id: 'dispensadores',
    etiqueta: 'Dispensadores y combustibles',
    fraseEjemplo: 'Reporte de dispensadores y litros despachados este mes',
    descripcion: 'Despachos, litros y montos agrupados por isla y manguera.',
    tipo: 'dispensadores',
    periodo: 'mes',
  },
  {
    id: 'inventario-critico',
    etiqueta: 'Stock crítico',
    fraseEjemplo: '¿Qué productos tienen stock crítico o bajo mínimo?',
    descripcion: 'Estado valorado de inventario y alertas de reposición urgente.',
    tipo: 'inventario',
    periodo: 'todo',
  },
  {
    id: 'compras-proveedor',
    etiqueta: 'Compras por proveedor',
    fraseEjemplo: 'Reporte de compras por proveedor de este mes',
    descripcion: 'Resumen de recepciones y montos comprados por proveedor.',
    tipo: 'compras',
    periodo: 'mes',
  },
  {
    id: 'salidas-mermas',
    etiqueta: 'Mermas y salidas',
    fraseEjemplo: 'Mermas y salidas de inventario de este mes',
    descripcion: 'Bajas confirmadas por merma, vencimiento o consumo interno.',
    tipo: 'salidas',
    periodo: 'mes',
  },
  {
    id: 'top-clientes',
    etiqueta: 'Top clientes B-SISA',
    fraseEjemplo: 'Muéstrame el ranking de mejores clientes',
    descripcion: 'Ranking de clientes frecuentes por volumen de cargas.',
    tipo: 'clientes',
    periodo: 'todo',
  },
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function localTodayIso(now = new Date()): string {
  const laPaz = new Date(now.getTime() - 4 * 3600000);
  return laPaz.toISOString().split('T')[0];
}

function shiftIsoDate(iso: string, deltaDays: number): string {
  const dt = new Date(`${iso}T00:00:00Z`);
  dt.setUTCDate(dt.getUTCDate() + deltaDays);
  return dt.toISOString().split('T')[0];
}

export function parseVoiceReportIntent(
  transcript: string,
  branches: { id: number; nombre: string }[] = [],
  now = new Date(),
): ParsedVoiceIntent {
  const norm = normalizeText(transcript);
  let tipo: ParsedVoiceIntent['tipo'] = 'resumen';
  let matchedCommandId: string | undefined;

  if (/\b(venta|ventas|facturacion|vendido|ingreso|ingresos|recaudacion)\b/.test(norm)) {
    tipo = 'ventas';
  } else if (/\b(dispensador|dispensadores|manguera|mangueras|combustible|combustibles|litro|litros|bomba|isla)\b/.test(norm)) {
    tipo = 'dispensadores';
  } else if (/\b(compra|compras|proveedor|proveedores|abastecimiento)\b/.test(norm)) {
    tipo = 'compras';
  } else if (/\b(inventario|stock|almacen|producto|productos|critico|agotado|minimo)\b/.test(norm)) {
    tipo = 'inventario';
  } else if (/\b(salida|salidas|merma|mermas|baja|bajas|vencimiento)\b/.test(norm)) {
    tipo = 'salidas';
  } else if (/\b(cliente|clientes|ranking|frecuente|placa|fidelidad)\b/.test(norm)) {
    tipo = 'clientes';
  } else if (/\b(resumen|ejecutivo|dashboard|kpi|general)\b/.test(norm)) {
    tipo = 'resumen';
  }

  if (tipo === 'resumen' && /\bsucursales\b/.test(norm)) {
    tipo = 'sucursales';
  }

  let periodo: 'todo' | 'semana' | 'mes' | 'ano' = 'todo';
  let desde: string | undefined;
  let hasta: string | undefined;
  const today = localTodayIso(now);
  const utcToday = now.toISOString().split('T')[0];

  if (/\bhoy\b/.test(norm)) {
    desde = today;
    hasta = utcToday > today ? utcToday : today;
  } else if (/\bayer\b/.test(norm)) {
    const yesterday = shiftIsoDate(today, -1);
    desde = yesterday;
    hasta = yesterday;
  } else if (/\b(semana|semanal|7 dias)\b/.test(norm)) {
    periodo = 'semana';
  } else if (/\b(mes|mensual|30 dias)\b/.test(norm)) {
    periodo = 'mes';
  } else if (/\b(ano|anual)\b/.test(norm)) {
    periodo = 'ano';
  }

  let formato: ReportExportFormat | undefined;
  if (/\b(excel|xlsx|hoja de calculo|planilla)\b/.test(norm)) {
    formato = 'excel';
  } else if (/\b(pdf|documento)\b/.test(norm)) {
    formato = 'pdf';
  } else if (/\bcsv\b/.test(norm)) {
    formato = 'csv';
  }

  let sucursalId: number | undefined;
  let sucursalNombre: string | undefined;
  for (const branch of branches) {
    const branchNorm = normalizeText(branch.nombre);
    const shortName = branchNorm.replace(/^biopetrol\s*-\s*/i, '').replace(/^sucursal\s+/i, '').trim();
    if ((branchNorm && norm.includes(branchNorm)) || (shortName.length >= 4 && norm.includes(shortName))) {
      sucursalId = branch.id;
      sucursalNombre = branch.nombre;
      break;
    }
  }

  if (tipo === 'ventas' && desde === today) matchedCommandId = 'ventas-hoy';
  else if (tipo === 'ventas' && periodo === 'semana') matchedCommandId = 'ventas-semana';
  else if (tipo === 'ventas' && periodo === 'mes') matchedCommandId = 'ventas-mes';
  else if (tipo === 'dispensadores') matchedCommandId = 'dispensadores';
  else if (tipo === 'inventario') matchedCommandId = 'inventario-critico';
  else if (tipo === 'compras') matchedCommandId = 'compras-proveedor';
  else if (tipo === 'salidas') matchedCommandId = 'salidas-mermas';
  else if (tipo === 'clientes') matchedCommandId = 'top-clientes';

  return {
    matchedCommandId,
    tipo,
    periodo,
    desde,
    hasta,
    sucursalId,
    sucursalNombre,
    formato,
    preguntaIa: transcript.trim(),
  };
}
