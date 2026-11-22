import {
  ArrowDownToLine,
  BarChart3,
  Boxes,
  Building,
  Building2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CircleUserRound,
  FileSpreadsheet,
  FolderTree,
  Fuel,
  Gauge,
  KeyRound,
  LogOut,
  Menu,
  Package,
  ScrollText,
  ShieldCheck,
  ShoppingCart,
  Tags,
  Truck,
  UserRound,
  UsersRound,
  X,
} from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { NotificationsDrawer } from '../modules/inventory/presentation/NotificationsDrawer';
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
    return () => {
      document.removeEventListener('pointerdown', outside);
      document.removeEventListener('keydown', keyboard);
    };
  }, [account]);

  useEffect(() => {
    setMobile(false);
    setAccount(false);
    setError(null);
    api<{ user: SessionUser }>('/auth/me').then(data => dispatch(setUser(data.user))).catch(() => {});
  }, [location.pathname, dispatch]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => dispatch(setNotice('')), 6000);
    return () => clearTimeout(timer);
  }, [notice, dispatch]);

  useEffect(() => {
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setMobile(false);
        setAccount(false);
      }
    };
    document.addEventListener('keydown', escape);
    return () => document.removeEventListener('keydown', escape);
  }, []);

  const can = (module: string) => allowed(user, module);

  const crumbs: { label: string; href?: string }[] = [{ label: 'Inicio', href: firstPath(user) }];

  if (location.pathname.startsWith('/usuarios')) {
    crumbs.push({ label: 'Usuarios', ...(can('usuarios') ? { href: '/usuarios' } : {}) });
    if (location.pathname.includes('/roles')) {
      crumbs.push({ label: 'Roles', href: '/usuarios/roles' });
    } else if (location.pathname.includes('/permisos')) {
      crumbs.push({ label: 'Permisos', href: '/usuarios/permisos' });
    } else if (location.pathname.includes('/modulos')) {
      crumbs.push({ label: 'Módulos', href: '/usuarios/modulos' });
    }
    if (location.pathname.endsWith('/crear')) {
      crumbs.push({
        label: location.pathname.includes('roles')
          ? 'Crear rol'
          : location.pathname.includes('permisos')
          ? 'Crear permiso'
          : location.pathname.includes('modulos')
          ? 'Crear módulo'
          : 'Crear usuario',
      });
    } else if (location.pathname.endsWith('/editar')) {
      crumbs.push({ label: 'Editar' });
    }
  } else if (location.pathname.startsWith('/empresa')) {
    crumbs.push({ label: 'Empresa', ...(can('empresa') ? { href: '/empresa' } : {}) });
    if (location.pathname.includes('bitacora')) {
      crumbs.push({ label: 'Bitácora' });
    }
    if (location.pathname.includes('sucursales')) {
      crumbs.push({ label: 'Sucursales', href: '/empresa/sucursales' });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear sucursal' });
      else if (location.pathname.endsWith('/editar')) crumbs.push({ label: 'Editar sucursal' });
    }
  } else if (location.pathname.startsWith('/productos')) {
    crumbs.push({ label: 'Inventario', ...(can('productos') ? { href: '/productos' } : {}) });
    if (location.pathname.includes('/combustibles')) {
      crumbs.push({ label: 'Combustibles', href: '/productos/combustibles' });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear combustible' });
      else if (location.pathname.endsWith('/editar')) crumbs.push({ label: 'Modificar combustible' });
    } else if (location.pathname.includes('/categorias-grupos')) {
      crumbs.push({ label: 'Categorías y Grupos', href: '/productos/categorias-grupos' });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear categoría o grupo' });
    } else {
      crumbs.push({ label: 'Productos', href: '/productos' });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear producto' });
      else if (location.pathname.endsWith('/editar')) crumbs.push({ label: 'Modificar producto' });
    }
  } else if (location.pathname.startsWith('/inventario/salidas')) {
    crumbs.push({ label: 'Inventario', ...(can('productos') ? { href: '/productos' } : {}) });
    crumbs.push({ label: 'Salida de productos', ...(can('salidas') ? { href: '/inventario/salidas' } : {}) });
    if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Registrar salida' });
  } else if (location.pathname.startsWith('/compras')) {
    crumbs.push({ label: 'Compras' });
    if (location.pathname.startsWith('/compras/proveedores')) {
      crumbs.push({ label: 'Proveedores', ...(can('proveedores') ? { href: '/compras/proveedores' } : {}) });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear proveedor' });
      else if (location.pathname.endsWith('/editar')) crumbs.push({ label: 'Modificar proveedor' });
      else if (location.pathname !== '/compras/proveedores') crumbs.push({ label: 'Detalle de proveedor' });
    } else if (location.pathname.startsWith('/compras/ordenes')) {
      crumbs.push({ label: 'Órdenes de compra', ...(can('ordenes') ? { href: '/compras/ordenes' } : {}) });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear orden' });
    } else {
      crumbs.push({ label: 'Compras', ...(can('compras') ? { href: '/compras' } : {}) });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Registrar compra' });
      else if (location.pathname !== '/compras') crumbs.push({ label: 'Detalle de compra' });
    }
  } else if (location.pathname.startsWith('/ventas')) {
    crumbs.push({ label: 'Ventas' });
    if (location.pathname.startsWith('/ventas/dispensadores')) {
      crumbs.push({ label: 'Dispensadores', ...(can('dispensadores') ? { href: '/ventas/dispensadores' } : {}) });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear dispensador' });
      else if (location.pathname.endsWith('/editar')) crumbs.push({ label: 'Modificar dispensador' });
    } else if (location.pathname.startsWith('/ventas/descuentos')) {
      crumbs.push({ label: 'Descuentos', ...(can('descuentos') ? { href: '/ventas/descuentos' } : {}) });
      if (location.pathname.endsWith('/crear')) crumbs.push({ label: 'Crear descuento' });
      else if (location.pathname.endsWith('/editar')) crumbs.push({ label: 'Modificar descuento' });
    } else {
      crumbs.push({ label: 'Ventas', ...(can('ventas') ? { href: '/ventas' } : {}) });
      if (location.pathname.endsWith('/nueva')) crumbs.push({ label: 'Nueva venta' });
      else if (location.pathname !== '/ventas') crumbs.push({ label: 'Nota de venta' });
    }
  } else if (location.pathname.startsWith('/reportes')) {
    crumbs.push({ label: 'Reportes y Estadísticas', href: '/reportes' });
  }

  const logout = async () => {
    try {
      await send('/auth/logout', 'POST');
      await mutate(() => true, undefined, { revalidate: false });
      dispatch(setUser(null));
    } catch (err) {
      setError(err);
    }
  };

  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''} ${mobile ? 'mobile-open' : ''}`}>
      <a href="#main-content" className="skip-link">Saltar al contenido</a>
      {mobile && <button className="sidebar-overlay" onClick={() => setMobile(false)} aria-label="Cerrar navegación" />}
      <aside className="sidebar" aria-label="Navegación principal">
        <div className="brand-row">
          <Link to={firstPath(user)} className="brand">
            <Fuel size={25} strokeWidth={1.8} />
            <span>Mi Gasolinera</span>
          </Link>
          <button
            className="button icon-button collapse-control"
            aria-label={collapsed ? 'Expandir menú' : 'Contraer menú'}
            onClick={() => setCollapsed(!collapsed)}
          >
            {collapsed ? <ChevronRight size={17} /> : <ChevronLeft size={17} />}
          </button>
          <button className="icon-button mobile-close" aria-label="Cerrar menú" onClick={() => setMobile(false)}>
            <X size={20} />
          </button>
        </div>
        <nav className="nav-content">
          {(can('usuarios') || can('roles') || can('permisos') || can('modulos')) && (
            <div className="nav-group">
              <div className="nav-item nav-group-heading">
                <UsersRound size={21} />
                <span>Gestión de Usuarios</span>
                <ChevronDown size={20} />
              </div>
              <div className="nav-children">
                {can('usuarios') && (
                  <NavLink
                    to="/usuarios"
                    end
                    className={({ isActive }) =>
                      `nav-item ${
                        isActive ||
                        (/^\/usuarios\/[^/]+(?:\/editar)?$/.test(location.pathname) &&
                          !location.pathname.includes('roles') &&
                          !location.pathname.includes('permisos') &&
                          !location.pathname.includes('modulos'))
                          ? 'active'
                          : ''
                      }`
                    }
                    title="Usuarios"
                  >
                    <UsersRound size={20} />
                    <span>Usuarios</span>
                  </NavLink>
                )}
                {can('roles') && (
                  <NavLink to="/usuarios/roles" className="nav-item" title="Roles">
                    <UserRound size={20} />
                    <span>Roles</span>
                  </NavLink>
                )}
                {can('permisos') && (
                  <NavLink to="/usuarios/permisos" className="nav-item" title="Permisos">
                    <KeyRound size={20} />
                    <span>Permisos</span>
                  </NavLink>
                )}
                {can('modulos') && (
                  <NavLink to="/usuarios/modulos" className="nav-item" title="Módulos del Sistema">
                    <Boxes size={20} />
                    <span>Módulos</span>
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {(can('empresa') || can('bitacora') || can('sucursales')) && (
            <div className="nav-group">
              <div className="nav-item nav-group-heading">
                <Building2 size={21} />
                <span>Administrar Empresa</span>
                <ChevronDown size={20} />
              </div>
              <div className="nav-children">
                {can('empresa') && (
                  <NavLink to="/empresa" end className="nav-item" title="Empresa">
                    <Building size={20} />
                    <span>Empresa</span>
                  </NavLink>
                )}
                {can('bitacora') && (
                  <NavLink to="/empresa/bitacora" className="nav-item" title="Bitácora">
                    <ScrollText size={20} />
                    <span>Bitácora</span>
                  </NavLink>
                )}
                {can('sucursales') && (
                  <NavLink to="/empresa/sucursales" className="nav-item" title="Sucursales">
                    <Building2 size={20}/><span>Sucursales</span>
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {(can('productos') || can('combustibles') || can('categorias') || can('salidas')) && (
            <div className="nav-group">
              <div className="nav-item nav-group-heading">
                <Package size={21} />
                <span>Gestión de Inventario</span>
                <ChevronDown size={20} />
              </div>
              <div className="nav-children">
                {can('productos') && (
                  <NavLink
                    to="/productos"
                    end
                    className={({ isActive }) =>
                      `nav-item ${
                        isActive ||
                        (location.pathname.startsWith('/productos') &&
                          !location.pathname.includes('combustibles') &&
                          !location.pathname.includes('categorias'))
                          ? 'active'
                          : ''
                      }`
                    }
                    title="Productos"
                  >
                    <Package size={20} />
                    <span>Productos</span>
                  </NavLink>
                )}
                {can('combustibles') && (
                  <NavLink to="/productos/combustibles" className="nav-item" title="Combustibles">
                    <Fuel size={20} />
                    <span>Combustibles</span>
                  </NavLink>
                )}
                {can('categorias') && (
                  <NavLink to="/productos/categorias-grupos" className="nav-item" title="Categorías y Grupos">
                    <FolderTree size={20} />
                    <span>Categorías y Grupos</span>
                  </NavLink>
                )}
                {can('salidas') && (
                  <NavLink to="/inventario/salidas" className="nav-item" title="Salida de productos">
                    <ArrowDownToLine size={20} />
                    <span>Salida de productos</span>
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {(can('proveedores') || can('ordenes') || can('compras')) && (
            <div className="nav-group">
              <div className="nav-item nav-group-heading">
                <Truck size={21} />
                <span>Gestión de Compras</span>
                <ChevronDown size={20} />
              </div>
              <div className="nav-children">
                {can('proveedores') && (
                  <NavLink to="/compras/proveedores" className="nav-item" title="Proveedores">
                    <Truck size={20} />
                    <span>Proveedores</span>
                  </NavLink>
                )}
                {can('ordenes') && (
                  <NavLink to="/compras/ordenes" className="nav-item" title="Órdenes de compra">
                    <FileSpreadsheet size={20} />
                    <span>Órdenes de compra</span>
                  </NavLink>
                )}
                {can('compras') && (
                  <NavLink to="/compras" end className="nav-item" title="Compras">
                    <ShoppingCart size={20} />
                    <span>Compras</span>
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {(can('ventas') || can('dispensadores') || can('descuentos')) && (
            <div className="nav-group">
              <div className="nav-item nav-group-heading">
                <ShoppingCart size={21} />
                <span>Gestión de Ventas</span>
                <ChevronDown size={20} />
              </div>
              <div className="nav-children">
                {can('ventas') && (
                  <NavLink to="/ventas" end className="nav-item" title="Ventas">
                    <ShoppingCart size={20} />
                    <span>Ventas</span>
                  </NavLink>
                )}
                {can('dispensadores') && (
                  <NavLink to="/ventas/dispensadores" className="nav-item" title="Dispensadores">
                    <Gauge size={20} />
                    <span>Dispensadores</span>
                  </NavLink>
                )}
                {can('descuentos') && (
                  <NavLink to="/ventas/descuentos" className="nav-item" title="Descuentos">
                    <Tags size={20} />
                    <span>Descuentos</span>
                  </NavLink>
                )}
              </div>
            </div>
          )}

          {can('reportes') && (
            <NavLink to="/reportes" className="nav-item" title="Reportes y Estadísticas" style={{ marginTop: '4px' }}>
              <BarChart3 size={20} />
              <span>Reportes</span>
            </NavLink>
          )}
        </nav>
      </aside>
      <div className="app-body">
        <header className="topbar">
          <button className="icon-button mobile-menu" aria-label="Abrir menú" onClick={() => setMobile(true)}>
            <Menu size={23} />
          </button>
          <nav className="breadcrumbs" aria-label="Ruta actual">
            {crumbs.map((crumb, i) => (
              <span key={i}>
                {i > 0 && <ChevronRight size={14} />}
                {crumb.href && i < crumbs.length - 1 ? (
                  <Link to={crumb.href}>{crumb.label}</Link>
                ) : (
                  <span aria-current={i === crumbs.length - 1 ? 'page' : undefined}>{crumb.label}</span>
                )}
              </span>
            ))}
          </nav>

          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto' }}>
            <NotificationsDrawer />
            <div
              className="account"
              ref={accountRef}
              onBlur={event => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setAccount(false);
              }}
            >
              <button className="avatar" aria-label="Mi cuenta" aria-expanded={account} onClick={() => setAccount(!account)}>
                <CircleUserRound size={21} />
              </button>
              {account && (
                <div className="account-dropdown">
                  <strong>{user?.nombre}</strong>
                  <span>{user?.correo}</span>
                  <span className="account-role">
                    <ShieldCheck size={14} />
                    {user?.rol.nombre}
                  </span>
                  <Link className="button" to="/mi-perfil">
                    <UserRound size={16} />
                    Mi perfil
                  </Link>
                  <button onClick={logout}>
                    <LogOut size={16} />
                    Cerrar sesión
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>
        <main id="main-content" className="main-content">
          {notice && (
            <div className="toast" role="status">
              <span>{notice}</span>
              <button className="icon-button" aria-label="Cerrar notificación" onClick={() => dispatch(setNotice(''))}>
                <X size={17} />
              </button>
            </div>
          )}
          <ErrorBox error={error} />
          <Outlet />
        </main>
        <footer className="mobile-footer">Mi Gasolinera · Sistema de Gestión</footer>
      </div>
    </div>
  );
}
