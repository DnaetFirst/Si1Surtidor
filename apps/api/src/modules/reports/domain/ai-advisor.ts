import { DashboardSummary } from './models';
import { ParsedVoiceIntent } from './voice-intents';

export interface ReportExportDataset {
  title: string;
  subtitle: string;
  headers: string[];
  rows: (string | number | null | undefined)[][];
  totals?: string[];
}

export interface AiReportAnalysisResult {
  estado: 'respondida' | 'sin-datos' | 'fuera-de-alcance' | 'no-disponible';
  resumenEjecutivo: string;
  hallazgos: string[];
  recomendaciones: string[];
  speechText: string;
  provider: 'gemini' | 'local-fallback' | 'local-data';
  model: string;
  notaConfiguracion?: string;
  intent: ParsedVoiceIntent;
}

export abstract class AiReportAdvisor {
  abstract transcribe(data: string, mimeType: string): Promise<string>;
  abstract analyze(context: {
    prompt: string;
    intent: ParsedVoiceIntent;
    summary: DashboardSummary;
    dataset: ReportExportDataset;
  }): Promise<AiReportAnalysisResult>;
}

export abstract class ReportDocumentExporter {
  abstract toExcel(dataset: ReportExportDataset): Promise<Buffer>;
  abstract toPdf(dataset: ReportExportDataset): Promise<Buffer>;
}
