import { ChevronLeft } from 'lucide-react';
import { useState, useEffect, FormEvent } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import useSWR from 'swr';
import { useInventoryApi } from '../application/repository-context';
import { Category, Group, Product } from '../domain/models';
import { setNotice, useAppDispatch } from '../../security/auth/application/session';
import { ErrorBox } from '../../../shared/presentation/index';

export function ProductForm() {
  const { id } = useParams<{ id?: string }>();
  const isEditing = !!id;
  const api = useInventoryApi();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const { data: products, mutate: mutateList } = useSWR<Product[]>(api.listProductsKey());
  const { data: categories } = useSWR<Category[]>(api.listCategoriesKey());
  const { data: groups } = useSWR<Group[]>(api.listGroupsKey());

  const existingProduct = products?.find(p => p.id === Number(id));

  const [nombre, setNombre] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [idCategoria, setIdCategoria] = useState<number | string>('');
  const [precioVenta, setPrecioVenta] = useState<number | string>('20.00');
  const [precioCompra, setPrecioCompra] = useState<number | string>('18.00');
  const [iva, setIva] = useState<number | string>('13.00');
  const [stock, setStock] = useState<number | string>('5000');
  const [stockMinimo, setStockMinimo] = useState<number | string>('500');
  const [descuento, setDescuento] = useState<number | string>('0.00');
  const [urlImage, setUrlImage] = useState('');
  const [estaActivo, setEstaActivo] = useState(true);
  const [selectedGroups, setSelectedGroups] = useState<number[]>([]);

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<unknown>(null);

  useEffect(() => {
    if (categories && categories.length > 0 && !idCategoria) {
      setIdCategoria(categories[0].id);
    }
  }, [categories, idCategoria]);

  useEffect(() => {
    if (existingProduct) {
      setNombre(existingProduct.nombre);
      setDescripcion(existingProduct.descripcion || '');
      setIdCategoria(existingProduct.idCategoria);
      setPrecioVenta(existingProduct.precioVenta);
      setPrecioCompra(existingProduct.precioCompra);
      setIva(existingProduct.iva);
      setStock(existingProduct.stock);
      setStockMinimo(existingProduct.stockMinimo);
      setDescuento(existingProduct.descuento);
      setUrlImage(existingProduct.urlImage || '');
      setEstaActivo(existingProduct.estaActivo);
      setSelectedGroups(existingProduct.grupos || []);
    }
  }, [existingProduct]);

  const toggleGroup = (gid: number) => {
    setSelectedGroups(prev =>
      prev.includes(gid) ? prev.filter(g => g !== gid) : [...prev, gid]
    );
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!nombre.trim()) {
      alert('Por favor ingrese el nombre del producto');
      return;
    }
    if (!idCategoria) {
      alert('Por favor seleccione una categoría');
      return;
    }

    try {
      setPending(true);
      setError(null);

      const payload = {
        nombre: nombre.trim(),
        descripcion: descripcion.trim(),
        idCategoria: Number(idCategoria),
        precioVenta: Number(precioVenta),
        precioCompra: Number(precioCompra),
        iva: Number(iva),
        stock: Number(stock),
        stockMinimo: Number(stockMinimo),
        descuento: Number(descuento),
        urlImage: urlImage.trim(),
        estaActivo,
        grupos: selectedGroups,
      };

      if (isEditing) {
        await api.updateProduct(Number(id), payload);
        dispatch(setNotice('Producto modificado exitosamente.'));
      } else {
        await api.createProduct(payload);
        dispatch(setNotice('Producto registrado exitosamente.'));
      }

      await mutateList();
      navigate('/productos');
    } catch (err) {
      setError(err);
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Top Bar */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            onClick={() => navigate('/productos')}
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
            {isEditing ? 'Modificar Producto' : 'Crear Producto'}
          </h1>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <button
            type="button"
            onClick={() => navigate('/productos')}
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
            {pending ? 'Guardando...' : 'Guardar Producto'}
          </button>
        </div>
      </div>

      <ErrorBox error={error} />

      {/* 2-Column Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '24px' }}>
        {/* Left Column: Información General y Precios */}
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
              Detalles del Producto
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Ingrese la información básica del producto
            </p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Nombre del Producto
            </label>
            <input
              type="text"
              required
              placeholder="Ej. Gasolina Especial"
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
              Categoría
            </label>
            <select
              value={idCategoria}
              onChange={e => setIdCategoria(Number(e.target.value))}
              style={{
                padding: '9px 12px',
                borderRadius: '8px',
                border: '1px solid #cbd5e1',
                fontSize: '14px',
                width: '100%',
                background: '#ffffff',
              }}
            >
              {(categories || []).map(cat => (
                <option key={cat.id} value={cat.id}>
                  {cat.nombre}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
              Descripción
            </label>
            <textarea
              rows={3}
              placeholder="Descripción del producto..."
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
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Precio de Venta (Bs.)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                required
                value={precioVenta}
                onChange={e => setPrecioVenta(e.target.value)}
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
                Precio de Compra (Bs.)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={precioCompra}
                onChange={e => setPrecioCompra(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                IVA (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={iva}
                onChange={e => setIva(e.target.value)}
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
                Descuento (%)
              </label>
              <input
                type="number"
                step="0.01"
                min={0}
                max={100}
                value={descuento}
                onChange={e => setDescuento(e.target.value)}
                style={{
                  padding: '9px 12px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '14px',
                  width: '100%',
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column: Inventario, Grupos y Estado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Card: Stock */}
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
                Inventario y Stock
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                  Stock Disponible
                </label>
                <input
                  type="number"
                  min={0}
                  value={stock}
                  onChange={e => setStock(e.target.value)}
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
                  Stock Mínimo
                </label>
                <input
                  type="number"
                  min={0}
                  value={stockMinimo}
                  onChange={e => setStockMinimo(e.target.value)}
                  style={{
                    padding: '9px 12px',
                    borderRadius: '8px',
                    border: '1px solid #cbd5e1',
                    fontSize: '14px',
                    width: '100%',
                  }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, color: '#334155' }}>
                Estado del Producto
              </label>
              <select
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

          {/* Card: Grupos */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '12px',
              border: '1px solid #e2e8f0',
              padding: '24px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', fontWeight: 700, color: '#0f172a' }}>
                Grupos Asociados
              </h2>
              <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                Seleccione los grupos a los que pertenece el producto
              </p>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {(groups || []).length === 0 ? (
                <span style={{ fontSize: '13px', color: '#94a3b8' }}>No hay grupos registrados</span>
              ) : (
                (groups || []).map(g => (
                  <label
                    key={g.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '10px',
                      fontSize: '13px',
                      cursor: 'pointer',
                      padding: '6px 8px',
                      borderRadius: '6px',
                      background: selectedGroups.includes(g.id) ? '#f1f5f9' : 'transparent',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedGroups.includes(g.id)}
                      onChange={() => toggleGroup(g.id)}
                    />
                    <span style={{ fontWeight: 500, color: '#1e293b' }}>{g.nombre}</span>
                    {g.descripcion && <span style={{ fontSize: '12px', color: '#64748b' }}>({g.descripcion})</span>}
                  </label>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
