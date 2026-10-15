import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR, { useSWRConfig } from 'swr';
import { useDebounced } from '../../../../shared/application/use-debounced';
import { allowed, setNotice, useAppDispatch, useSession } from '../../../security/auth/application/session';
import { BranchDetail, BranchFormData, BranchPage } from '../domain/models';
import { useBranchesApi } from './repository-context';

export function useBranches() {
    const api = useBranchesApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const { mutate } = useSWRConfig();
    const [q, setQ] = useState('');
    const search = useDebounced(q);
    const [active, setActive] = useState('true');
    const [page, setPage] = useState(1);
    const [target, setTarget] = useState<BranchDetail | null>(null);
    useEffect(() => setPage(1), [search, active]);
    const result = useSWR<BranchPage>(api.listKey(page, search, active));
    useEffect(() => { if (result.data && page > 1 && !result.data.items.length) setPage(page - 1); }, [result.data, page]);
    const disable = () => target ? api.disable(target.id) : Promise.reject(new Error('Seleccione una sucursal.'));
    const refresh = () => {
        void mutate(key => typeof key === 'string' && key.startsWith('/sucursales'));
        dispatch(setNotice('Sucursal deshabilitada correctamente.'));
    };
    return { user, q, setQ, active, setActive, page, setPage, target, setTarget, disable, refresh, ...result };
}

export function useBranchForm(forceReadonly: boolean) {
    const { id } = useParams();
    const api = useBranchesApi();
    const { user } = useSession();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const { mutate } = useSWRConfig();
    const detail = useSWR<BranchDetail>(api.detailKey(id));
    const catalog = useSWR<BranchPage>(api.listKey(1, '', 'all'));
    const [form, setForm] = useState<BranchFormData>({ nombre: '', direccion: '', telefono: '', correo: '' });
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    const hydrated = useRef('');
    useEffect(() => {
        const key = id || 'new';
        if (hydrated.current === key || id && !detail.data) return;
        hydrated.current = key;
        const data = detail.data;
        setForm(data ? { nombre: data.nombre, direccion: data.direccion || '', telefono: data.telefono || '', correo: data.correo || '' } : { nombre: '', direccion: '', telefono: '', correo: '' });
    }, [id, detail.data]);
    const readonly = forceReadonly || !allowed(user, 'sucursales', id ? 'editar' : 'crear');
    async function submit(event: FormEvent) {
        event.preventDefault();
        if (readonly || pending || !catalog.data?.empresa) return;
        setPending(true); setError(null);
        try {
            await api.save(id, form);
            await mutate(key => typeof key === 'string' && key.startsWith('/sucursales'));
            dispatch(setNotice(id ? 'Sucursal actualizada correctamente.' : 'Sucursal registrada correctamente.'));
            navigate('/empresa/sucursales');
        } catch (err) { setError(err); } finally { setPending(false); }
    }
    return { id, user, detail, catalog, form, setForm, pending, error, readonly, submit };
}
