import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { useDebounced } from '../../../../shared/application/use-debounced';
import { useUsersApi } from './repository-context';
import { allowed, setNotice, useAppDispatch, useSession } from '../../auth/application/session';
import { PageData } from '../../../../shared/domain/pagination';
import { Branch } from '../../../enterprise/branches/domain/models';
import { Role } from '../../roles/domain/models';
import { User } from '../domain/models';
import { blankUser } from '../domain/form';
export function useUsers() {
    const usersApi = useUsersApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const [q, setQ] = useState('');
    const search = useDebounced(q);
    const [page, setPage] = useState(1);
    const [active, setActive] = useState('true');
    const [filters, setFilters] = useState(false);
    const [target, setTarget] = useState<User | null>(null);
    const { data, error, isLoading, mutate } = useSWR<PageData<User>>(usersApi.listKey(page, search, active));
    useEffect(() => setPage(1), [search, active]);
    const protectedUser = (row: User) => row.rol.codigo === 'ASU';
    const disableSelected = () => target ? usersApi.disable(target) : Promise.reject(new Error('Seleccione un registro.'));
    return { user, dispatch, q, setQ, page, setPage, active, setActive, filters, setFilters, target, setTarget, data, error, isLoading, mutate, protectedUser, disableSelected };
}
export function useUserForm({ readonly = false }: {
    readonly?: boolean;
}) {
    const usersApi = useUsersApi();
    const { ci } = useParams();
    const { user } = useSession();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [form, setForm] = useState(blankUser);
    const loaded = useRef('');
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    const detail = useSWR<User>(usersApi.detailKey(ci));
    const roles = useSWR<Role[]>(usersApi.roleOptionsKey(readonly));
    const branches = useSWR<Branch[]>(usersApi.branchesKey(readonly));
    useEffect(() => { if (detail.data && loaded.current !== detail.data.ci) {
        const d = detail.data;
        setForm({ ci: d.ci, nombre: d.nombre, correo: d.correo, telefono: d.telefono, cargo: d.cargo || '', sexo: d.sexo, domicilio: d.domicilio, contrasena: '', rolId: String(d.rolId ?? d.rol.id), sucursalId: d.sucursalId ? String(d.sucursalId) : '' });
        loaded.current = d.ci;
    } }, [detail.data]);
    const restricted = !readonly && (!allowed(user, 'usuarios', ci ? 'editar' : 'crear') || detail.data?.rol.codigo === 'ASU');
    const set = (key: keyof typeof blankUser) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [key]: e.target.value }));
    async function submit(e: FormEvent) { e.preventDefault(); setError(null); setPending(true); try {
        const { contrasena, ci: identifier, ...rest } = form;
        const payload = { ...rest, nombre: form.nombre.trim(), correo: form.correo.trim(), rolId: Number(form.rolId), sucursalId: form.sucursalId ? Number(form.sucursalId) : null, ...(!ci ? { ci: identifier.trim() } : {}), ...(contrasena ? { contrasena } : {}) };
        await usersApi.save(ci, payload);
        if (ci) await detail.mutate();
        dispatch(setNotice(ci ? 'Usuario actualizado correctamente.' : 'Usuario creado correctamente.'));
        navigate('/usuarios');
    }
    catch (err) {
        setError(err);
    }
    finally {
        setPending(false);
    } }
    return { ci, form, pending, error, detail, roles, branches, restricted, set, submit };
}
