import { useState } from 'react';
import { useAuthApi } from './repository-context';

export function usePasswordRecovery() {
    const authApi = useAuthApi();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    const [sent, setSent] = useState(false);

    async function request(correo: string) {
        setPending(true);
        setError(null);
        try {
            await authApi.requestPasswordReset(correo);
            setSent(true);
        } catch (err) {
            setError(err);
        } finally {
            setPending(false);
        }
    }

    return { pending, error, sent, request };
}

export function usePasswordReset() {
    const authApi = useAuthApi();
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    const [complete, setComplete] = useState(false);

    async function reset(token: string, contrasena: string, confirmacion: string) {
        setError(null);
        if (contrasena !== confirmacion) {
            setError(new Error('Las contraseñas no coinciden.'));
            return;
        }
        setPending(true);
        try {
            await authApi.resetPassword(token, contrasena);
            setComplete(true);
        } catch (err) {
            setError(err);
        } finally {
            setPending(false);
        }
    }

    return { pending, error, complete, reset };
}
