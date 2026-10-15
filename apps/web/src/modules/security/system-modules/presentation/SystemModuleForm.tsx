import { ChevronLeft } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { useSystemModulesApi } from '../application/repository-context';
import { SystemModule } from '../domain/models';
import { setNotice, useAppDispatch } from '../../auth/application/session';
import { ErrorBox } from '../../../../shared/presentation/index';

export function SystemModuleForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const api = useSystemModulesApi();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: modules, mutate: mutateList } = useSWR<SystemModule[]>(api.listKey());
  const existingModule = modules?.find(m => m.id === Number(id));

  const [codigo, setCodigo] = useState('');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [activo, setActivo] = useState(true);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (existingModule) {
      setCodigo(existingModule.codigo);
      setNombre(existingModule.nombre);
      setDescripcion(existingModule.descripcion || '');
      setActivo(existingModule.activo);
    }
  }, [existingModule]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!codigo.trim() || !nombre.trim()) {
      alert('Por favor ingrese el código y nombre del módulo');
      return;
    }

    try {
      setPending(true);
      setError(null);

      const payload = {
        codigo: codigo.trim().toLowerCase(),
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        activo,
      };

      if (isEditing) {
        await api.update(Number(id), payload);
        dispatch(setNotice('Módulo del sistema modificado exitosamente.'));
      } else {
        await api.create(payload);
        dispatch(setNotice('Módulo del sistema registrado exitosamente.'));
      }

      await mutateList();
      navigate('/usuarios/modulos');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/usuarios/modulos')}
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
            {isEditing ? 'Modificar Módulo' : 'Crear Módulo'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/usuarios/modulos')}
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
            {pending ? 'Guardando...' : 'Guardar Módulo'}
          </button>
        </div>
      </div>

      <ErrorBox error={error} />

      <div
        style={{
          background: '#ffffff',
          borderRadius: '12px',
          border: '1px solid #e2e8f0',
          padding: '24px',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          maxWidth: '600px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Código Identificador
          </label>
          <input
            type="text"
            required
            placeholder="Ej. inventario"
            value={codigo}
            onChange={e => setCodigo(e.target.value)}
            disabled={isEditing}
            style={{
              padding: '9px 12px',
              borderRadius: '8px',
              border: '1px solid #cbd5e1',
              fontSize: '14px',
              width: '100%',
              background: isEditing ? '#f8fafc' : '#ffffff',
            }}
          />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Nombre del Módulo
          </label>
          <input
            type="text"
            required
            placeholder="Ej. Gestión de Inventario"
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
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Descripción
          </label>
          <textarea
            rows={4}
            placeholder="Descripción detallada de las funciones del módulo..."
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
            Estado
          </label>
          <select
            value={activo ? 'true' : 'false'}
            onChange={e => setActivo(e.target.value === 'true')}
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
    </form>
  );
}
