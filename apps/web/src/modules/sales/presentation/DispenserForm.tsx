import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { Card, FormTop } from '../../../shared/presentation/layout';
import { ErrorBox, Loading } from '../../../shared/presentation/feedback';
import { Field } from '../../../shared/presentation/forms';
import { useBranchOptions } from '../../enterprise/branches/application/use-branches';
import { useInventoryApi } from '../../inventory/application/repository-context';
import { Fuel } from '../../inventory/domain/models';
import { useSalesApi } from '../application/repository-context';
import { Dispenser } from '../domain/models';

export function DispenserForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = Boolean(id);
  const api = useSalesApi();
  const inventoryApi = useInventoryApi();
  const { data: branchesData } = useBranchOptions();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  const [ubicacion, setUbicacion] = useState('');
  const [capacidadMaxima, setCapacidadMaxima] = useState(100);
  const [estaActivo, setEstaActivo] = useState(true);
  const [idSucursal, setIdSucursal] = useState<number | ''>('');
  const [mangueras, setMangueras] = useState<{ id?: number; nombre: string; idCombustible: number }[]>([
    { nombre: 'Manguera 1', idCombustible: 0 },
  ]);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const { data: fuels } = useSWR<Fuel[]>(inventoryApi.listFuelsKey());
  const { data: existing, isLoading } = useSWR<Dispenser>(
    isEditing ? `/dispensadores/${id}` : null,
    () => api.getDispenser(Number(id))
  );

  useEffect(() => {
    if (existing) {
      setUbicacion(existing.ubicacion);
      setCapacidadMaxima(existing.capacidadMaxima);
      setEstaActivo(existing.estaActivo);
      setIdSucursal(existing.idSucursal);
      if (existing.mangueras?.length) {
        setMangueras(
          existing.mangueras.map(m => ({
            id: m.id,
            nombre: m.nombre,
            idCombustible: m.idCombustible,
          }))
        );
      }
    }
  }, [existing]);

  useEffect(() => {
    if (!isEditing && branchesData?.length && (!idSucursal || !branchesData.some(b => b.id === Number(idSucursal)))) {
      setIdSucursal(branchesData[0].id);
    }
  }, [isEditing, branchesData, idSucursal]);

  if (isEditing && isLoading) return <Loading />;

  const handleAddHose = () => {
    setMangueras([
      ...mangueras,
      { nombre: `Manguera ${mangueras.length + 1}`, idCombustible: fuels?.[0]?.id || 0 },
    ]);
  };

  const handleRemoveHose = async (index: number) => {
    const item = mangueras[index];
    if (item.id && isEditing) {
      if (!window.confirm('¿Desea eliminar esta manguera del dispensador?')) return;
      try {
        await api.deleteHose(Number(id), item.id);
      } catch (err: any) {
        alert(err?.message || 'Error al eliminar manguera');
        return;
      }
    }
    setMangueras(mangueras.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!idSucursal) {
      alert('Seleccione una sucursal.');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing) {
        await api.updateDispenser(Number(id), {
          ubicacion: ubicacion.trim(),
          capacidadMaxima: Number(capacidadMaxima),
          estaActivo,
          idSucursal: Number(idSucursal),
        });
        // create new hoses if added
        for (const m of mangueras) {
          if (!m.id && m.idCombustible > 0) {
            await api.createHose(Number(id), {
              nombre: m.nombre,
              idCombustible: m.idCombustible,
            });
          }
        }
        dispatch(setNotice('Dispensador actualizado exitosamente.'));
      } else {
        const created = await api.createDispenser({
          ubicacion: ubicacion.trim(),
          capacidadMaxima: Number(capacidadMaxima),
          idSucursal: Number(idSucursal),
        });
        // Create initial hoses
        for (const m of mangueras) {
          if (m.idCombustible > 0) {
            await api.createHose(created.id, {
              nombre: m.nombre,
              idCombustible: m.idCombustible,
            });
          }
        }
        dispatch(setNotice('Dispensador registrado exitosamente.'));
      }
      navigate('/ventas/dispensadores');
    } catch (err) {
      setError(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <FormTop
        title={isEditing ? 'Editar Dispensador' : 'Agregar Dispensador'}
        back="/ventas/dispensadores"
        saving={saving}
        saveLabel={isEditing ? 'Guardar Cambios' : 'Registrar Dispensador'}
      />
      <ErrorBox error={error} />

      <div className="responsive-split">
        <Card title="Datos del Dispensador" subtitle="Identificación física y ubicación en pista">
          <fieldset className="stack" disabled={saving}>
            <Field label="Ubicación o Identificador *">
              <input
                required
                maxLength={100}
                value={ubicacion}
                onChange={e => setUbicacion(e.target.value)}
                placeholder="Ej. Pista 1, Bomba A, Av. Sucre"
              />
            </Field>

            <Field label="Capacidad Máxima (Litros)">
              <input
                required
                type="number"
                min="0"
                value={capacidadMaxima}
                onChange={e => setCapacidadMaxima(Number(e.target.value))}
              />
            </Field>

            <Field label="Sucursal *">
              <select
                required
                value={idSucursal}
                onChange={e => setIdSucursal(e.target.value === '' ? '' : Number(e.target.value))}
              >
                {!(branchesData || []).length && <option value="">Cargando sucursales...</option>}
                {(branchesData || []).map(b => (
                  <option key={b.id} value={b.id}>
                    {b.nombre}
                  </option>
                ))}
              </select>
            </Field>

            {isEditing && (
              <Field label="Estado Operativo">
                <select
                  value={estaActivo ? 'true' : 'false'}
                  onChange={e => setEstaActivo(e.target.value === 'true')}
                >
                  <option value="true">Activo</option>
                  <option value="false">Inactivo / Fuera de servicio</option>
                </select>
              </Field>
            )}
          </fieldset>
        </Card>

        <Card title="Mangueras y Combustibles" subtitle="Configure las mangueras despachadoras de este equipo">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {mangueras.map((m, index) => (
              <div
                key={index}
                className="responsive-line-dispenser"
                style={{
                  padding: '8px',
                  background: '#f8fafc',
                  borderRadius: '8px',
                  border: '1px solid #e2e8f0',
                }}
              >
                <Field label="Nombre Manguera">
                  <input
                    value={m.nombre}
                    onChange={e => {
                      const updated = [...mangueras];
                      updated[index].nombre = e.target.value;
                      setMangueras(updated);
                    }}
                  />
                </Field>

                <Field label="Combustible Asignado">
                  <select
                    value={m.idCombustible}
                    onChange={e => {
                      const updated = [...mangueras];
                      updated[index].idCombustible = Number(e.target.value);
                      setMangueras(updated);
                    }}
                  >
                    <option value={0}>Seleccionar combustible...</option>
                    {(fuels || []).map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nombre} ({f.tipo} - {f.octanaje} Oct)
                      </option>
                    ))}
                  </select>
                </Field>

                <button
                  type="button"
                  className="button icon-button"
                  disabled={mangueras.length === 1}
                  onClick={() => handleRemoveHose(index)}
                  style={{ height: '38px', marginBottom: '4px' }}
                >
                  <Trash2 size={16} color="#ef4444" />
                </button>
              </div>
            ))}

            <button
              type="button"
              className="button"
              onClick={handleAddHose}
              style={{ alignSelf: 'flex-start', marginTop: '8px' }}
            >
              <Plus size={16} /> Añadir otra manguera
            </button>
          </div>
        </Card>
      </div>
    </form>
  );
}

export const UIDispensadorForm = DispenserForm;
export const IUDispensadorForm = DispenserForm;
