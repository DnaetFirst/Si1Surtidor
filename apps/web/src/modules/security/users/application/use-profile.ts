import { useEffect, useState, type FormEvent } from 'react';
import useSWR, { useSWRConfig } from 'swr';
import { useNavigate } from 'react-router-dom';
import { setNotice, setUser, useAppDispatch, useSession } from '../../auth/application/session';
import { User } from '../domain/models';
import { useUsersApi } from './repository-context';

export function useProfile() {
    const api = useUsersApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const cache = useSWRConfig();
    const detail = useSWR<User>(api.profileKey());
    const [form, setForm] = useState({ nombre: '', correo: '', telefono: '', domicilio: '', contrasenaActual: '', contrasena: '' });
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    useEffect(() => { if (detail.data) {
        const { nombre, correo, telefono, domicilio } = detail.data;
        setForm({ nombre, correo, telefono, domicilio, contrasenaActual: '', contrasena: '' });
    } }, [detail.data]);
    const set = (key: keyof typeof form) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(current => ({ ...current, [key]: event.target.value }));
    async function submit(event: FormEvent) {
        event.preventDefault(); setPending(true); setError(null);
        try {
            const { contrasenaActual, contrasena, ...fields } = form;
            const result = await api.saveProfile({ ...fields, ...(contrasena ? { contrasena, contrasenaActual } : {}) });
            if (contrasena) {
                await cache.mutate(() => true, undefined, { revalidate: false });
                dispatch(setUser(null)); navigate('/login');
            } else {
                await detail.mutate(result, false);
                if (user) dispatch(setUser({ ...user, nombre: result.nombre, correo: result.correo }));
                dispatch(setNotice('Perfil actualizado correctamente.'));
            }
        } catch (failure) { setError(failure); } finally { setPending(false); }
    }
    return { detail, form, set, pending, error, submit };
}
