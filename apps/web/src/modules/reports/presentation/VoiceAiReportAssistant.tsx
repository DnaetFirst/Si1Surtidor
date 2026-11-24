import { FormEvent, useEffect, useRef, useState } from 'react';
import { Mic, MicOff, Sparkles, Square, Volume2, X } from 'lucide-react';
import {
  AiReportConsultPayload,
  AiReportResponse,
  ParsedVoiceIntent,
  PredefinedVoiceCommand,
  ReportTabType,
} from '../domain/models';

interface SpeechRecognitionEventLike {
  resultIndex: number;
  results: {
    length: number;
    [index: number]: {
      isFinal: boolean;
      0: { transcript: string };
    };
  };
}

interface SpeechRecognitionErrorEventLike {
  error: string;
}

interface SpeechRecognitionInstance {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  maxAlternatives: number;
  onresult: ((event: SpeechRecognitionEventLike) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

type SpeechRecognitionConstructor = new () => SpeechRecognitionInstance;

interface Props {
  isOpen: boolean;
  onClose: () => void;
  activeTab: ReportTabType;
  from: string;
  to: string;
  periodo: 'todo' | 'semana' | 'mes' | 'ano';
  branchId?: number;
  voiceCommands: PredefinedVoiceCommand[];
  onConsult: (payload: AiReportConsultPayload) => Promise<AiReportResponse>;
  onApplyIntent: (intent: ParsedVoiceIntent) => void;
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

function getSpeechRecognitionCtor(): SpeechRecognitionConstructor | null {
  if (typeof window === 'undefined') return null;
  const win = window as unknown as {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  };
  return win.SpeechRecognition || win.webkitSpeechRecognition || null;
}

export function VoiceAiReportAssistant({
  isOpen,
  onClose,
  activeTab,
  from,
  to,
  periodo,
  branchId,
  voiceCommands,
  onConsult,
  onApplyIntent,
}: Props) {
  const [prompt, setPrompt] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [listening, setListening] = useState(false);
  const [speakBack, setSpeakBack] = useState(true);
  const [speaking, setSpeaking] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [voiceNote, setVoiceNote] = useState<string | null>(null);
  const [result, setResult] = useState<AiReportResponse | null>(null);

  const recognitionRef = useRef<SpeechRecognitionInstance | null>(null);
  const speechSupported = Boolean(getSpeechRecognitionCtor());
  const ttsSupported = typeof window !== 'undefined' && 'speechSynthesis' in window;
  const commands = voiceCommands.length > 0 ? voiceCommands : FALLBACK_COMMANDS;

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

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

  const executeQuery = async (
    queryText: string,
    opts?: { viaVoz?: boolean; forceCurrentView?: boolean },
  ) => {
    const clean = queryText.trim();
    if (!clean || loading) return;
    setLoading(true);
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
      onApplyIntent(data.intent);
      if (speakBack && (opts?.viaVoz || opts?.forceCurrentView === false)) {
        speakText(data.speechText || data.resumenEjecutivo);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo consultar el asistente IA.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleMic = () => {
    if (listening) {
      recognitionRef.current?.stop();
      setListening(false);
      return;
    }

    const Ctor = getSpeechRecognitionCtor();
    if (!Ctor) {
      setVoiceNote(
        'Tu navegador no soporta dictado directo por micrófono; usa los comandos predefinidos o escribe tu consulta abajo.',
      );
      return;
    }

    setError(null);
    setVoiceNote(null);
    setInterimTranscript('');

    try {
      const recognition = new Ctor();
      recognition.lang = 'es-BO';
      recognition.interimResults = true;
      recognition.continuous = false;
      recognition.maxAlternatives = 1;

      recognition.onresult = event => {
        let finalChunk = '';
        let interimChunk = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const item = event.results[i];
          const text = item[0]?.transcript || '';
          if (item.isFinal) {
            finalChunk += text;
          } else {
            interimChunk += text;
          }
        }
        if (interimChunk) {
          setInterimTranscript(interimChunk);
        }
        if (finalChunk.trim()) {
          const spoken = finalChunk.trim();
          setInterimTranscript('');
          setPrompt(spoken);
          void executeQuery(spoken, { viaVoz: true });
        }
      };

      recognition.onerror = event => {
        setListening(false);
        setInterimTranscript('');
        if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
          setVoiceNote('Permiso de micrófono denegado. Habilita el micrófono o selecciona un comando predefinido.');
        } else if (event.error === 'no-speech') {
          setVoiceNote('No se detectó voz. Intenta hablar más cerca del micrófono o toca un comando predefinido.');
        } else {
          setVoiceNote(`Dictado detenido (${event.error}). Puedes usar cualquier comando predefinido.`);
        }
      };

      recognition.onend = () => {
        setListening(false);
      };

      recognitionRef.current = recognition;
      setListening(true);
      recognition.start();
    } catch {
      setListening(false);
      setVoiceNote('No fue posible iniciar el micrófono en este navegador.');
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
              Dicta un comando, selecciona un reporte predefinido o consulta con Gemini sobre tus ventas y stock.
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
              disabled={loading}
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
                disabled={loading}
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
          onClick={handleToggleMic}
          className={`button ${listening ? 'primary' : ''}`}
          style={{
            background: listening ? '#dc2626' : undefined,
            borderColor: listening ? '#b91c1c' : undefined,
            color: listening ? '#fff' : undefined,
            minWidth: '155px',
          }}
        >
          {listening ? (
            <>
              <Square size={14} /> Escuchando…
            </>
          ) : speechSupported ? (
            <>
              <Mic size={15} /> Dictar por voz
            </>
          ) : (
            <>
              <MicOff size={15} /> Voz no soportada
            </>
          )}
        </button>

        <input
          type="text"
          value={interimTranscript ? `${interimTranscript}…` : prompt}
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
          disabled={loading}
        />

        <button type="submit" className="button primary" disabled={loading || !prompt.trim()}>
          <Sparkles size={15} /> {loading ? 'Analizando…' : 'Consultar con Gemini AI'}
        </button>
      </form>

      {voiceNote && (
        <div style={{ marginTop: '8px', fontSize: '0.84rem', color: '#b45309' }}>
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
                {result.provider === 'gemini' ? `Gemini (${result.model})` : `Motor analítico local (${result.model})`}
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
                  Hallazgos clave
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
