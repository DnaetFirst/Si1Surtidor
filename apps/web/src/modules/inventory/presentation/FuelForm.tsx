import { ChevronLeft } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { useInventoryApi } from '../application/repository-context';
import { Fuel } from '../domain/models';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { ErrorBox } from '../../../shared/presentation/index';

export function FuelForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const api = useInventoryApi();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: fuels, mutate: mutateList } = useSWR<Fuel[]>(api.listFuelsKey());
  const existingFuel = fuels?.find(f => f.id === Number(id));

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [octanaje, setOctanaje] = useState<number | string>(95);
  const [tipo, setTipo] = useState('gasolina');
  const [estaActivo, setEstaActivo] = useState(true);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (existingFuel) {
      setNombre(existingFuel.nombre);
      setDescripcion(existingFuel.descripcion || '');
      setOctanaje(existingFuel.octanaje);
      setTipo(existingFuel.tipo || 'gasolina');
      setEstaActivo(existingFuel.estaActivo);
    }
  }, [existingFuel]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingrese el nombre del combustible');
      return;
    }

    try {
      setPending(true);
      setError(null);

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        octanaje: Number(octanaje),
        tipo: tipo.trim().toLowerCase(),
        estaActivo,
      };

      if (isEditing) {
        await api.updateFuel(Number(id), payload);
        dispatch(setNotice('Combustible modificado exitosamente.'));
      } else {
        await api.createFuel(payload);
        dispatch(setNotice('Combustible registrado exitosamente.'));
      }

      await mutateList();
      navigate('/productos/combustibles');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar with Back title and action buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/productos/combustibles')}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '32px',
              height: '32px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              cursor: 'pointer',
              color: '#334155',
            }}
            aria-label="Volver"
          >
            <ChevronLeft size={18} />
          </button>
          <h1 style={{ margin: 0, fontSize: '20px', fontWeight: 700, color: '#0f172a' }}>
            {isEditing ? 'Modificar Combustible' : 'Crear Combustible'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/productos/combustibles')}
            disabled={pending}
            style={{
              padding: '8px 18px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              background: '#ffffff',
              color: '#334155',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            Descartar
          </button>

          <button
            type="submit"
            disabled={pending}
            style={{
              padding: '8px 20px',
              borderRadius: '8px',
              border: 'none',
              background: '#0f172a',
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            }}
          >
            {pending ? 'Guardando...' : 'Guardar Combustible'}
          </button>
        </div>
      </div>

      <ErrorBox error={error} />

      {/* 2-Column Layout matching PDF Page 61 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Detalles del Combustible */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '12px',
            border: '1px solid #e2e8f0',
            padding: '24px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
            display: 'flex',
            flexDirection: 'column',
            gap: '16px',
          }}
        >
          <div>
            <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
              Detalles del Combustibe
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Ingrese los detalles del combustible
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="fuel-nombre" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Nombre
            </label>
            <input
              id="fuel-nombre"
              type="text"
              required
              placeholder="Ej. Gasolina Regular"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                width: '100%',
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label htmlFor="fuel-descripcion" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Descripción
            </label>
            <textarea
              id="fuel-descripcion"
              rows={4}
              placeholder="Ej. Gasolina regular de 95 octanos"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                width: '100%',
                resize: 'vertical',
                fontFamily: 'inherit',
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="fuel-octanaje" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Octanaje
              </label>
              <input
                id="fuel-octanaje"
                type="number"
                required
                min={0}
                max={200}
                placeholder="95"
                value={octanaje}
                onChange={e => setOctanaje(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="fuel-tipo" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Tipo
              </label>
              <select
                id="fuel-tipo"
                value={tipo}
                onChange={e => setTipo(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  width: '100%',
                  background: '#ffffff',
                }}
              >
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="gnv">GNV</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Column: Estado del combustible */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '16px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Estado del combustible
              </h2>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label htmlFor="fuel-status" style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Estado
              </label>
              <select
                id="fuel-status"
                value={estaActivo ? 'true' : 'false'}
                onChange={e => setEstaActivo(e.target.value === 'true')}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  width: '100%',
                  background: '#ffffff',
                }}
              >
                <option value="true">Activo</option>
                <option value="false">Inactivo</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
