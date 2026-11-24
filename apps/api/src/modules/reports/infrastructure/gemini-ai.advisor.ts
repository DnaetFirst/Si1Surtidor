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

  private buildFallback(intent: ParsedVoiceIntent, reason: string): AiReportAnalysisResult {
    const message = 'Gemini no pudo responder en este momento. Intenta de nuevo o consulta los datos en la sección de Reportes.';
    return {
      estado: 'no-disponible',
      resumenEjecutivo: message,
      hallazgos: [],
      recomendaciones: [],
      speechText: message,
      provider: 'local-fallback',
      model: 'no-disponible',
      notaConfiguracion: reason,
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
      return this.buildFallback(context.intent, 'El análisis con Gemini no está configurado.');
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
      'Responde primero y directamente a la pregunta usando el JSON como única fuente de datos del negocio.',
      'Si la pregunta no trata de los reportes ni de la operación del surtidor, devuelve estado "fuera-de-alcance".',
      'Si el JSON no permite contestar, devuelve estado "sin-datos" y explica qué dato falta. Una muestra de filas no garantiza un listado completo.',
      'Si puedes contestar, devuelve estado "respondida". Si se piden nombres o valores por fila, inclúyelos en hallazgos.',
      'Nunca sustituyas la pregunta con un resumen de indicadores que no se pidieron.',
      'Devuelve JSON estricto con estado, resumenEjecutivo (respuesta en español), hallazgos (lista de textos), recomendaciones (lista de textos) y speechText (respuesta breve para narrar).',
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
          systemInstruction: { parts: [{ text: instruction }] },
          contents: [{ role: 'user', parts: [{ text: JSON.stringify(systemPayload) }] }],
          generationConfig: {
            temperature: 0.2,
            responseMimeType: 'application/json',
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (!response.ok) {
        return this.buildFallback(context.intent, `Gemini HTTP ${response.status}`);
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
        return this.buildFallback(context.intent, 'Respuesta vacía de Gemini');
      }

      const parsed = JSON.parse(rawText) as {
        estado?: AiReportAnalysisResult['estado'];
        resumenEjecutivo?: string;
        hallazgos?: string[];
        recomendaciones?: string[];
        speechText?: string;
      };

      if (typeof parsed.resumenEjecutivo !== 'string' || !parsed.resumenEjecutivo.trim()
        || !parsed.estado || !['respondida', 'sin-datos', 'fuera-de-alcance'].includes(parsed.estado)) {
        return this.buildFallback(context.intent, 'JSON incompleto de Gemini');
      }

      const answer = parsed.estado === 'fuera-de-alcance'
        ? 'Este asistente responde sobre reportes y datos del surtidor.'
        : parsed.resumenEjecutivo;
      return {
        estado: parsed.estado,
        resumenEjecutivo: answer,
        hallazgos: parsed.estado === 'respondida' && Array.isArray(parsed.hallazgos) ? parsed.hallazgos.filter(item => typeof item === 'string').slice(0, 25) : [],
        recomendaciones: parsed.estado === 'respondida' && Array.isArray(parsed.recomendaciones) ? parsed.recomendaciones.filter(item => typeof item === 'string').slice(0, 4) : [],
        speechText: parsed.estado === 'respondida' && typeof parsed.speechText === 'string' ? parsed.speechText : answer,
        provider: 'gemini',
        model,
        intent: context.intent,
      };
    } catch {
      return this.buildFallback(context.intent, 'Gemini no entregó una respuesta válida a tiempo.');
    }
  }
}
