import { Fuel, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { usePasswordRecovery, usePasswordReset } from '../application/use-password-recovery';
import { PasswordInput } from '../../../../shared/presentation/forms';
import { ErrorBox } from '../../../../shared/presentation/feedback';

function AuthPanel({ children, description }: { children: ReactNode; description: string }) {
    return <main className="login-page"><div className="login-panel"><div className="login-heading"><Link className="login-brand" to="/login"><h1><Fuel size={30} strokeWidth={1.9}/>Mi Gasolinera</h1></Link><p>{description}</p></div>{children}</div></main>;
}

export function PasswordRecovery() {
    const [correo, setCorreo] = useState('');
    const [manualCodeStep, setManualCodeStep] = useState(false);
    const [codigo, setCodigo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const { pending: sending, error: sendError, sent, request, resetStep } = usePasswordRecovery();
    const { pending: resetting, error: resetError, complete, reset } = usePasswordReset();

    async function submitRequest(event: FormEvent) {
        event.preventDefault();
        await request(correo);
    }

    async function submitReset(event: FormEvent) {
        event.preventDefault();
        await reset(codigo, contrasena, confirmacion, correo);
    }

    if (complete) {
        return <AuthPanel description="Tu contraseña se actualizó correctamente.">
            <div className="login-form">
                <p className="alert" role="status">Tu contraseña se restableció correctamente. Ya puedes iniciar sesión.</p>
                <Link className="button primary" to="/login">Iniciar sesión</Link>
            </div>
        </AuthPanel>;
    }

    const showCodeForm = sent || manualCodeStep;

    return <AuthPanel description={showCodeForm ? 'Ingresa el código recibido en tu correo y tu nueva contraseña.' : 'Te enviaremos un código de 6 dígitos y un enlace para restablecer tu contraseña.'}>
        {showCodeForm ? (
            <form onSubmit={submitReset} className="login-form">
                {sent && <p className="alert" role="status">Si existe una cuenta asociada a <strong>{correo}</strong>, recibirás un código de 6 dígitos y un enlace en tu correo.</p>}
                <ErrorBox error={resetError}/>
                <label className="field">
                    <span className="field-label">Correo electrónico</span>
                    <input type="email" autoComplete="email" required maxLength={100} value={correo} onChange={event => setCorreo(event.target.value)}/>
                </label>
                <label className="field">
                    <span className="field-label">Código de verificación</span>
                    <input
                        type="text"
                        inputMode="numeric"
                        placeholder="Ej. 482915"
                        required
                        autoComplete="one-time-code"
                        pattern="[0-9]{6}"
                        maxLength={6}
                        value={codigo}
                        onChange={event => setCodigo(event.target.value)}
                    />
                </label>
                <div className="field">
                    <label className="field-label" htmlFor="recovery-new-password">Nueva contraseña</label>
                    <PasswordInput id="recovery-new-password" autoComplete="new-password" required minLength={8} maxLength={128} value={contrasena} onChange={event => setContrasena(event.target.value)}/>
                    <small className="login-password-hint">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</small>
                </div>
                <div className="field">
                    <label className="field-label" htmlFor="recovery-confirm-password">Confirmar contraseña</label>
                    <PasswordInput id="recovery-confirm-password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmacion} onChange={event => setConfirmacion(event.target.value)}/>
                </div>
                <button type="submit" className="button primary" disabled={resetting}>
                    {resetting && <LoaderCircle size={17} className="spin"/>}
                    {resetting ? 'Restableciendo…' : 'Restablecer contraseña'}
                </button>
                <button
                    type="button"
                    className="login-recovery-link"
                    style={{ border: 0, background: 'transparent', textAlign: 'left', padding: 0 }}
                    onClick={() => {
                        setManualCodeStep(false);
                        resetStep();
                    }}
                >
                    Solicitar otro código
                </button>
                <Link className="login-recovery-link" to="/login">Volver al inicio de sesión</Link>
            </form>
        ) : (
            <form onSubmit={submitRequest} className="login-form">
                <ErrorBox error={sendError}/>
                <label className="field">
                    <span className="field-label">Correo electrónico</span>
                    <input type="email" autoComplete="email" required maxLength={100} value={correo} onChange={event => setCorreo(event.target.value)}/>
                </label>
                <button type="submit" className="button primary" disabled={sending}>
                    {sending && <LoaderCircle size={17} className="spin"/>}
                    {sending ? 'Enviando…' : 'Enviar código'}
                </button>
                <button
                    type="button"
                    className="login-recovery-link"
                    style={{ border: 0, background: 'transparent', textAlign: 'left', padding: 0 }}
                    onClick={() => setManualCodeStep(true)}
                >
                    Ya tengo un código de verificación
                </button>
                <Link className="login-recovery-link" to="/login">Volver al inicio de sesión</Link>
            </form>
        )}
    </AuthPanel>;
}

export function PasswordReset() {
    const location = useLocation();
    const urlToken =
        new URLSearchParams(location.hash.slice(1)).get('token') ??
        new URLSearchParams(location.search).get('token') ??
        '';
    const [contrasena, setContrasena] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const { pending, error, complete, reset } = usePasswordReset();

    async function submit(event: FormEvent) {
        event.preventDefault();
        await reset(urlToken, contrasena, confirmacion);
    }

    if (!urlToken) return <Navigate to="/recuperar-contrasena" replace/>;

    return <AuthPanel description="Elige una contraseña nueva para tu cuenta.">
        {complete ? <div className="login-form"><p className="alert" role="status">Tu contraseña se restableció correctamente. Ya puedes iniciar sesión.</p><Link className="button primary" to="/login">Iniciar sesión</Link></div> :
            <form onSubmit={submit} className="login-form">
                <ErrorBox error={error}/>
                <div className="field">
                    <label className="field-label" htmlFor="new-password">Nueva contraseña</label>
                    <PasswordInput id="new-password" autoComplete="new-password" required minLength={8} maxLength={128} value={contrasena} onChange={event => setContrasena(event.target.value)}/>
                    <small className="login-password-hint">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</small>
                </div>
                <div className="field">
                    <label className="field-label" htmlFor="confirm-password">Confirmar contraseña</label>
                    <PasswordInput id="confirm-password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmacion} onChange={event => setConfirmacion(event.target.value)}/>
                </div>
                <button type="submit" className="button primary" disabled={pending}>
                    {pending && <LoaderCircle size={17} className="spin"/>}
                    {pending ? 'Restableciendo…' : 'Restablecer contraseña'}
                </button>
                <Link className="login-recovery-link" to="/recuperar-contrasena">Solicitar un nuevo código</Link>
            </form>}
    </AuthPanel>;
}

// Alias de componente «UI» para trazabilidad UML (CU18: UI.Recuperación / Notificacion)
export const UINotificacion = PasswordRecovery;
export const UIRecuperacion = PasswordRecovery;
