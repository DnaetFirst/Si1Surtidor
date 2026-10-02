import { useEffect, useState, type FormEvent } from 'react';
import useSWR from 'swr';
import { query } from '../../../../shared/domain/query';
import { useAuditApi } from './repository-context';
import { useAppDispatch, useSession } from '../../../security/auth/application/session';
import { PageData } from '../../../../shared/domain/pagination';
import { AuditEvent } from '../domain/models';
import { beginning, end, Filters, noFilters } from '../domain/form';
export function useAuditPage() {
    const auditApi = useAuditApi();
    const { user } = useSession();
    const dispatch = useAppDispatch();
    const [period, setPeriod] = useState('semana');
    const [archived, setArchived] = useState(false);
    const [filters, setFilters] = useState<Filters>(noFilters);
    const [draft, setDraft] = useState<Filters>(noFilters);
    const [showFilters, setShowFilters] = useState(false);
    const [showArchive, setShowArchive] = useState(false);
    const [page, setPage] = useState(1);
    const [exporting, setExporting] = useState(false);
    const [actionError, setActionError] = useState<unknown>();
    const params = query({ periodo: filters.desde || filters.hasta ? 'todo' : period, archivado: archived, usuario: filters.usuario, accion: filters.accion, desde: beginning(filters.desde), hasta: end(filters.hasta) });
    const { data, error, isLoading, mutate } = useSWR<PageData<AuditEvent>>(auditApi.listKey(params, page));
    useEffect(() => setPage(1), [params]);
    const exportCsv = async () => { setActionError(null); setExporting(true); try {
        await auditApi.exportCsv(params, archived);
    }
    catch (err) {
        setActionError(err);
    }
    finally {
        setExporting(false);
    } };
    const filtered = !!Object.values(filters).some(Boolean);
    return { user, dispatch, period, setPeriod, archived, setArchived, filters, setFilters, draft, setDraft, showFilters, setShowFilters, showArchive, setShowArchive, page, setPage, exporting, actionError, data, error, isLoading, mutate, exportCsv, filtered };
}
export function useArchiveDialog({ onClose, onSaved }: {
    onClose: () => void;
    onSaved: (message: string) => void;
}) {
    const auditApi = useAuditApi();
    const [desde, setDesde] = useState('');
    const [hasta, setHasta] = useState('');
    const [confirmed, setConfirmed] = useState(false);
    const [pending, setPending] = useState(false);
    const [error, setError] = useState<unknown>();
    async function submit(e: FormEvent) { e.preventDefault(); setPending(true); setError(null); try {
        const result = await auditApi.archive(desde, hasta);
        onSaved(result.mensaje || `${result.total} registros archivados.`);
        onClose();
    }
    catch (err) {
        setError(err);
    }
    finally {
        setPending(false);
    } }
    return { desde, setDesde, hasta, setHasta, confirmed, setConfirmed, pending, error, submit };
}
