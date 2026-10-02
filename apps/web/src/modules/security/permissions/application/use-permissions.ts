import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { query } from '../../../../shared/domain/query';
import { usePermissionsApi } from './repository-context';
import { allowed, setNotice, useAppDispatch, useSession } from '../../auth/application/session';
import { PageData } from '../../../../shared/domain/pagination';
import { Capability, Permission } from '../domain/models';
export function usePermissions() {
    const permissionsApi = usePermissionsApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const [q, setQ] = useState('');
    const [draftQ, setDraftQ] = useState('');
    const [page, setPage] = useState(1);
    const [active, setActive] = useState('true');
    const [draftActive, setDraftActive] = useState('true');
    const [filters, setFilters] = useState(false);
    const [target, setTarget] = useState<Permission | null>(null);
    const [exporting, setExporting] = useState(false);
    const [actionError, setActionError] = useState<unknown>();
    const params = query({ q, activo: active });
    const { data, error, isLoading, mutate } = useSWR<PageData<Permission>>(permissionsApi.listKey(params, page));
    useEffect(() => setPage(1), [q, active]);
    const exportCsv = async () => { setExporting(true); setActionError(null); try {
        await permissionsApi.exportCsv(params);
    }
    catch (err) {
        setActionError(err);
    }
    finally {
        setExporting(false);
    } };
    const disableSelected = () => target ? permissionsApi.disable(target) : Promise.reject(new Error('Seleccione un registro.'));
    return { user, dispatch, q, setQ, draftQ, setDraftQ, page, setPage, active, setActive, draftActive, setDraftActive, filters, setFilters, target, setTarget, exporting, actionError, data, error, isLoading, mutate, exportCsv, disableSelected };
}
export function usePermissionForm() {
    const permissionsApi = usePermissionsApi();
    const { id } = useParams();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const navigate = useNavigate();
    const [form, setForm] = useState({ nombre: '', descripcion: '', codigo: '' });
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    const hydrated = useRef('');
    const detail = useSWR<Permission>(permissionsApi.detailKey(id));
    const capabilities = useSWR<Capability[]>(permissionsApi.capabilitiesKey(id));
    useEffect(() => { if (detail.data && hydrated.current !== String(detail.data.id)) {
        const d = detail.data;
        setForm({ nombre: d.nombre, descripcion: d.descripcion, codigo: d.codigo });
        hydrated.current = String(d.id);
    } }, [detail.data]);
    const readonly = !allowed(user, 'permisos', id ? 'editar' : 'crear');
    async function submit(e: FormEvent) { e.preventDefault(); const capability = capabilities.data?.find(c => c.codigo === form.codigo); setError(null); setPending(true); try {
        await permissionsApi.save(id, form, capability);
        if (id) await detail.mutate();
        dispatch(setNotice(id ? 'Permiso actualizado correctamente.' : 'Permiso creado correctamente.'));
        navigate('/usuarios/permisos');
    }
    catch (err) {
        setError(err);
    }
    finally {
        setPending(false);
    } }
    return { id, form, setForm, pending, error, detail, capabilities, readonly, submit };
}
