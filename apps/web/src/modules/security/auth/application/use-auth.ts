import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { useAuthApi } from './repository-context';
import { firstPath, setUser, useAppDispatch, useSession } from './session';
const rememberedAsuKey = 'surtidor.login.asuEmail';

function readRememberedAsu(): string {
    try {
        return localStorage.getItem(rememberedAsuKey) ?? '';
    } catch {
        return '';
    }
}

export function useLogin() {
    const authApi = useAuthApi();
    const { user, expired } = useSession();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { mutate } = useSWRConfig();
    const [rememberedAsu, setRememberedAsu] = useState(readRememberedAsu);
    const [rememberAsu, setRememberAsu] = useState(false);
    function saveRememberedAsu(email: string) {
        try {
            if (email) localStorage.setItem(rememberedAsuKey, email);
            else localStorage.removeItem(rememberedAsuKey);
            setRememberedAsu(email);
        } catch {
            // Login remains available when browser storage is blocked.
        }
    }

    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    async function submit(e: FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const fields = new FormData(e.currentTarget);
        setPending(true);
        setError(null);
        try {
            const email = String(fields.get('correo') ?? '');
            const password = String(fields.get('contrasena') ?? '');
            const data = await authApi.login(email, password);
            if (rememberAsu && data.user.rol.codigo === 'ASU') {
                saveRememberedAsu(data.user.correo);
            }
            await mutate(() => true, undefined, { revalidate: false });
            dispatch(setUser(data.user));
            navigate(firstPath(data.user), { replace: true });
        } catch (err) {
            setError(err);
        } finally {
            setPending(false);
        }
    }

    return { user, expired, correo, setCorreo, contrasena, setContrasena, pending, error, submit, rememberedAsu, rememberAsu, setRememberAsu, saveRememberedAsu };
}
