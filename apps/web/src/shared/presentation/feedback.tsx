import { AlertCircle, LoaderCircle, Search } from 'lucide-react';
import { errorText } from '../infrastructure/http';
export function Loading({ text = 'Cargando información…' }: {
    text?: string;
}) { return <div className="loading" role="status"><LoaderCircle size={24} className="spin"/><span>{text}</span></div>; }
export function ErrorBox({ error, retry }: {
    error: unknown;
    retry?: () => void;
}) { if (!error)
    return null; return <div className="alert error" role="alert"><AlertCircle size={18}/><span>{errorText(error)}</span>{retry && <button type="button" className="text-button" onClick={retry}>Reintentar</button>}</div>; }
export function Empty({ title = 'No hay resultados', text = 'Prueba con otros filtros o agrega un nuevo registro.' }: {
    title?: string;
    text?: string;
}) { return <div className="empty"><Search size={32} strokeWidth={1.3}/><h3>{title}</h3><p>{text}</p></div>; }
export function Status({ active }: {
    active: boolean;
}) { return <span className={`badge ${active ? '' : 'muted'}`}>{active ? 'Activo' : 'Inactivo'}</span>; }
