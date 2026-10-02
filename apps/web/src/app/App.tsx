import { useEffect } from 'react';
import { expire, setUser, store, useAppDispatch, useSession } from '../modules/security/auth/application/session';
import type { SessionUser } from '../modules/security/auth/domain/models';
import { api } from '../shared/infrastructure/http';
import { Loading } from '../shared/presentation/index';
import { AppRoutes } from './routes';
export function App() { const dispatch = useAppDispatch(); const { ready } = useSession(); useEffect(() => { const expired = () => { if (store.getState().session.user)
    dispatch(expire()); }; window.addEventListener('session-expired', expired); api<{
    user: SessionUser;
}>('/auth/me').then(data => dispatch(setUser(data.user))).catch(() => dispatch(setUser(null))); return () => window.removeEventListener('session-expired', expired); }, [dispatch]); if (!ready)
    return <div className="initial-loading"><Loading text="Cargando Mi Gasolinera…"/></div>; return <AppRoutes />; }
