import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSWRConfig } from 'swr';
import { useAuthApi } from './repository-context';
import { firstPath, setUser, useAppDispatch, useSession } from './session';
export function useLogin() {
    const authApi = useAuthApi();
    const { user, expired } = useSession();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const { mutate } = useSWRConfig();
    const [correo, setCorreo] = useState('');
    const [contrasena, setContrasena] = useState('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    async function submit(e: FormEvent) { e.preventDefault(); setPending(true); setError(null); try {
        const data = await authApi.login(correo, contrasena);
        await mutate(() => true, undefined, { revalidate: false });
        dispatch(setUser(data.user));
        navigate(firstPath(data.user), { replace: true });
    }
    catch (err) {
        setError(err);
    }
    finally {
        setPending(false);
    } }
    return { user, expired, correo, setCorreo, contrasena, setContrasena, pending, error, submit };
}
