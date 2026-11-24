import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { usePurchasesApi } from '../application/repository-context';
import { Provider } from '../domain/models';

export function ProviderForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const api = usePurchasesApi();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [form, setForm] = useState<Partial<Provider>>({
    nombre: '',
    razonSocial: '',
    nit: '',
    contacto: '',
    telefono: '',
    correo: '',
    direccion: '',
    detalle: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data: existing, isLoading } = useSWR<Provider>(
    isEditing ? `/proveedores/${id}` : null,
    () => api.getProvider(Number(id))
  );

  useEffect(() => {
    if (existing) {
      setForm({
        nombre: existing.nombre,
        razonSocial: existing.razonSocial || '',
        nit: existing.nit,
        contacto: existing.contacto || '',
        telefono: existing.telefono || '',
        correo: existing.correo || '',
        direccion: existing.direccion || '',
        detalle: existing.detalle || '',
      });
    }
  }, [existing]);

  if (isEditing && isLoading) return <Loading />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await api.updateProvider(Number(id), form);
        dispatch(setNotice('Proveedor actualizado exitosamente.'));
      } else {
        await api.createProvider(form);
        dispatch(setNotice('Proveedor registrado exitosamente.'));
      }
      navigate('/compras/proveedores');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title={isEditing ? 'Editar Proveedor' : 'Agregar Proveedor'}
        back="/compras/proveedores"
        saving={saving}
        saveLabel={isEditing ? 'Guardar Cambios' : 'Registrar Proveedor'}
      />
      <ErrorBox error={error} />

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        <Card title="Datos del Proveedor" subtitle="Ingrese los datos requeridos para registrar o modificar un proveedor.">
          <fieldset className="stack" disabled={saving}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Nombre Comercial">
                <input
                  required
                  maxLength={150}
                  value={form.nombre}
                  onChange={e => setForm({ ...form, nombre: e.target.value })}
                  placeholder="Ej. YPFB, Coca Cola, etc."
                />
              </Field>
              <Field label="Razón Social (Opcional)">
                <input
                  maxLength={150}
                  value={form.razonSocial || ''}
                  onChange={e => setForm({ ...form, razonSocial: e.target.value })}
                  placeholder="Razón social formal"
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="NIT / Identificación">
                <input
                  required
                  maxLength={20}
                  value={form.nit}
                  onChange={e => setForm({ ...form, nit: e.target.value })}
                  placeholder="123456789"
                />
              </Field>
              <Field label="Contacto / Responsable">
                <input
                  maxLength={100}
                  value={form.contacto}
                  onChange={e => setForm({ ...form, contacto: e.target.value })}
                  placeholder="Nombre de la persona de contacto"
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <Field label="Teléfono">
                <input
                  required
                  type="tel"
                  maxLength={30}
                  value={form.telefono}
                  onChange={e => setForm({ ...form, telefono: e.target.value })}
                  placeholder="Ej. 71890090"
                />
              </Field>
              <Field label="Correo Electrónico">
                <input
                  type="email"
                  maxLength={100}
                  value={form.correo}
                  onChange={e => setForm({ ...form, correo: e.target.value })}
                  placeholder="proveedor@gmail.com"
                />
              </Field>
            </div>

            <Field label="Dirección">
              <input
                maxLength={255}
                value={form.direccion}
                onChange={e => setForm({ ...form, direccion: e.target.value })}
                placeholder="Av. Principal, Zona Industrial..."
              />
            </Field>

            <Field label="Detalle u Observación">
              <textarea
                rows={3}
                value={form.detalle}
                onChange={e => setForm({ ...form, detalle: e.target.value })}
                placeholder="Notas adicionales sobre condiciones comerciales o abastecimiento"
              />
            </Field>
          </fieldset>
        </Card>

        <div>
          <Card title="Estado Comercial" subtitle="Parámetros de actividad">
            <p style={{ fontSize: '0.9rem', color: 'var(--muted)' }}>
              Al registrar un proveedor, este quedará disponible inmediatamente para vincular productos pactados y generar órdenes de abastecimiento.
            </p>
          </Card>
        </div>
      </div>
    </form>
  );
}

export const UIProveedorForm = ProviderForm;
export const IUProveedorForm = ProviderForm;
