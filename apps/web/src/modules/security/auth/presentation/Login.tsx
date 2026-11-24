import { useEffect, useRef, useState } from 'react';
import { Fuel, LoaderCircle } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';
import { PasswordInput } from '../../../../shared/presentation/forms';
import { ErrorBox } from '../../../../shared/presentation/feedback';
import { useAuthApi } from '../application/repository-context';
import { firstPath } from '../application/session';
import { useLogin } from '../application/use-auth';

type DemoAccount = { rol: string; correo: string; contrasena: string };
const demoAccounts: DemoAccount[] = (() => {
    try {
        const accounts: unknown = JSON.parse(import.meta.env.VITE_DEMO_ACCOUNTS || '[]');
        return Array.isArray(accounts) ? accounts.filter((account): account is DemoAccount =>
            account && typeof account.rol === 'string' && typeof account.correo === 'string' && typeof account.contrasena === 'string'
        ) : [];
    } catch {
        return [];
    }
})();

export function Login() {
    const authApi = useAuthApi();
    const [demoAsu, setDemoAsu] = useState<Omit<DemoAccount, 'rol'>>();
    const [selectedRole, setSelectedRole] = useState<string>();
    const formRef = useRef<HTMLFormElement>(null);
    const {
        user, expired, correo, setCorreo, contrasena, setContrasena, pending, error, submit,
        rememberedAsu, rememberAsu, setRememberAsu, saveRememberedAsu,
    } = useLogin();

    useEffect(() => {
        if (!demoAccounts.some(account => /^ASU\b/i.test(account.rol))) return;
        let cancelled = false;
        void authApi.demoAsuAccount().then(({ account }) => {
            if (!cancelled) setDemoAsu(account ?? undefined);
        }).catch(() => {
            if (!cancelled) setDemoAsu(undefined);
        });
        return () => { cancelled = true; };
    }, [authApi]);

    const accounts = demoAccounts.flatMap(account => {
        if (!/^ASU\b/i.test(account.rol)) return [account];
        return demoAsu ? [{ rol: account.rol, ...demoAsu }] : [];
    });
    const selectedDemo = accounts.find(account => account.rol === selectedRole) ?? accounts[0];

    if (user)
        return <Navigate to={firstPath(user)} replace/>;
    return <main className="login-page"><div className={`login-panel${accounts.length ? ' login-panel-with-demo' : ''}`}><div className="login-main"><div className="login-heading"><h1><Fuel size={30} strokeWidth={1.9}/>Mi Gasolinera</h1><p>Ingrese su correo electrónico a continuación<br />para iniciar sesión en su cuenta</p></div>{expired && <div className="alert" role="status">Tu sesión ha expirado. Inicia sesión para continuar.</div>}<form ref={formRef} onSubmit={submit} className="login-form">
        {rememberedAsu && <div className="login-saved-account">
            <button type="button" className="button" disabled={pending} onClick={() => {
                if (correo !== rememberedAsu) setContrasena('');
                setCorreo(rememberedAsu);
                formRef.current?.querySelector<HTMLInputElement>('#login-password')?.focus();
            }}>Usar mi cuenta ASU</button>
            <button type="button" className="button" disabled={pending} onClick={() => {
                saveRememberedAsu('');
                setRememberAsu(false);
            }}>Olvidar acceso</button>
        </div>}<ErrorBox error={error}/><label className="field"><span className="field-label">Correo electrónico</span><input type="email" autoComplete="username" name="correo" required maxLength={100} value={correo} onChange={e => setCorreo(e.target.value)}/></label><div className="field"><label className="field-label" htmlFor="login-password">Contraseña</label><PasswordInput id="login-password" autoComplete="current-password" name="contrasena" maxLength={128} required value={contrasena} onChange={e => setContrasena(e.target.value)}/></div>{!rememberedAsu && <label className="login-remember-account">
            <input type="checkbox" checked={rememberAsu} onChange={e => setRememberAsu(e.target.checked)}/>
            Recordar mi correo ASU en este navegador
        </label>}<button type="submit" className="button primary" disabled={pending}>{pending && <LoaderCircle size={17} className="spin"/>}{pending ? 'Iniciando sesión…' : 'Iniciar sesión'}</button><Link className="login-recovery-link" to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link></form></div>{selectedDemo && <section className="login-demo" aria-labelledby="demo-heading"><h2 id="demo-heading">Accesos de prueba</h2><p>Selecciona un actor para completar el formulario.</p><div className="login-demo-accounts">{accounts.map(account => <button key={account.rol} type="button" className="login-demo-account" aria-pressed={selectedDemo.rol === account.rol} disabled={pending} onClick={() => { setSelectedRole(account.rol); setCorreo(account.correo); setContrasena(account.contrasena); }}><strong>{account.rol}</strong></button>)}</div><dl className="login-demo-details" aria-live="polite"><div><dt>Correo</dt><dd>{selectedDemo.correo}</dd></div><div><dt>Contraseña</dt><dd><code>{selectedDemo.contrasena}</code></dd></div></dl><p>Entorno de demostración. No ingreses datos personales reales.</p></section>}</div><svg className="fuel-decoration" viewBox="0 0 192 352" aria-hidden="true"><path d="M43 118v169c0 38 54 38 54 0v-36c0-36 25-44 69-44h40" fill="none" stroke="currentColor" strokeWidth="8" strokeLinecap="round"/><path d="m4 5 26 17c9 6 15 17 16 28l14 11 13 32-14 13-1 47H39l-4-42-8-9-3-30 13-22c-3-17-9-22-23-31L2 11Z" fill="currentColor"/><path d="m33 82 12 8 2 27-13-4Z" fill="white"/><path d="M4 20c-11 12-1 17 3 12 3-3 0-8-3-12Z" fill="currentColor"/></svg></main>;
}
