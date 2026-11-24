import { Injectable, ServiceUnavailableException } from '@nestjs/common';
import { AiReportAdvisor, AiReportAnalysisResult, ReportExportDataset } from '../domain/ai-advisor';
import { DashboardSummary } from '../domain/models';
import { ParsedVoiceIntent } from '../domain/voice-intents';

@Injectable()
export class GeminiAiReportAdvisor extends AiReportAdvisor {
  async transcribe(data: string, mimeType: string): Promise<string> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite';
    if (!apiKey) {
      throw new ServiceUnavailableException('El servicio de dictado no está configurado.');
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
        signal: AbortSignal.timeout(15000),
        body: JSON.stringify({
          contents: [{ parts: [
            { text: 'Transcribe literalmente el comando hablado en español. Devuelve solo la transcripción, sin responder al comando. Si no hay voz inteligible, devuelve [SIN_VOZ].' },
            { inlineData: { data, mimeType } },
          ] }],
          generationConfig: { maxOutputTokens: 512, temperature: 0 },
        }),
      });
      if (!response.ok) throw new Error(`Gemini HTTP ${response.status}`);
      const json = await response.json() as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const text = json.candidates?.[0]?.content?.parts
        ?.filter(part => !part.thought).map(part => part.text ?? '').join('').trim() ?? '';
      return text === '[SIN_VOZ]' ? '' : text.slice(0, 500);
    } catch {
      throw new ServiceUnavailableException('No se pudo transcribir la grabación. Intenta de nuevo en unos segundos.');
    }
  }

  private buildFallback(context: {
    prompt: string;
    intent: ParsedVoiceIntent;
    summary: DashboardSummary;
    dataset: ReportExportDataset;
    reason?: string;
  }): AiReportAnalysisResult {
    const { intent, summary, dataset, reason } = context;
    const rowsCount = dataset.rows.length;
    const ventasHoy = Number(summary.ventasHoy || 0);
    const ventasMes = Number(summary.ventasMes || 0);
    const transaccionesHoy = Number(summary.transaccionesHoy || 0);
    const litrosHoy = Number(summary.litrosDespachadosHoy || 0);
    const alertasStock = Number(summary.alertasStockBajo || 0);
    const dispensadoresActivos = Number(summary.dispensadoresActivos || 0);

    const topFuels = (summary.ventasPorCombustible || [])
      .slice(0, 3)
      .map(f => `${f.combustible} (${Number(f.totalLitros || 0).toFixed(1)} L / Bs. ${Number(f.totalBs || 0).toFixed(2)})`)
      .join(', ');

    const hallazgos: string[] = [
      `Se analizaron ${rowsCount} registros en "${dataset.title}" (${dataset.subtitle}).`,
      `Ventas acumuladas de hoy: Bs. ${ventasHoy.toFixed(2)} (${transaccionesHoy} transacciones, ${litrosHoy.toFixed(1)} L).`,
      `Ventas acumuladas del mes: Bs. ${ventasMes.toFixed(2)} con ${dispensadoresActivos} dispensadores activos.`,
    ];

    if (topFuels) {
      hallazgos.push(`Principales combustibles del mes: ${topFuels}.`);
    }

    const recomendaciones: string[] = [];
    if (alertasStock > 0) {
      recomendaciones.push(
        `Existen ${alertasStock} producto(s) con stock igual o inferior al mínimo; priorizar órdenes de compra aprobadas.`
      );
    } else {
      recomendaciones.push('Los niveles de stock actuales superan el mínimo configurado en todas las categorías.');
    }

    if (intent.formato) {
      recomendaciones.push(`Formato detectado por voz/texto: listo para exportar en ${intent.formato.toUpperCase()}.`);
    } else {
      recomendaciones.push('Puedes exportar este informe en CSV, Excel (.xlsx) o PDF (.pdf) desde la barra superior.');
    }

    const resumenEjecutivo =
      `${dataset.title}: ${rowsCount} filas obtenidas. Hoy se registran Bs. ${ventasHoy.toFixed(2)} ` +
      `en ${transaccionesHoy} ventas (${litrosHoy.toFixed(1)} litros despachados) ` +
      `y ${alertasStock} alertas activas de stock crítico.`;

    const speechText =
      `${dataset.title.replace(/^Reporte de\s+/i, 'Reporte de ')}. Se encontraron ${rowsCount} registros. ` +
      `Las ventas de hoy suman ${ventasHoy.toFixed(2)} bolivianos en ${transaccionesHoy} transacciones. ` +
      (alertasStock > 0
        ? `Atención: hay ${alertasStock} productos con stock bajo mínimo.`
        : `No hay alertas críticas de inventario.`);

    return {
      resumenEjecutivo,
      hallazgos,
      recomendaciones,
      speechText,
      provider: 'local-fallback',
      model: reason || 'local-deterministic',
      notaConfiguracion: reason
        ? `Motor local activo (${reason}). Configura GEMINI_API_KEY en el servidor para respuestas generativas con Gemini.`
        : 'Configura GEMINI_API_KEY en .env y Render para activar análisis generativo en vivo con Gemini API.',
      intent,
    };
  }

  async analyze(context: {
    prompt: string;
    intent: ParsedVoiceIntent;
    summary: DashboardSummary;
    dataset: ReportExportDataset;
  }): Promise<AiReportAnalysisResult> {
    const apiKey = process.env.GEMINI_API_KEY?.trim();
    const model = process.env.GEMINI_MODEL?.trim() || 'gemini-3.1-flash-lite';

    if (!apiKey) {
      return this.buildFallback(context);
    }

    const sampleRows = context.dataset.rows.slice(0, 25);
    const systemPayload = {
      consultaUsuario: context.prompt,
      intencionDetectada: context.intent,
      resumenOperativo: {
        ventasHoyBs: context.summary.ventasHoy,
        ventasMesBs: context.summary.ventasMes,
        transaccionesHoy: context.summary.transaccionesHoy,
        litrosDespachadosHoy: context.summary.litrosDespachadosHoy,
        alertasStockBajo: context.summary.alertasStockBajo,
        dispensadoresActivos: context.summary.dispensadoresActivos,
        ventasPorCombustible: context.summary.ventasPorCombustible,
      },
      reporteActual: {
        titulo: context.dataset.title,
        subtitulo: context.dataset.subtitle,
        totalFilas: context.dataset.rows.length,
        columnas: context.dataset.headers,
        muestraFilas: sampleRows,
        totales: context.dataset.totals || [],
      },
    };

    const instruction = [
      'Eres el analista IA de una estación de servicio / surtidor en Bolivia (moneda Bs, control ANH B-SISA).',
      'Responde ÚNICAMENTE usando los datos reales proporcionados en el JSON; no inventes cifras.',
      'Devuelve JSON estricto con exactamente estas 4 claves:',
      '- "resumenEjecutivo": párrafo claro y breve (2-3 oraciones) en español.',
      '- "hallazgos": arreglo de 3 a 4 hallazgos concretos con montos o cantidades.',
      '- "recomendaciones": arreglo de 2 a 3 acciones recomendadas para gerencia o sucursal.',
      '- "speechText": texto natural breve (máximo 45 palabras) listo para leerse en voz alta al usuario.',
      'Datos JSON:',
      JSON.stringify(systemPayload),
    ].join('\n');

    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`;
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-goog-api-key': apiKey,
        },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: instruction }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        return this.buildFallback({ ...context, reason: `Gemini HTTP ${response.status}` });
      }

      const json = (await response.json()) as {
        candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[];
      };
      const parts = json.candidates?.[0]?.content?.parts || [];
      const rawText = parts
        .filter(p => !p.thought && typeof p.text === 'string')
        .map(p => p.text)
        .join('')
        .replace(/^```json\s*/i, '')
        .replace(/```$/i, '')
        .trim();
      if (!rawText) {
        return this.buildFallback({ ...context, reason: 'Respuesta vacía de Gemini' });
      }

      const parsed = JSON.parse(rawText) as {
        resumenEjecutivo?: string;
        hallazgos?: string[];
        recomendaciones?: string[];
        speechText?: string;
      };

      if (!parsed.resumenEjecutivo) {
        return this.buildFallback({ ...context, reason: 'JSON incompleto de Gemini' });
      }

      return {
        resumenEjecutivo: parsed.resumenEjecutivo,
        hallazgos: Array.isArray(parsed.hallazgos) ? parsed.hallazgos.slice(0, 5) : [],
        recomendaciones: Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones.slice(0, 4) : [],
        speechText: parsed.speechText || parsed.resumenEjecutivo,
        provider: 'gemini',
        model,
        intent: context.intent,
      };
    } catch {
      return this.buildFallback({ ...context, reason: 'Sin conexión a Gemini API' });
    }
  }
}
