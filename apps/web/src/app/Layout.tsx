import { Building, Building2, ChevronDown, ChevronLeft, ChevronRight, CircleUserRound, Fuel, KeyRound, LogOut, Menu, ScrollText, ShieldCheck, UserRound, UsersRound, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { allowed, firstPath, setNotice, setUser, useAppDispatch, useSession } from '../modules/security/auth/application/session';
import type { SessionUser } from '../modules/security/auth/domain/models';
import { api, send } from '../shared/infrastructure/http';
import { ErrorBox } from '../shared/presentation/index';
export function Layout() {
    const { user, notice } = useSession();
    const dispatch = useAppDispatch();
    const location = useLocation();
    const { mutate } = useSWRConfig();
    const [mobile, setMobile] = useState(false);
    const [collapsed, setCollapsed] = useState(false);
    const [account, setAccount] = useState(false);
    const accountRef = useRef<HTMLDivElement>(null);
    const [error, setError] = useState<unknown>();
    useEffect(() => {
        if (!account) return;
        const outside = (event: PointerEvent) => {
            if (!accountRef.current?.contains(event.target as Node)) setAccount(false);
        };
        const keyboard = (event: KeyboardEvent) => {
            if (event.key === 'Escape') accountRef.current?.querySelector<HTMLButtonElement>('.avatar')?.focus({ preventScroll: true });
        };
        document.addEventListener('pointerdown', outside);
        document.addEventListener('keydown', keyboard);
        return () => { document.removeEventListener('pointerdown', outside); document.removeEventListener('keydown', keyboard); };
    }, [account]);
    useEffect(() => { setMobile(false); setAccount(false); setError(null); api<{
        user: SessionUser;
    }>('/auth/me').then(data => dispatch(setUser(data.user))).catch(() => { }); }, [location.pathname, dispatch]);
    useEffect(() => { if (!notice)
        return; const timer = setTimeout(() => dispatch(setNotice('')), 6000); return () => clearTimeout(timer); }, [notice, dispatch]);
    useEffect(() => { const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') {
        setMobile(false);
        setAccount(false);
    } }; document.addEventListener('keydown', escape); return () => document.removeEventListener('keydown', escape); }, []);
    const can = (module: string) => allowed(user, module);
    const crumbs: {
        label: string;
        href?: string;
    }[] = [{ label: 'Inicio', href: firstPath(user) }];
    if (location.pathname.startsWith('/usuarios')) {
        crumbs.push({ label: 'Usuarios', ...(can('usuarios') ? { href: '/usuarios' } : {}) });
        if (location.pathname.includes('/roles'))
            crumbs.push({ label: 'Roles', href: '/usuarios/roles' });
        else if (location.pathname.includes('/permisos'))
            crumbs.push({ label: 'Permisos', href: '/usuarios/permisos' });
        if (location.pathname.endsWith('/crear'))
            crumbs.push({ label: location.pathname.includes('roles') ? 'Crear rol' : location.pathname.includes('permisos') ? 'Crear permiso' : 'Crear usuario' });
        else if (location.pathname.endsWith('/editar'))
            crumbs.push({ label: 'Editar' });
    }
    else if (location.pathname.startsWith('/empresa')) {
        crumbs.push({ label: 'Empresa', ...(can('empresa') ? { href: '/empresa' } : {}) });
        if (location.pathname.includes('bitacora'))
            crumbs.push({ label: 'Bitácora' });
    }
    const logout = async () => { try {
        await send('/auth/logout', 'POST');
        await mutate(() => true, undefined, { revalidate: false });
        dispatch(setUser(null));
    }
    catch (err) {
        setError(err);
    } };
    return <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobile ? 'mobile-open' : ''}`}>
    <a href="#main-content" className="skip-link">Saltar al contenido</a>
    {mobile && <button className="sidebar-overlay" onClick={() => setMobile(false)} aria-label="Cerrar navegación"/>}
    <aside className="sidebar" aria-label="Navegación principal">
      <div className="brand-row"><Link to={firstPath(user)} className="brand"><Fuel size={25} strokeWidth={1.8}/><span>Mi Gasolinera</span></Link><button className="button icon-button collapse-control" aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'} onClick={() => setCollapsed(!collapsed)}>{collapsed ? <ChevronRight size={17}/> : <ChevronLeft size={17}/>}</button><button className="icon-button mobile-close" aria-label="Cerrar menú" onClick={() => setMobile(false)}><X size={20}/></button></div>
      <nav className="nav-content">
        {(can('usuarios') || can('roles') || can('permisos')) && <div className="nav-group"><div className="nav-item nav-group-heading"><UsersRound size={21}/><span>Gestión de Usuarios</span><ChevronDown size={20}/></div><div className="nav-children">
          {can('usuarios') && <NavLink to="/usuarios" end className={({ isActive }) => `nav-item ${isActive || /^\/usuarios\/[^/]+(?:\/editar)?$/.test(location.pathname) && !location.pathname.includes('roles') && !location.pathname.includes('permisos') ? 'active' : ''}`} title="Usuarios"><UsersRound size={20}/><span>Usuarios</span></NavLink>}
          {can('roles') && <NavLink to="/usuarios/roles" className="nav-item" title="Roles"><UserRound size={20}/><span>Roles</span></NavLink>}
          {can('permisos') && <NavLink to="/usuarios/permisos" className="nav-item" title="Permisos"><KeyRound size={20}/><span>Permisos</span></NavLink>}
        </div></div>}
        {(can('empresa') || can('bitacora')) && <div className="nav-group"><div className="nav-item nav-group-heading"><Building2 size={21}/><span>Administrar Empresa</span><ChevronDown size={20}/></div><div className="nav-children">
          {can('empresa') && <NavLink to="/empresa" end className="nav-item" title="Empresa"><Building size={20}/><span>Empresa</span></NavLink>}
          {can('bitacora') && <NavLink to="/empresa/bitacora" className="nav-item" title="Bitácora"><ScrollText size={20}/><span>Bitácora</span></NavLink>}
        </div></div>}
      </nav>
    </aside>
    <div className="app-body"><header className="topbar"><button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMobile(true)}><Menu size={23}/></button><nav className="breadcrumbs" aria-label="Ruta actual">{crumbs.map((crumb, i) => <span key={i}>{i > 0 && <ChevronRight size={14}/>}{crumb.href && i < crumbs.length - 1 ? <Link to={crumb.href}>{crumb.label}</Link> : <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{crumb.label}</span>}</span>)}</nav><div className="account" ref={accountRef} onBlur={event => { if (!event.currentTarget.contains(event.relatedTarget as Node)) setAccount(false); }}><button className="avatar" aria-label="Mi cuenta" aria-expanded={account} onClick={() => setAccount(!account)}><CircleUserRound size={21}/></button>{account && <div className="account-dropdown"><strong>{user?.nombre}</strong><span>{user?.correo}</span><span className="account-role"><ShieldCheck size={14}/>{user?.rol.nombre}</span><Link className="button" to="/mi-perfil"><UserRound size={16}/>Mi perfil</Link><button onClick={logout}><LogOut size={16}/>Cerrar sesión</button></div>}</div></header>
      <main id="main-content" className="main-content">{notice && <div className="toast" role="status"><span>{notice}</span><button className="icon-button" aria-label="Cerrar notificación" onClick={() => dispatch(setNotice(''))}><X size={17}/></button></div>}<ErrorBox error={error}/><Outlet /></main>
      <footer className="mobile-footer">Mi Gasolinera · Ciclo 1</footer>
    </div>
  </div>;
}
