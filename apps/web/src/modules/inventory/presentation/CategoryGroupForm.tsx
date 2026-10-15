import { ChevronLeft, Fuel, UploadCloud } from 'lucide-react';
import { useState, FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInventoryApi } from '../application/repository-context';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { ErrorBox } from '../../../shared/presentation/index';

export function CategoryGroupForm() {
  const api = useInventoryApi();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [activeTab, setActiveTab] = useState<'categoria' | 'grupo'>('categoria');
  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [imagenUrl, setImagenUrl] = useState('');
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert(`Por favor ingrese el nombre de la ${activeTab === 'categoria' ? 'categoría' : 'grupo'}`);
      return;
    }

    try {
      setPending(true);
      setError(null);

      if (activeTab === 'categoria') {
        await api.createCategory({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          imagenUrl: imagenUrl.trim(),
          activo: true,
        });
        dispatch(setNotice('Categoría registrada exitosamente.'));
      } else {
        await api.createGroup({
          nombre: nombre.trim(),
          descripcion: descripcion.trim(),
          activo: true,
        });
        dispatch(setNotice('Grupo registrado exitosamente.'));
      }

      navigate('/productos/categorias-grupos');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Header: Tabs on Left, Save Button on Right */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <button
            type="button"
            onClick={() => navigate('/productos/categorias-grupos')}
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

          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: '#0f172a' }}>
            {activeTab === 'categoria' ? 'Crear Categoria' : 'Crear Grupo'}
          </h1>

          <div role="tablist" style={{ display: 'inline-flex', background: '#f1f5f9', padding: '4px', borderRadius: '10px', gap: '4px' }}>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'categoria'}
              onClick={() => { setActiveTab('categoria'); setError(null); }}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                background: activeTab === 'categoria' ? '#ffffff' : 'transparent',
                color: activeTab === 'categoria' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'categoria' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Categoria
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'grupo'}
              onClick={() => { setActiveTab('grupo'); setError(null); }}
              style={{
                padding: '8px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '14px',
                background: activeTab === 'grupo' ? '#ffffff' : 'transparent',
                color: activeTab === 'grupo' ? '#0f172a' : '#64748b',
                boxShadow: activeTab === 'grupo' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                transition: 'all 0.15s ease',
              }}
            >
              Grupo
            </button>
          </div>
        </div>

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
          {pending
            ? 'Guardando...'
            : activeTab === 'categoria'
            ? 'Guardar Categoria'
            : 'Guardar Grupo'}
        </button>
      </div>

      <ErrorBox error={error} />

      {/* 2-Column Layout matching PDF Page 63 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Información de la categoría / grupo */}
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
              {activeTab === 'categoria' ? 'Categoria' : 'Grupo'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {activeTab === 'categoria' ? 'Información de la categoria' : 'Información del grupo'}
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Nombre
            </label>
            <input
              type="text"
              required
              placeholder={activeTab === 'categoria' ? 'Ej. Combustibles' : 'Ej. Líquidos'}
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
              rows={5}
              placeholder={activeTab === 'categoria' ? 'Descripción detallada de la categoría' : 'Descripción detallada del grupo'}
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
        </div>

        {/* Right Column: Imagen de la categoría / grupo */}
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
              {activeTab === 'categoria' ? 'Imagen de la categoria' : 'Imagen del grupo'}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              {activeTab === 'categoria' ? 'Agrega una imagen para la categoria' : 'Agrega una imagen representativa para el grupo'}
            </p>
          </div>

          {/* Visual Dropzone / Illustration Box matching Page 63 mockup with gas pump FUEL */}
          <div
            style={{
              border: '2px dashed #cbd5e1',
              borderRadius: '12px',
              padding: '30px 20px',
              textAlign: 'center',
              background: '#f8fafc',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '12px',
            }}
          >
            {/* SVG Gas Dispenser Illustration */}
            <div
              style={{
                width: '90px',
                height: '90px',
                borderRadius: '16px',
                background: '#fee2e2',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                boxShadow: '0 2px 8px rgba(220,38,38,0.15)',
              }}
            >
              <Fuel size={42} color="#dc2626" />
              <span style={{ fontSize: '10px', fontWeight: 800, color: '#b91c1c', letterSpacing: '1px', marginTop: '2px' }}>
                FUEL
              </span>
            </div>

            <div style={{ marginTop: '8px' }}>
              <label
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  background: '#ffffff',
                  fontSize: '13px',
                  fontWeight: 600,
                  color: '#334155',
                  cursor: 'pointer',
                }}
              >
                <UploadCloud size={16} />
                <span>Seleccionar Imagen</span>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={e => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onload = ev => setImagenUrl((ev.target?.result as string) || '');
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </label>
            </div>

            <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>
              PNG, JPG o WebP hasta 2MB
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '12px', fontWeight: 500, color: '#64748b' }}>
              O ingrese URL directa de imagen
            </label>
            <input
              type="url"
              placeholder="https://ejemplo.com/imagen.png"
              value={imagenUrl}
              onChange={e => setImagenUrl(e.target.value)}
              style={{
                padding: '8px 12px',
                borderRadius: '6px',
                border: '1px solid #cbd5e1',
                fontSize: '13px',
                width: '100%',
              }}
            />
          </div>

          {imagenUrl && (
            <div style={{ marginTop: '8px', textAlign: 'center' }}>
              <img
                src={imagenUrl}
                alt="Vista previa"
                style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', objectFit: 'contain' }}
                onError={() => setError('La URL de la imagen no es válida.')}
              />
            </div>
          )}
        </div>
      </div>
    </form>
  );
}
