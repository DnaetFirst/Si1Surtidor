import { Fuel, LoaderCircle } from 'lucide-react';
import { Navigate } from 'react-router-dom';
import { PasswordInput } from '../../../../shared/presentation/forms';
import { ErrorBox } from '../../../../shared/presentation/feedback';
import { firstPath } from '../application/session';
import { useLogin } from '../application/use-auth';
export function Login() {
    const { user, expired, correo, setCorreo, contrasena, setContrasena, pending, error, submit } = useLogin();
    if (user)
        return <Navigate to={firstPath(user)} replace/>;
    return <main className="login-page"><div className="login-panel"><div className="login-heading"><h1><Fuel size={30} strokeWidth={1.9}/>Mi Gasolinera</h1><p>Ingrese su correo electrónico a continuación<br />para iniciar sesión en su cuenta</p></div>{expired && <div className="alert" role="status">Tu sesión ha expirado. Inicia sesión para continuar.</div>}<form onSubmit={submit} className="login-form"><ErrorBox error={error}/><label className="field"><span className="field-label">Correo electrónico</span><input type="email" autoComplete="username" name="correo" required maxLength={100} value={correo} onChange={e => setCorreo(e.target.value)}/></label><div className="field"><label className="field-label" htmlFor="login-password">Contraseña</label><PasswordInput id="login-password" autoComplete="current-password" name="contrasena" maxLength={128} required value={contrasena} onChange={e => setContrasena(e.target.value)}/></div><button type="submit" className="button primary" disabled={pending}>{pending && <LoaderCircle size={17} className="spin"/>}{pending ? 'Iniciando sesión…' : 'Iniciar sesión'}</button></form></div><svg className="fuel-decoration" viewBox="0 0 192 352" aria-hidden="true"><path d="M43 118v169c0 38 54 38 54 0v-36c0-36 25-44 69-44h40" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/><path d="m4 5 26 17c9 6 15 17 16 28l14 11 13 32-14 13-1 47H39l-4-42-8-9-3-30 13-22c-3-17-9-22-23-31L2 11Z" fill="currentColor"/><path d="m33 82 12 8 2 27-13-4Z" fill="white"/><path d="M4 20c-11 12-1 17 3 12 3-3 0-8-3-12Z" fill="currentColor"/></svg></main>;
}
