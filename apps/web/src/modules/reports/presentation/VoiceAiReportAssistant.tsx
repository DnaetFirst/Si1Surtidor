import { FormEvent, useEffect, useRef, useState } from 'react';
import { Download, Mic, MicOff, Sparkles, Square, Volume2, X } from 'lucide-react';
import {
  AiReportConsultPayload,
  AiReportResponse,
  ParsedVoiceIntent,
  PredefinedVoiceCommand,
  ReportExportFormat,
  ReportTabType,
} from '../domain/models';

interface VoiceCapture {
  recorder?: MediaRecorder;
  timer?: number;
}

const AUDIO_FORMATS = ['audio/webm;codecs=opus', 'audio/ogg;codecs=opus', 'audio/mp4'];
const MAX_RECORDING_MS = 10000;

function readAudio(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(',')[1]);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(blob);
  });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ReportTabType;
  from: string;
  to: string;
  periodo: 'todo' | 'semana' | 'mes' | 'ano';
  branchId?: number;
  voiceCommands: PredefinedVoiceCommand[];
  onTranscribe: (data: string, mimeType: string) => Promise<{ transcript: string }>;
  onConsult: (payload: AiReportConsultPayload) => Promise<AiReportResponse>;
  onApplyIntent: (intent: ParsedVoiceIntent) => void;
  onDownload: (format: ReportExportFormat, intent: ParsedVoiceIntent) => Promise<void>;
}

const FALLBACK_COMMANDS: PredefinedVoiceCommand[] = [
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

export function VoiceAiReportAssistant({
  isOpen,
  onClose,
  activeTab,
  from,
  to,
  periodo,
  branchId,
  voiceCommands,
  onTranscribe,
  onConsult,
  onApplyIntent,
  onDownload,
}: Props) {
  const [prompt, setPrompt] = useState('');
  const [voicePhase, setVoicePhase] = useState<'idle' | 'requesting' | 'listening' | 'transcribing'>('idle');
  const listening = voicePhase === 'listening';
  const [speakBack, setSpeakBack] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [downloadPending, setDownloadPending] = useState(false);
  const [downloadError, setDownloadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [result, setResult] = useState<AiReportResponse | null>(null);

  const captureRef = useRef<VoiceCapture>();
  const recordingFormat = typeof MediaRecorder === 'undefined' ? undefined
    : AUDIO_FORMATS.find(type => MediaRecorder.isTypeSupported(type));
  const speechSupported = Boolean(recordingFormat && navigator.mediaDevices?.getUserMedia);
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const commands = voiceCommands.length > 0 ? voiceCommands : FALLBACK_COMMANDS;

  useEffect(() => {
    if (!isOpen) {
      setVoicePhase('idle');
      setVoiceNote(null);
      return;
    }
    return () => {
      const capture = captureRef.current;
      captureRef.current = undefined;
      window.clearTimeout(capture?.timer);
      const recorder = capture?.recorder;
      if (recorder?.state === 'recording') recorder.stop();
      recorder?.stream.getTracks().forEach(track => track.stop());
      if (ttsSupported) window.speechSynthesis.cancel();
    };
  }, [isOpen, ttsSupported]);

  const speakText = (text: string) => {
    if (!ttsSupported || !text.trim()) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'es-BO';
    utterance.rate = 1.02;
    utterance.onstart = () => setSpeaking(true);
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if (!ttsSupported) return;
    window.speechSynthesis.cancel();
    setSpeaking(false);
  };

  const downloadReport = async (format: ReportExportFormat, intent: ParsedVoiceIntent) => {
    setDownloadPending(true);
    setDownloadError(null);
    try {
      await onDownload(format, intent);
    } catch (err) {
      setDownloadError(err instanceof Error ? err.message : 'No se pudo descargar el reporte.');
    } finally {
      setDownloadPending(false);
    }
  };

  const executeQuery = async (
    queryText: string,
    opts?: { viaVoz?: boolean; forceCurrentView?: boolean },
  ) => {
    const clean = queryText.trim();
    if (!clean || loading) return;
    setLoading(true);
    setDownloadError(null);
    setError(null);
    setVoiceNote(null);

    try {
      const payload: AiReportConsultPayload = opts?.forceCurrentView
        ? {
            prompt: clean,
            tipo: activeTab,
            desde: from || undefined,
            hasta: to || undefined,
            periodo,
            sucursalId: branchId,
            viaVoz: Boolean(opts?.viaVoz),
          }
        : {
            prompt: clean,
            sucursalId: branchId,
            viaVoz: Boolean(opts?.viaVoz),
          };

      const data = await onConsult(payload);
      setResult(data);
      if (data.estado === 'respondida') {
        onApplyIntent(data.intent);
        if (data.intent.formato) void downloadReport(data.intent.formato, data.intent);
      }
      if (speakBack && (opts?.viaVoz || opts?.forceCurrentView === false)) {
        speakText(data.speechText || data.resumenEjecutivo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el asistente IA.');
    } finally {
      setLoading(false);
    }
  };

  const stopRecording = () => {
    const capture = captureRef.current;
    if (!capture) return;
    if (!capture.recorder) {
      captureRef.current = undefined;
      setVoicePhase('idle');
      setVoiceNote('Cuando el navegador habilite el micrófono, vuelve a mantener presionado para hablar.');
      return;
    }
    if (capture.recorder.state === 'recording') {
      window.clearTimeout(capture.timer);
      setVoicePhase('transcribing');
      capture.recorder.stop();
    }
  };

  const startRecording = async () => {
    if (!recordingFormat || !speechSupported || loading || captureRef.current) return;
    const capture: VoiceCapture = {};
    captureRef.current = capture;
    setError(null);
    setVoiceNote(null);
    setVoicePhase('requesting');
    if (ttsSupported) stopSpeaking();

    let stream: MediaStream | undefined;
    try {
      stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      if (captureRef.current !== capture) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }

      const recorder = new MediaRecorder(stream, { mimeType: recordingFormat, audioBitsPerSecond: 32000 });
      capture.recorder = recorder;
      const chunks: Blob[] = [];
      recorder.ondataavailable = event => chunks.push(event.data);
      recorder.onerror = () => {
        window.clearTimeout(capture.timer);
        recorder.stream.getTracks().forEach(track => track.stop());
        if (captureRef.current !== capture) return;
        captureRef.current = undefined;
        setVoicePhase('idle');
        setVoiceNote('Se interrumpió la grabación. Vuelve a mantener presionado el micrófono.');
      };
      recorder.onstop = async () => {
        window.clearTimeout(capture.timer);
        recorder.stream.getTracks().forEach(track => track.stop());
        if (captureRef.current !== capture) return;
        setVoicePhase('transcribing');
        try {
          const container = recorder.mimeType.split(';')[0];
          const mimeType = container === 'audio/mp4' ? 'audio/m4a' : container;
          const blob = new Blob(chunks, { type: mimeType });
          if (blob.size < 512) {
            setVoiceNote('Mantén presionado el micrófono mientras hablas.');
            return;
          }
          if (blob.size > 72000) {
            setVoiceNote('La grabación es demasiado grande. Intenta con una frase más corta.');
            return;
          }
          const data = await readAudio(blob);
          if (captureRef.current !== capture) return;
          const { transcript } = await onTranscribe(data, mimeType);
          if (captureRef.current !== capture) return;
          if (!transcript.trim()) {
            setVoiceNote('No se detectó voz en la grabación. Intenta de nuevo.');
            return;
          }
          setPrompt(transcript);
          void executeQuery(transcript, { viaVoz: true });
        } catch (err) {
          if (captureRef.current === capture) {
            setVoiceNote(err instanceof Error ? err.message : 'No se pudo transcribir la grabación.');
          }
        } finally {
          if (captureRef.current === capture) {
            captureRef.current = undefined;
            setVoicePhase('idle');
          }
        }
      };
      recorder.start();
      setVoicePhase('listening');
      capture.timer = window.setTimeout(stopRecording, MAX_RECORDING_MS);
    } catch (err) {
      stream?.getTracks().forEach(track => track.stop());
      if (captureRef.current !== capture) return;
      captureRef.current = undefined;
      setVoicePhase('idle');
      setVoiceNote(err instanceof DOMException && err.name === 'NotAllowedError'
        ? 'Permite el acceso al micrófono en tu navegador y vuelve a intentarlo.'
        : 'No se pudo abrir el micrófono. Comprueba que esté conectado.');
    }
  };

  const handlePresetClick = (cmd: PredefinedVoiceCommand) => {
    setPrompt(cmd.fraseEjemplo);
    void executeQuery(cmd.fraseEjemplo, { viaVoz: true, forceCurrentView: false });
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void executeQuery(prompt, { viaVoz: false });
  };

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Asistente IA y Reportes por Voz"
      onClick={e => {
        if (e.target === e.currentTarget) onClose();
      }}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.45)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        zIndex: 1400,
      }}
    >
      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid var(--border)',
          padding: '22px 24px',
          maxWidth: '760px',
          width: '100%',
          maxHeight: '90dvh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            gap: '12px',
            flexWrap: 'wrap',
            marginBottom: '14px',
          }}
        >
          <div>
            <h3 style={{ margin: 0, fontSize: '1.08rem' }}>
              Asistente IA (Gemini) y Reportes por Voz
            </h3>
            <p style={{ margin: '4px 0 0 0', fontSize: '0.84rem', color: 'var(--muted)' }}>
              Mantén presionado el micrófono para grabar. Al soltarlo, Gemini transcribe el audio.
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
            {ttsSupported && (
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '0.84rem',
                  color: 'var(--muted)',
                  cursor: 'pointer',
                }}
              >
                <input
                  type="checkbox"
                  checked={speakBack}
                  onChange={e => setSpeakBack(e.target.checked)}
                />
                Narrar resumen
              </label>
            )}
            <button
              type="button"
              className="button"
              disabled={loading || voicePhase !== 'idle'}
              onClick={() =>
                void executeQuery(
                  `Analiza detalladamente la pestaña actual (${activeTab}) con los filtros seleccionados.`,
                  { viaVoz: false, forceCurrentView: true },
                )
              }
            >
              <Sparkles size={15} /> Analizar vista actual
            </button>
            <button
              type="button"
              className="icon-button"
              aria-label="Cerrar asistente"
              onClick={onClose}
            >
              <X size={18} />
            </button>
          </div>
        </div>

      {/* Comandos de voz predefinidos */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--muted)', marginBottom: '6px' }}>
          REPORTES PREDEFINIDOS POR VOZ (clic para ejecutar y abrir):
        </div>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {commands.map(cmd => {
            const active = result?.intent?.matchedCommandId === cmd.id;
            return (
              <button
                key={cmd.id}
                type="button"
                title={cmd.descripcion}
                disabled={loading || voicePhase !== 'idle'}
                onClick={() => handlePresetClick(cmd)}
                className={`button ${active ? 'selected' : ''}`}
                style={{
                  minHeight: '32px',
                  fontSize: '0.82rem',
                  padding: '4px 12px',
                  borderRadius: '999px',
                }}
              >
                <Mic size={13} /> {cmd.etiqueta}
              </button>
            );
          })}
        </div>
      </div>

      {/* Barra de micrófono + prompt Gemini */}
      <form
        onSubmit={handleSubmit}
        style={{
          display: 'flex',
          gap: '8px',
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <button
          type="button"
          disabled={!speechSupported || loading || voicePhase === 'transcribing'}
          aria-pressed={listening}
          onPointerDown={event => {
            if (!event.isPrimary || event.button !== 0) return;
            event.currentTarget.setPointerCapture(event.pointerId);
            void startRecording();
          }}
          onPointerUp={stopRecording}
          onContextMenu={event => event.preventDefault()}
          onPointerCancel={stopRecording}
          onLostPointerCapture={stopRecording}
          onClick={event => {
            if (event.detail !== 0) return;
            if (captureRef.current) stopRecording();
            else void startRecording();
          }}
          className={`button ${listening ? 'primary' : ''}`}
          style={{
            background: listening ? '#dc2626' : undefined,
            borderColor: listening ? '#b91c1c' : undefined,
            color: listening ? '#fff' : undefined,
            minWidth: '155px',
            touchAction: 'none',
            userSelect: 'none',
          }}
        >
          {listening ? (
            <>
              <Square size={14} /> Escuchando…
            </>
          ) : voicePhase === 'requesting' ? (
            'Abriendo micrófono…'
          ) : voicePhase === 'transcribing' ? (
            'Transcribiendo…'
          ) : speechSupported ? (
            <>
              <Mic size={15} /> Mantén para hablar
            </>
          ) : (
            <>
              <MicOff size={15} /> Voz no soportada
            </>
          )}
        </button>

        <input
          type="text"
          value={prompt}
          onChange={e => setPrompt(e.target.value)}
          placeholder='Ej: "Muéstrame las ventas de hoy en PDF" o "¿Qué combustible se vendió más?"'
          style={{
            flex: '1 1 280px',
            minWidth: '220px',
            minHeight: '40px',
            padding: '8px 12px',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            background: '#fff',
          }}
          disabled={loading || voicePhase !== 'idle'}
        />

        <button type="submit" className="button primary" disabled={loading || voicePhase !== 'idle' || !prompt.trim()}>
          <Sparkles size={15} /> {loading ? 'Analizando…' : 'Consultar con Gemini AI'}
        </button>
      </form>

      {voiceNote && (
        <div role="status" style={{ marginTop: '8px', fontSize: '0.84rem', color: '#b45309' }}>
          {voiceNote}
        </div>
      )}

      {error && (
        <div style={{ marginTop: '8px', fontSize: '0.86rem', color: '#dc2626' }}>
          {error}
        </div>
      )}

      {result && (
        <div
          style={{
            marginTop: '14px',
            padding: '14px 16px',
            borderRadius: '12px',
            background: 'var(--surface, #ffffff)',
            border: '1px solid var(--border)',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
              marginBottom: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  padding: '3px 9px',
                  borderRadius: '999px',
                  background: result.provider === 'gemini' ? '#dbeafe' : '#f1f5f9',
                  color: result.provider === 'gemini' ? '#1d4ed8' : '#334155',
                }}
              >
                {result.provider === 'gemini' ? `Gemini (${result.model})` : result.provider === 'local-data' ? 'Datos del sistema' : 'Gemini no disponible'}
              </span>
              <span style={{ fontSize: '0.82rem', color: 'var(--muted)' }}>
                {result.datasetTitle} · {result.datasetSubtitle}
              </span>
            </div>

            {ttsSupported && (
              <button
                type="button"
                className="button"
                style={{ minHeight: '32px', fontSize: '0.8rem', padding: '4px 10px' }}
                onClick={() => (speaking ? stopSpeaking() : speakText(result.speechText || result.resumenEjecutivo))}
              >
                {speaking ? (
                  <>
                    <Square size={13} /> Detener lectura
                  </>
                ) : (
                  <>
                    <Volume2 size={14} /> Escuchar resumen
                  </>
                )}
              </button>
            )}
          </div>

          <p style={{ margin: '0 0 10px 0', lineHeight: 1.5 }}>{result.resumenEjecutivo}</p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: '12px',
            }}
          >
            {result.hallazgos.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  {result.intent.tipo === 'sucursales' ? 'Datos de sucursales' : 'Hallazgos clave'}
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  {result.hallazgos.map((h, i) => (
                    <li key={i}>{h}</li>
                  ))}
                </ul>
              </div>
            )}

            {result.recomendaciones.length > 0 && (
              <div>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, marginBottom: '4px' }}>
                  Recomendaciones
                </div>
                <ul style={{ margin: 0, paddingLeft: '18px', fontSize: '0.88rem', lineHeight: 1.45 }}>
                  {result.recomendaciones.map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {result.estado === 'respondida' && <div role="group" aria-label="Descargar reporte" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
            {(['csv', 'excel', 'pdf'] as const).map(format => (
              <button
                key={format}
                className="button"
                type="button"
                disabled={loading || downloadPending}
                onClick={() => void downloadReport(format, result.intent)}
              >
                <Download size={14}/> Descargar {format === 'excel' ? 'Excel' : format.toUpperCase()}
              </button>
            ))}
          </div>}
          {downloadError && <p role="alert">{downloadError}</p>}

          {result.notaConfiguracion && (
            <div style={{ marginTop: '10px', fontSize: '0.78rem', color: 'var(--muted)' }}>
              {result.notaConfiguracion}
            </div>
          )}
        </div>
      )}
      </div>
    </div>
  );
}
