import { PlusCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { allowed } from '../../../security/auth/application/session';
import { useBranches, useBranchForm } from '../application/use-branches';
import { Card, FormTop, PageHeading } from '../../../../shared/presentation/layout';
import { Empty, ErrorBox, Loading, Status } from '../../../../shared/presentation/feedback';
import { Field, SearchInput } from '../../../../shared/presentation/forms';
import { Pagination, RowMenu } from '../../../../shared/presentation/table';
import { Confirm } from '../../../../shared/presentation/dialogs';

export function Branches() {
    const state = useBranches();
    const { user, data, error, isLoading, mutate, q, setQ, active, setActive, page, setPage, target, setTarget } = state;
    return <div>
        <PageHeading title="Sucursales" subtitle="Administre las sucursales de su empresa">
            {data?.empresa && allowed(user, 'sucursales', 'crear') && (
                <Link className="button primary" style={{ background: '#0f172a', color: '#ffffff', border: 'none', borderRadius: '8px' }} to="/empresa/sucursales/crear">
                    <PlusCircle size={16}/>Agregar Sucursal
                </Link>
            )}
        </PageHeading>

        <ErrorBox error={error} retry={() => void mutate()}/>
        {isLoading ? <Loading/> : data && <>
            {!data.empresa ? <Card><Empty title="Registre primero la empresa" text="Las sucursales deben pertenecer a una empresa. Solicite su registro al administrador."/>{allowed(user, 'empresa', 'crear') && <Link className="button" to="/empresa">Registrar empresa</Link>}</Card> : <Card title={data.empresa.nombre}>
                <div className="table-toolbar">
                    <SearchInput value={q} onChange={setQ} placeholder="Buscar sucursales…"/>
                    <label className="select-filter"><span>Estado</span><select value={active} onChange={event => setActive(event.target.value)}><option value="true">Activas</option><option value="false">Deshabilitadas</option><option value="all">Todas</option></select></label>
                </div>
                <div className="table-scroll"><table><thead><tr><th>Nombre</th><th>Dirección</th><th>Teléfono</th><th>Correo electrónico</th><th>Estado</th><th><span className="sr-only">Acciones</span></th></tr></thead>
                    <tbody>{data.items.map(branch => <tr key={branch.id}>
                        <td>{branch.nombre}</td><td>{branch.direccion || '—'}</td><td>{branch.telefono || '—'}</td><td>{branch.correo || '—'}</td><td><Status active={branch.activo}/></td>
                        <td className="menu-cell"><RowMenu label={branch.nombre}>
                            <Link to={'/empresa/sucursales/' + branch.id}>Ver sucursal</Link>
                            {allowed(user, 'sucursales', 'editar') && <Link to={'/empresa/sucursales/' + branch.id + '/editar'}>Editar sucursal</Link>}
                            {branch.activo && allowed(user, 'sucursales', 'deshabilitar') && <button onClick={() => setTarget(branch)}>Deshabilitar</button>}
                        </RowMenu></td>
                    </tr>)}</tbody>
                </table></div>
                {!data.items.length && <Empty title="No hay sucursales" text="Registre una sucursal o cambie los filtros de búsqueda."/>}
                <Pagination page={page} pageSize={10} total={data.total} onChange={setPage}/>
            </Card>}
        </>}
        {target && <Confirm title="Deshabilitar sucursal" description={`¿Deseas deshabilitar «${target.nombre}»? Se conservarán sus datos, usuarios y productos. No estará disponible para nuevas asignaciones.`} action={state.disable} onSuccess={state.refresh} onClose={() => setTarget(null)}/>}
    </div>;
}

export function BranchForm({ readonly: forceReadonly = false }: { readonly?: boolean }) {
    const { id, user, detail, catalog, form, setForm, pending, error, readonly, submit } = useBranchForm(forceReadonly);
    if (detail.isLoading || catalog.isLoading) return <Loading/>;
    if (detail.error || catalog.error) return <ErrorBox error={detail.error || catalog.error} retry={() => { void detail.mutate(); void catalog.mutate(); }}/>;
    if (!id && readonly) return <Card><Empty title="Acceso restringido" text="No tiene permiso para registrar sucursales."/></Card>;
    if (!catalog.data?.empresa) return <Card><Empty title="Registre primero la empresa" text="Solicite el registro de la empresa antes de crear una sucursal."/>{allowed(user, 'empresa', 'crear') && <Link className="button" to="/empresa">Registrar empresa</Link>}</Card>;
    return <form onSubmit={submit}>
        <FormTop title={id ? readonly ? 'Detalle de la sucursal' : 'Editar sucursal' : 'Crear sucursal'} back="/empresa/sucursales" saving={pending} readonly={readonly} saveLabel="Guardar sucursal"/>
        <ErrorBox error={error}/>
        <Card title="Datos de la sucursal" subtitle={catalog.data.empresa.nombre}>
            {detail.data && <p>Estado: <Status active={detail.data.activo}/></p>}
            <fieldset className="stack" disabled={readonly || pending}>
                <Field label="Nombre"><input required maxLength={100} value={form.nombre} onChange={event => setForm({ ...form, nombre: event.target.value })}/></Field>
                <Field label="Dirección"><input required maxLength={255} value={form.direccion} onChange={event => setForm({ ...form, direccion: event.target.value })}/></Field>
                <Field label="Teléfono"><input required type="tel" minLength={6} maxLength={30} value={form.telefono} onChange={event => setForm({ ...form, telefono: event.target.value })}/></Field>
                <Field label="Correo electrónico"><input required type="email" maxLength={100} value={form.correo} onChange={event => setForm({ ...form, correo: event.target.value })}/></Field>
            </fieldset>
        </Card>
    </form>;
}
