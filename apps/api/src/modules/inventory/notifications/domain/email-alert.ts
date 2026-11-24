export interface StockAlertEmailContext {
  id: number;
  titulo: string;
  descripcion: string;
  fecha: Date | string;
  productoNombre: string;
  stockActual: number;
  stockMinimo: number;
  sucursalNombre?: string | null;
  portalUrl: string;
}

const NON_ROUTABLE_DOMAINS = new Set([
  'local',
  'localhost',
  'test',
  'invalid',
  'example',
  'example.com',
  'example.org',
  'example.net',
  'migasolinera.local',
  'test.bo',
]);

function escapeHtml(value: string): string {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export function filterDeliverableEmails(
  candidates: (string | null | undefined)[],
  allowPlaceholderDomains = false,
): string[] {
  const seen = new Map<string, string>();
  for (const raw of candidates) {
    if (!raw) continue;
    const email = raw.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) continue;

    const domain = email.split('@')[1].toLowerCase();
    const tld = domain.split('.').pop() || '';
    if (!allowPlaceholderDomains && (NON_ROUTABLE_DOMAINS.has(domain) || NON_ROUTABLE_DOMAINS.has(tld))) {
      continue;
    }

    const key = email.toLowerCase();
    if (!seen.has(key)) {
      seen.set(key, email);
    }
  }
  return [...seen.values()];
}

export function renderStockAlertEmail(ctx: StockAlertEmailContext): {
  subject: string;
  text: string;
  html: string;
} {
  const fechaStr =
    typeof ctx.fecha === 'string'
      ? ctx.fecha.slice(0, 16).replace('T', ' ')
      : new Intl.DateTimeFormat('es-BO', {
          timeZone: 'America/La_Paz',
          dateStyle: 'short',
          timeStyle: 'short',
        }).format(ctx.fecha);

  const branchLabel = ctx.sucursalNombre?.trim() || 'Sucursal asignada';
  const subject = `[Alerta de Stock] ${ctx.titulo}: ${ctx.productoNombre}`;

  const text = [
    `Mi Gasolinera · Biopetrol — Alerta de Inventario (CU18)`,
    ``,
    `${ctx.titulo}: ${ctx.productoNombre}`,
    ctx.descripcion,
    ``,
    `Sucursal: ${branchLabel}`,
    `Stock actual: ${ctx.stockActual}`,
    `Stock mínimo: ${ctx.stockMinimo}`,
    `Fecha: ${fechaStr} (America/La_Paz)`,
    ``,
    `Revisa el detalle y registra reposición en: ${ctx.portalUrl}`,
  ].join('\n');

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 20px;">
  <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 10px; overflow: hidden; border: 1px solid #e2e8f0;">
    <div style="background: #0f172a; color: #ffffff; padding: 20px 24px;">
      <div style="font-size: 18px; font-weight: 700; letter-spacing: -0.3px;">Mi Gasolinera · Biopetrol</div>
      <div style="font-size: 13px; color: #cbd5e1; margin-top: 2px;">Sistema de Alertas e Inventario (CU18)</div>
    </div>
    <div style="padding: 24px;">
      <span style="display: inline-block; background: #fee2e2; color: #b91c1c; font-size: 12px; font-weight: 700; padding: 4px 10px; border-radius: 999px; margin-bottom: 12px;">
        Stock bajo mínimo
      </span>
      <h2 style="font-size: 18px; font-weight: 700; color: #0f172a; margin: 0 0 10px 0;">
        ${escapeHtml(ctx.titulo)}: ${escapeHtml(ctx.productoNombre)}
      </h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 18px 0;">
        ${escapeHtml(ctx.descripcion)}
      </p>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px; font-size: 13px;">
        <tr>
          <td style="padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;">Sucursal</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${escapeHtml(branchLabel)}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;">Stock actual</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #b91c1c; font-weight: 700;">${ctx.stockActual}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;">Stock mínimo</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #0f172a; font-weight: 600;">${ctx.stockMinimo}</td>
        </tr>
        <tr>
          <td style="padding: 8px 10px; background: #f8fafc; border: 1px solid #e2e8f0; color: #64748b;">Fecha</td>
          <td style="padding: 8px 10px; border: 1px solid #e2e8f0; color: #0f172a;">${escapeHtml(fechaStr)}</td>
        </tr>
      </table>
      <div style="margin-bottom: 22px;">
        <a href="${escapeHtml(ctx.portalUrl)}" style="display: inline-block; background: #0f172a; color: #ffffff; font-weight: 600; font-size: 14px; padding: 10px 18px; border-radius: 8px; text-decoration: none;">
          Ver Alertas en el Portal
        </a>
      </div>
      <p style="font-size: 12px; color: #64748b; line-height: 1.5; border-top: 1px solid #e2e8f0; padding-top: 14px; margin: 0;">
        Este es un aviso automático de stock mínimo de Mi Gasolinera. Por favor, no respondas directamente a este correo.
      </p>
    </div>
  </div>
</body>
</html>`;

  return { subject, text, html };
}
