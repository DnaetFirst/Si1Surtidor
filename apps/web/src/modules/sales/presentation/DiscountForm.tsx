import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranchOptions } from '../../enterprise/branches/application/use-branches';
import { useSalesApi } from '../application/repository-context';
import { Discount } from '../domain/models';

export function DiscountForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const api = useSalesApi();
  const { data: branchesData } = useBranchOptions();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [nombre, setNombre] = useState('');
  const [tipo, setTipo] = useState<'PORCENTAJE' | 'MONTO_FIJO'>('PORCENTAJE');
  const [valor, setValor] = useState<number | ''>(10);
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [idSucursal, setIdSucursal] = useState<number | ''>('');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data: existing, isLoading } = useSWR<Discount>(
    isEditing ? `/descuentos/${id}` : null,
    () => api.getDiscount(Number(id))
  );

  useEffect(() => {
    if (existing) {
      setNombre(existing.nombre);
      setTipo(existing.tipo);
      setValor(existing.valor);
      setDescripcion(existing.descripcion || '');
      setActivo(existing.activo);
      setFechaInicio(existing.fechaInicio || '');
      setFechaFin(existing.fechaFin || '');
      setIdSucursal(existing.idSucursal || '');
    }
  }, [existing]);

  if (isEditing && isLoading) return <Loading />;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await api.updateDiscount(Number(id), {
          nombre: nombre.trim(),
          tipo,
          valor: Number(valor),
          descripcion: descripcion.trim(),
          activo,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
          idSucursal: idSucursal ? Number(idSucursal) : undefined,
        });
        dispatch(setNotice('Descuento actualizado exitosamente.'));
      } else {
        await api.createDiscount({
          nombre: nombre.trim(),
          tipo,
          valor: Number(valor),
          descripcion: descripcion.trim(),
          activo,
          fechaInicio: fechaInicio || null,
          fechaFin: fechaFin || null,
          idSucursal: idSucursal ? Number(idSucursal) : undefined,
        });
        dispatch(setNotice('Descuento registrado exitosamente.'));
      }
      navigate('/ventas/descuentos');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title={isEditing ? 'Actualizar Descuento' : 'Crear Descuento'}
        back="/ventas/descuentos"
        saving={saving}
        saveLabel={isEditing ? 'Editar Descuento' : 'Guardar Descuento'}
      />
      <ErrorBox error={error} />

      <div className="responsive-split-2-1">
        {/* Left column: Detalles del descuento */}
        <Card title="Detalles del descuento" subtitle="Ingrese los detalles del descuento">
          <fieldset className="stack" disabled={saving}>
            <div className="responsive-inline-2">
              <Field label="Nombre">
                <input
                  required
                  maxLength={100}
                  value={nombre}
                  onChange={e => setNombre(e.target.value)}
                  placeholder="Ej. Dia del trabajador, Fidelidad"
                />
              </Field>

              <Field label="Tipo">
                <select
                  value={tipo}
                  onChange={e => setTipo(e.target.value as 'PORCENTAJE' | 'MONTO_FIJO')}
                >
                  <option value="PORCENTAJE">porcentual</option>
                  <option value="MONTO_FIJO">monto fijo</option>
                </select>
              </Field>
            </div>

            <div className="responsive-inline-2">
              <Field label={tipo === 'PORCENTAJE' ? 'Porcentaje (%)' : 'Monto Fijo (Bs.)'}>
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={tipo === 'PORCENTAJE' ? 100 : undefined}
                  value={valor}
                  onChange={e => setValor(e.target.value === '' ? '' : Number(e.target.value))}
                />
              </Field>

              <Field label="Cantidad de descuentos / Límite (Opcional)">
                <input
                  type="number"
                  min="1"
                  placeholder="Sin límite"
                />
              </Field>
            </div>

            <div className="responsive-inline-2">
              <Field label="Fecha de inicio (Opcional)">
                <input
                  type="date"
                  value={fechaInicio}
                  onChange={e => setFechaInicio(e.target.value)}
                />
              </Field>

              <Field label="Fecha de fin (Opcional)">
                <input
                  type="date"
                  value={fechaFin}
                  onChange={e => setFechaFin(e.target.value)}
                />
              </Field>
            </div>

            <Field label="Descripción">
              <textarea
                rows={4}
                value={descripcion}
                onChange={e => setDescripcion(e.target.value)}
                placeholder="Descuento por el día del trabajador en todos los productos"
              />
            </Field>
          </fieldset>
        </Card>

        {/* Right column: Estado del producto + Sucursal */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Card title="Estado del producto" subtitle="Estado">
            <Field label="Estado">
              <select
                value={activo ? 'true' : 'false'}
                onChange={e => setActivo(e.target.value === 'true')}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </Field>
          </Card>

          <Card title="Sucursal" subtitle="Seleccione la sucursal del producto">
            <Field label="Sucursal">
              <select
                value={idSucursal}
                onChange={e => setIdSucursal(e.target.value === '' ? '' : Number(e.target.value))}
              >
                <option value="">Todas las sucursales</option>
                {(branchesData || []).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>
          </Card>
        </div>
      </div>
    </form>
  );
}

export const UIDescuentoForm = DiscountForm;
export const IUDescuentoForm = DiscountForm;
