export const formatDate = (value: string | undefined, time = true) => { if (!value)
    return '—'; const date = new Date(value); if (Number.isNaN(date.getTime()))
    return value; return new Intl.DateTimeFormat('es-BO', { timeZone: 'America/La_Paz', year: 'numeric', month: '2-digit', day: '2-digit', ...(time ? { hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' } as const : {}) }).format(date); };
