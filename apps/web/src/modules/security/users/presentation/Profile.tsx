import { useProfile } from '../application/use-profile';
import { Card, PageHeading } from '../../../../shared/presentation/layout';
import { Field, PasswordInput } from '../../../../shared/presentation/forms';
import { ErrorBox, Loading } from '../../../../shared/presentation/feedback';

export function Profile() {
    const { detail, form, set, pending, error, submit } = useProfile();
    if (detail.isLoading) return <Loading />;
    if (detail.error) return <ErrorBox error={detail.error} retry={() => void detail.mutate()} />;
    return <form onSubmit={submit}>
        <PageHeading title="Mi perfil" subtitle="Actualice sus datos personales y de acceso." />
        <ErrorBox error={error} />
        <Card title="Datos personales"><fieldset className="form-grid" disabled={pending}>
            <Field label="Nombre completo"><input required maxLength={100} value={form.nombre} onChange={set('nombre')} autoComplete="name" /></Field>
            <Field label="Correo electrónico"><input required type="email" maxLength={100} value={form.correo} onChange={set('correo')} autoComplete="email" /></Field>
            <Field label="Teléfono"><input required type="tel" maxLength={30} value={form.telefono} onChange={set('telefono')} autoComplete="tel" /></Field>
            <Field label="Rol"><input value={detail.data?.rol.nombre || ''} readOnly /></Field>
            <Field label="Domicilio" className="full-width"><textarea required maxLength={255} value={form.domicilio} onChange={set('domicilio')} autoComplete="street-address" /></Field>
        </fieldset></Card>
        <Card title="Cambiar contraseña" subtitle="Opcional. Al cambiarla se cerrarán todas sus sesiones y deberá volver a ingresar."><fieldset className="form-grid" disabled={pending}>
            <Field label="Contraseña actual"><PasswordInput required={!!form.contrasena} value={form.contrasenaActual} onChange={set('contrasenaActual')} autoComplete="current-password" maxLength={128} /></Field>
            <Field label="Nueva contraseña" hint="Mínimo 8 caracteres: mayúscula, minúscula, número y símbolo."><PasswordInput value={form.contrasena} onChange={set('contrasena')} autoComplete="new-password" minLength={8} maxLength={128} /></Field>
        </fieldset></Card>
        <div className="actions"><button className="button primary" disabled={pending}>{pending ? 'Guardando…' : 'Guardar perfil'}</button></div>
    </form>;
}
