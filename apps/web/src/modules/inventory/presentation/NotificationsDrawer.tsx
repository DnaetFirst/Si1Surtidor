import { AlertTriangle, Bell, Check, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import useSWR from 'swr';
import { PageResult } from '../../../shared/domain/pagination';
import { useInventoryApi } from '../application/repository-context';
import { ProductNotification } from '../domain/models';

export function NotificationsDrawer() {
  const api = useInventoryApi();
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [panelPos, setPanelPos] = useState<{ top: number; left: number; width: number; maxHeight: number } | null>(null);

  const { data: unreadData, mutate: mutateCount } = useSWR<{ noLeidas: number }>(
    '/inventario/notificaciones/conteo-no-leidas',
    () => api.getUnreadCount(),
    { refreshInterval: 15000 }
  );

  const { data: notificationsData, mutate: mutateList } = useSWR<PageResult<ProductNotification>>(
    open ? api.listNotificationsKey() : null
  );

  const updatePosition = () => {
    if (!triggerRef.current) return;
    const anchor = triggerRef.current.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const width = Math.min(380, vw - 24);
    const left = Math.max(12, Math.min(anchor.right - width, vw - width - 12));
    const top = Math.min(anchor.bottom + 8, Math.max(12, vh - 200));
    const maxHeight = Math.max(220, vh - top - 16);
    setPanelPos({ top, left, width, maxHeight });
  };

  useLayoutEffect(() => {
    if (!open) return;
    updatePosition();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (e: PointerEvent) => {
      const target = e.target as Node;
      if (!drawerRef.current?.contains(target) && !triggerRef.current?.contains(target)) {
        setOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus({ preventScroll: true });
      }
    };
    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', updatePosition);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', updatePosition);
    };
  }, [open]);

  const handleMarkAsRead = async (id: number) => {
    try {
      await api.markNotificationAsRead(id);
      await mutateCount();
      await mutateList();
    } catch {
      // ignore
    }
  };

  const handleResolve = async (id: number) => {
    try {
      await api.resolveNotification(id);
      await mutateCount();
      await mutateList();
    } catch {
      // ignore
    }
  };

  const count = unreadData?.noLeidas ?? 0;

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={triggerRef}
        type="button"
        className="icon-button"
        aria-label="Notificaciones"
        aria-expanded={open}
        onClick={() => setOpen(v => !v)}
        style={{ position: 'relative' }}
      >
        <Bell size={21} />
        {count > 0 && (
          <span
            style={{
              position: 'absolute',
              top: '-4px',
              right: '-4px',
              backgroundColor: '#ef4444',
              color: '#ffffff',
              borderRadius: '50%',
              width: '18px',
              height: '18px',
              fontSize: '0.7rem',
              fontWeight: 700,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      {open &&
        createPortal(
          <div
            ref={drawerRef}
            role="dialog"
            aria-label="Notificaciones"
            style={{
              position: 'fixed',
              top: panelPos?.top ?? 56,
              left: panelPos?.left ?? 12,
              width: panelPos?.width ?? 360,
              maxHeight: Math.min(520, panelPos?.maxHeight ?? 520),
              backgroundColor: '#ffffff',
              borderRadius: '16px',
              boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
              zIndex: 1200,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
              visibility: panelPos ? 'visible' : 'hidden',
            }}
          >
          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: '1px solid #f1f5f9',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <h3 style={{ margin: 0, fontSize: '1.2rem', fontWeight: 700, color: '#0f172a' }}>
              Notificaciones
            </h3>
            <button
              className="icon-button"
              onClick={() => setOpen(false)}
              aria-label="Cerrar notificaciones"
            >
              <X size={18} />
            </button>
          </div>

          {/* List */}
          <div style={{ overflowY: 'auto', padding: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {(notificationsData?.items || []).map((n: ProductNotification) => (
              <div
                key={n.id}
                onClick={() => !n.visto && handleMarkAsRead(n.id)}
                style={{
                  padding: '14px',
                  borderRadius: '12px',
                  backgroundColor: n.visto ? '#ffffff' : '#f8fafc',
                  border: n.visto ? '1px solid #e2e8f0' : '1px solid #cbd5e1',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  cursor: 'pointer',
                  transition: 'background-color 0.2s',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <strong style={{ fontSize: '0.92rem', color: '#0f172a' }}>{n.titulo}</strong>
                    {!n.visto && (
                      <span
                        style={{
                          width: '8px',
                          height: '8px',
                          borderRadius: '50%',
                          backgroundColor: '#2563eb',
                          display: 'inline-block',
                        }}
                      />
                    )}
                  </div>
                  <span style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {typeof n.fecha === 'string'
                      ? n.fecha.substring(0, 16).replace('T', ' ')
                      : new Date(n.fecha).toLocaleDateString()}
                  </span>
                </div>

                <p style={{ margin: '0 0 6px 0', fontSize: '0.85rem', color: '#475569' }}>
                  {n.descripcion}
                </p>

                <div style={{ fontSize: '0.82rem', color: '#334155', fontWeight: 500, marginBottom: '10px' }}>
                  Stock Actual: <strong>{n.productoStock ?? 0}</strong> (Mín: {n.productoStockMinimo ?? 0})
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span
                    style={{
                      display: 'inline-block',
                      padding: '2px 10px',
                      borderRadius: '12px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      backgroundColor: '#0f172a',
                      color: '#ffffff',
                    }}
                  >
                    Importante
                  </span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    {!n.resuelta && (
                      <button
                        className="button"
                        style={{ fontSize: '0.75rem', padding: '2px 8px', height: '26px' }}
                        onClick={e => {
                          e.stopPropagation();
                          handleResolve(n.id);
                        }}
                      >
                        <Check size={12} /> Resolver
                      </button>
                    )}
                    <AlertTriangle size={18} color="#ef4444" />
                  </div>
                </div>
              </div>
            ))}

            {(!notificationsData?.items || !notificationsData.items.length) && (
              <div style={{ textAlign: 'center', padding: '36px 12px', color: '#94a3b8' }}>
                <Bell size={28} style={{ margin: '0 auto 8px auto', opacity: 0.5 }} />
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No hay alertas de stock en este momento</p>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

// Alias de componente «UI» para trazabilidad UML (CU18)
export const UINotificacionStock = NotificationsDrawer;
