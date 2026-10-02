import { useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { useCompanyApi } from './repository-context';
import { allowed, setNotice, useAppDispatch, useSession } from '../../../security/auth/application/session';
import { Company } from '../domain/models';
import { initial } from '../domain/form';
export function useCompanyPage() {
    const companyApi = useCompanyApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const { data, error, isLoading, mutate } = useSWR<Company | null>(companyApi.detailKey());
    const [form, setForm] = useState<Company>(initial);
    const [pending, setPending] = useState(false);
    const [saveError, setSaveError] = useState<unknown>();
    const [isEditing, setIsEditing] = useState(false);
    const startEdit = () => {
        setForm(data ? {
            nombre: data.nombre, telefono: data.telefono, direccion: data.direccion,
            correo: data.correo, nombrePropietario: data.nombrePropietario,
            fechaCreacion: data.fechaCreacion.slice(0, 10), logoUrl: data.logoUrl || '', nit: data.nit,
        } : { ...initial });
        setSaveError(null);
        setIsEditing(true);
    };
    const cancelEdit = () => {
        if (pending) return;
        setSaveError(null);
        setIsEditing(false);
    };
    const readonly = !allowed(user, 'empresa', data ? 'editar' : 'crear');
    const set = (field: keyof Company) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(f => ({ ...f, [field]: e.target.value }));
    async function submit(e: FormEvent) { e.preventDefault(); setSaveError(null); setPending(true); try {
        const result = await companyApi.save(data, form);
        await mutate(result, false);
        setIsEditing(false);
        dispatch(setNotice(data ? 'Información de la empresa actualizada.' : 'Empresa registrada correctamente.'));
    }
    catch (err) {
        setSaveError(err);
    }
    finally {
        setPending(false);
    } }
    return { error, isLoading, mutate, form, pending, saveError, readonly, set, submit, isEditing, startEdit, cancelEdit, data };
}
