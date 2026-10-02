import { ChevronLeft, ChevronRight, MoreHorizontal } from 'lucide-react';
import { useEffect, useId, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
export function Pagination({ page, total, pageSize, onChange }: {
    page: number;
    total: number;
    pageSize: number;
    onChange: (page: number) => void;
}) { const pages = Math.max(1, Math.ceil(total / pageSize)); return <div className="pagination"><span>{total ? `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} de ${total} registros` : '0 registros'}</span><div className="actions"><button className="button" disabled={page <= 1} onClick={() => onChange(page - 1)}><ChevronLeft size={14}/><span>Anterior</span></button><span className="page-number">{page} / {pages}</span><button className="button" disabled={page >= pages} onClick={() => onChange(page + 1)}><span>Siguiente</span><ChevronRight size={14}/></button></div></div>; }
export function RowMenu({ children, label }: {
    children: ReactNode;
    label: string;
}) {
    const trigger = useRef<HTMLButtonElement>(null);
    const panel = useRef<HTMLDivElement>(null);
    const openedAt = useRef<DOMRect | null>(null);
    const id = useId();
    const [open, setOpen] = useState(false);
    const [position, setPosition] = useState<{ top: number; left: number; maxHeight: number } | null>(null);

    useLayoutEffect(() => {
        if (!open || !trigger.current || !panel.current) return;
        const anchor = trigger.current.getBoundingClientRect();
        openedAt.current = anchor;
        const viewport = window.visualViewport;
        const leftEdge = (viewport?.offsetLeft ?? 0) + 16;
        const topEdge = (viewport?.offsetTop ?? 0) + 16;
        const rightEdge = (viewport?.offsetLeft ?? 0) + (viewport?.width ?? window.innerWidth) - 16;
        const bottomEdge = (viewport?.offsetTop ?? 0) + (viewport?.height ?? window.innerHeight) - 16;
        const bounds = panel.current.getBoundingClientRect();
        const below = Math.max(0, bottomEdge - anchor.bottom - 8);
        const above = Math.max(0, anchor.top - topEdge - 8);
        const placeBelow = bounds.height <= below || below >= above;
        const maxHeight = placeBelow ? below : above;
        const height = Math.min(bounds.height, maxHeight);
        setPosition({
            top: Math.max(topEdge, placeBelow ? anchor.bottom + 8 : anchor.top - height - 8),
            left: Math.max(leftEdge, Math.min(anchor.right - bounds.width, rightEdge - bounds.width)),
            maxHeight,
        });
    }, [open]);

    useEffect(() => {
        if (open && position) panel.current?.querySelector<HTMLElement>('a,button:not(:disabled)')?.focus({ preventScroll: true });
    }, [open, position]);

    useEffect(() => {
        if (!open) return;
        const close = (event: PointerEvent) => {
            if (!trigger.current?.contains(event.target as Node) && !panel.current?.contains(event.target as Node)) setOpen(false);
        };
        const escape = (event: KeyboardEvent) => {
            if (event.key === 'Escape') {
                setOpen(false);
                trigger.current?.focus({ preventScroll: true });
            }
        };
        const dismiss = () => setOpen(false);
        const scroll = (event: Event) => {
            // Scrolling inside an unusually tall menu must remain possible.
            if (event.target instanceof Node && panel.current?.contains(event.target)) return;
            const anchor = trigger.current?.getBoundingClientRect();
            const original = openedAt.current;
            // The click may follow a scroll whose event is delivered after opening.
            // Close only if the anchor actually moved since it was measured.
            if (!anchor || !original || Math.abs(anchor.top - original.top) > 0.5 || Math.abs(anchor.left - original.left) > 0.5) dismiss();
        };
        document.addEventListener('pointerdown', close);
        document.addEventListener('keydown', escape);
        window.addEventListener('scroll', scroll, true);
        window.addEventListener('resize', dismiss);
        window.visualViewport?.addEventListener('resize', dismiss);
        window.visualViewport?.addEventListener('scroll', dismiss);
        return () => {
            document.removeEventListener('pointerdown', close);
            document.removeEventListener('keydown', escape);
            window.removeEventListener('scroll', scroll, true);
            window.removeEventListener('resize', dismiss);
            window.visualViewport?.removeEventListener('resize', dismiss);
            window.visualViewport?.removeEventListener('scroll', dismiss);
        };
    }, [open]);

    return <>
        <button type="button" ref={trigger} className="icon-button" aria-label={`Acciones de ${label}`} aria-expanded={open} aria-controls={open ? id : undefined}
            onClick={() => { setPosition(null); setOpen(value => !value); }}><MoreHorizontal size={20}/></button>
        {open && createPortal(<div ref={panel} id={id} role="group" aria-label={`Acciones de ${label}`} className="row-dropdown"
            style={{ top: position?.top ?? 0, left: position?.left ?? 0, maxHeight: position?.maxHeight, visibility: position ? 'visible' : 'hidden' }}
            onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node) && event.relatedTarget !== trigger.current) setOpen(false); }}
            onKeyDown={event => {
                if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;
                const items = Array.from(panel.current?.querySelectorAll<HTMLElement>('a,button:not(:disabled)') ?? []);
                if (!items.length) return;
                event.preventDefault();
                const current = items.indexOf(document.activeElement as HTMLElement);
                const next = event.key === 'Home' ? 0 : event.key === 'End' ? items.length - 1 : (current + (event.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length;
                items[next].focus({ preventScroll: true });
            }}
            onClick={event => {
                if ((event.target as HTMLElement).closest('a,button')) {
                    trigger.current?.focus({ preventScroll: true });
                    setOpen(false);
                }
            }}>{children}</div>, document.body)}
    </>;
}
