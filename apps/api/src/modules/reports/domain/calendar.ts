import { BadRequestException } from '../../../shared/domain/errors';

export function assertReportDateRange(desde?: string, hasta?: string): void {
  if (desde && hasta && Date.parse(desde) > Date.parse(hasta)) {
    throw new BadRequestException('Rango de fechas inválido: la fecha inicial no puede ser posterior a la final.');
  }
}

export function reportCalendarRange(periodo: string, now = new Date()): { desde: string; hasta: string } {
  // America/La_Paz es UTC-04:00 todo el año
  const local = new Date(now.getTime() - 4 * 3600000);
  let start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
  let end: Date;

  if (periodo === 'semana') {
    start.setUTCDate(start.getUTCDate() - ((start.getUTCDay() + 6) % 7));
    end = new Date(start.getTime() + 7 * 86400000 - 1);
  } else if (periodo === 'mes') {
    start.setUTCDate(1);
    end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1) - 1);
  } else {
    start = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
    end = new Date(Date.UTC(local.getUTCFullYear() + 1, 0, 1) - 1);
  }

  return {
    desde: start.toISOString().split('T')[0],
    hasta: end.toISOString().split('T')[0],
  };
}
