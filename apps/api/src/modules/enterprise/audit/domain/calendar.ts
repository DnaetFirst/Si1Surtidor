import { BadRequestException } from '../../../../shared/domain/errors';
export function assertDateRange(desde?: string, hasta?: string) {
    if (desde && hasta && Date.parse(desde) > Date.parse(hasta)) {
        throw new BadRequestException('La fecha inicial no puede ser posterior a la final.');
    }
}
export function calendarRange(periodo: string, now = new Date()): {
    desde: string;
    hasta: string;
} {
    // America/La_Paz is UTC-04:00 throughout the year.
    const local = new Date(now.getTime() - 4 * 3600000);
    let start = new Date(Date.UTC(local.getUTCFullYear(), local.getUTCMonth(), local.getUTCDate()));
    let end: Date;
    if (periodo === 'semana') {
        start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7);
        end = new Date(start.getTime() + 7 * 86400000);
    }
    else if (periodo === 'mes') {
        start.setUTCDate(1);
        end = new Date(Date.UTC(start.getUTCFullYear(), start.getUTCMonth() + 1, 1));
    }
    else {
        start = new Date(Date.UTC(local.getUTCFullYear(), 0, 1));
        end = new Date(Date.UTC(local.getUTCFullYear() + 1, 0, 1));
    }
    return { desde: new Date(start.getTime() + 4 * 3600000).toISOString(), hasta: new Date(end.getTime() + 4 * 3600000 - 1).toISOString() };
}
