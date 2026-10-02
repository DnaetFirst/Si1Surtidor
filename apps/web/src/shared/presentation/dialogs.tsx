import { LoaderCircle, X } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { ErrorBox } from './feedback';
export function Dialog({ title, children, onClose }: {
    title: string;
    children: ReactNode;
    onClose: () => void;
}) { const ref = useRef<HTMLDialogElement>(null); useEffect(() => { const previous = document.activeElement as HTMLElement; const dialog = ref.current; dialog?.showModal(); return () => { dialog?.close(); previous?.focus(); }; }, []); return <dialog ref={ref} aria-label={title} className="dialog" onCancel={e => { e.preventDefault(); onClose(); }} onClick={e => { if (e.target === ref.current)
    { const bounds = e.currentTarget.getBoundingClientRect(); if (e.clientX < bounds.left || e.clientX > bounds.right || e.clientY < bounds.top || e.clientY > bounds.bottom) onClose(); } }}><div className="dialog-heading"><h2>{title}</h2><button className="icon-button" onClick={onClose} aria-label="Cerrar" type="button"><X size={20}/></button></div>{children}</dialog>; }
export function Confirm({ title, description, action, onClose, onSuccess, label = 'Deshabilitar' }: {
    title: string;
    description: string;
    action: () => Promise<unknown>;
    onClose: () => void;
    onSuccess: () => void;
    label?: string;
}) { const [pending, setPending] = useState(false); const [error, setError] = useState<unknown>(); const submit = async (e: FormEvent) => { e.preventDefault(); setPending(true); setError(null); try {
    await action();
    onSuccess();
    onClose();
}
catch (err) {
    setError(err);
}
finally {
    setPending(false);
} }; return <Dialog title={title} onClose={() => { if (!pending)
    onClose(); }}><form onSubmit={submit}><p className="dialog-description">{description}</p><ErrorBox error={error}/><div className="dialog-actions"><button type="button" className="button" disabled={pending} onClick={onClose}>Cancelar</button><button className="button primary" disabled={pending}>{pending && <LoaderCircle size={16} className="spin"/>}{label}</button></div></form></Dialog>; }
