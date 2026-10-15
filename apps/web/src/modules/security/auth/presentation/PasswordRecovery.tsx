import { Fuel, LoaderCircle } from 'lucide-react';
import { useState, type FormEvent, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { usePasswordRecovery, usePasswordReset } from '../application/use-password-recovery';
import { PasswordInput } from '../../../../shared/presentation/forms';
import { ErrorBox } from '../../../../shared/presentation/feedback';

const recoveryEmail = 'ronny0ronaldo@gmail.com';

function AuthPanel({ children, description }: { children: ReactNode; description: string }) {
    return <main className="login-page"><div className="login-panel"><div className="login-heading"><Link className="login-brand" to="/login"><h1><Fuel size={30} strokeWidth={1.9}/>Mi Gasolinera</h1></Link><p>{description}</p></div>{children}</div></main>;
}

export function PasswordRecovery() {
    const [correo, setCorreo] = useState(recoveryEmail);
    const { pending, error, sent, request } = usePasswordRecovery();

    async function submit(event: FormEvent) {
        event.preventDefault();
        await request(correo);
    }

    return <AuthPanel description="Te enviaremos un enlace para restablecer tu contraseña.">
        {sent ? <div className="login-form"><p className="alert" role="status">Si existe una cuenta asociada a ese correo, recibirás un enlace para restablecer la contraseña.</p><Link className="button primary" to="/login">Volver al inicio de sesión</Link></div> :
            <form onSubmit={submit} className="login-form"><ErrorBox error={error}/><label className="field"><span className="field-label">Correo electrónico</span><input type="email" autoComplete="email" required maxLength={100} value={correo} onChange={event => setCorreo(event.target.value)}/></label><button type="submit" className="button primary" disabled={pending}>{pending && <LoaderCircle size={17} className="spin"/>}{pending ? 'Enviando…' : 'Enviar enlace'}</button><Link className="login-recovery-link" to="/login">Volver al inicio de sesión</Link></form>}
    </AuthPanel>;
}

export function PasswordReset() {
    const location = useLocation();
    const token = new URLSearchParams(location.hash.slice(1)).get('token') ?? '';
    const [contrasena, setContrasena] = useState('');
    const [confirmacion, setConfirmacion] = useState('');
    const { pending, error, complete, reset } = usePasswordReset();

    async function submit(event: FormEvent) {
        event.preventDefault();
        await reset(token, contrasena, confirmacion);
    }

    return <AuthPanel description="Elige una contraseña nueva para tu cuenta.">
        {complete ? <div className="login-form"><p className="alert" role="status">Tu contraseña se restableció correctamente. Ya puedes iniciar sesión.</p><Link className="button primary" to="/login">Iniciar sesión</Link></div> :
            !token ? <div className="login-form"><p className="alert error" role="alert">El enlace no es válido o está incompleto. Solicita uno nuevo.</p><Link className="button primary" to="/recuperar-contrasena">Solicitar nuevo enlace</Link></div> :
                <form onSubmit={submit} className="login-form"><ErrorBox error={error}/><div className="field"><label className="field-label" htmlFor="new-password">Nueva contraseña</label><PasswordInput id="new-password" autoComplete="new-password" required minLength={8} maxLength={128} value={contrasena} onChange={event => setContrasena(event.target.value)}/><small className="login-password-hint">Mínimo 8 caracteres, con mayúscula, minúscula, número y símbolo.</small></div><div className="field"><label className="field-label" htmlFor="confirm-password">Confirmar contraseña</label><PasswordInput id="confirm-password" autoComplete="new-password" required minLength={8} maxLength={128} value={confirmacion} onChange={event => setConfirmacion(event.target.value)}/></div><button type="submit" className="button primary" disabled={pending}>{pending && <LoaderCircle size={17} className="spin"/>}{pending ? 'Restableciendo…' : 'Restablecer contraseña'}</button></form>}
    </AuthPanel>;
}
