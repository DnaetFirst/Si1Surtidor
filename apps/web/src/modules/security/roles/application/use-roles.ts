import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { useDebounced } from '../../../../shared/application/use-debounced';
import { useRolesApi } from './repository-context';
import { allowed, setNotice, useAppDispatch, useSession } from '../../auth/application/session';
import { PageData } from '../../../../shared/domain/pagination';
import { Permission } from '../../permissions/domain/models';
import { Role } from '../domain/models';
export function useRoles() {
    const rolesApi = useRolesApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const [q, setQ] = useState('');
    const search = useDebounced(q);
    const [page, setPage] = useState(1);
    const [active, setActive] = useState('true');
    const [target, setTarget] = useState<Role | null>(null);
    const { data, error, isLoading, mutate } = useSWR<PageData<Role>>(rolesApi.listKey(page, search, active));
    useEffect(() => setPage(1), [search, active]);
    const disableSelected = () => target ? rolesApi.disable(target) : Promise.reject(new Error('Seleccione un registro.'));
    return { user, dispatch, q, setQ, page, setPage, active, setActive, target, setTarget, data, error, isLoading, mutate, disableSelected };
}
export function useRoleForm() {
    const rolesApi = useRolesApi();
    const { id } = useParams();
    const { user } = useSession();
    const navigate = useNavigate();
    const dispatch = useAppDispatch();
    const [nombre, setNombre] = useState('');
    const [selected, setSelected] = useState<number[]>([]);
    const hydrated = useRef('');
    const [error, setError] = useState<unknown>();
    const [pending, setPending] = useState(false);
    const detail = useSWR<Role>(rolesApi.detailKey(id));
    const permissions = useSWR<Permission[]>(rolesApi.assignablePermissionsKey());
    useEffect(() => { if (detail.data && hydrated.current !== String(detail.data.id)) {
        setNombre(detail.data.nombre);
        setSelected(detail.data.permisos.map(p => p.id));
        hydrated.current = String(detail.data.id);
    } }, [detail.data]);
    const readonly = !allowed(user, 'roles', id ? 'editar' : 'crear');
    const groups = (permissions.data || []).reduce<Record<string, Permission[]>>((all, permission) => { (all[permission.modulo] ||= []).push(permission); return all; }, {});
    async function submit(e: FormEvent) { e.preventDefault(); setPending(true); setError(null); try {
        await rolesApi.save(id, nombre, selected);
        dispatch(setNotice(id ? 'Rol actualizado correctamente.' : 'Rol creado correctamente.'));
        navigate('/usuarios/roles');
    }
    catch (err) {
        setError(err);
    }
    finally {
        setPending(false);
    } }
    return { id, user, nombre, setNombre, selected, setSelected, error, pending, detail, permissions, readonly, groups, submit };
}
