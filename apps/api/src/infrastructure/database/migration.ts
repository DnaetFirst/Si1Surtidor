import { MigrationInterface,QueryRunner } from 'typeorm';

export class CycleOne1700000000000 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE empresa (
        id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1), nombre varchar(100) NOT NULL,
        telefono varchar(30) NOT NULL, direccion varchar(255), correo varchar(100) NOT NULL,
        nombre_propietario varchar(100) NOT NULL, fecha_creacion date NOT NULL,
        logo_url varchar(2048), nit varchar(20) NOT NULL UNIQUE,
        created_at timestamptz NOT NULL DEFAULT now(), updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE TABLE sucursal (
        id serial PRIMARY KEY, nombre varchar(100) NOT NULL, direccion varchar(255),
        telefono varchar(30), correo varchar(100), activo boolean NOT NULL DEFAULT true,
        id_empresa integer NOT NULL REFERENCES empresa(id)
      );
      CREATE TABLE rol (
        id serial PRIMARY KEY, codigo varchar(64) NOT NULL UNIQUE, nombre varchar(100) NOT NULL,
        activo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX rol_nombre_unique ON rol(lower(nombre));
      CREATE TABLE permiso (
        id serial PRIMARY KEY, codigo varchar(100) NOT NULL UNIQUE, nombre varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '', modulo varchar(32) NOT NULL,
        accion varchar(32) NOT NULL, reservado boolean NOT NULL DEFAULT false,
        activo boolean NOT NULL DEFAULT true, created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(modulo,accion)
      );
      CREATE UNIQUE INDEX permiso_nombre_unique ON permiso(lower(nombre));
      CREATE TABLE permiso_rol (
        id_rol integer NOT NULL REFERENCES rol(id), id_permiso integer NOT NULL REFERENCES permiso(id),
        PRIMARY KEY(id_rol,id_permiso)
      );
      CREATE TABLE usuario (
        ci varchar(20) PRIMARY KEY, nombre varchar(100) NOT NULL, correo varchar(100) NOT NULL,
        telefono varchar(30) NOT NULL, cargo varchar(100), sexo varchar(30) NOT NULL,
        domicilio varchar(255) NOT NULL, password_hash varchar(255) NOT NULL,
        id_rol integer NOT NULL REFERENCES rol(id), id_sucursal integer REFERENCES sucursal(id),
        activo boolean NOT NULL DEFAULT true, intentos_fallidos integer NOT NULL DEFAULT 0,
        bloqueado_hasta timestamptz, created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX usuario_correo_unique ON usuario(lower(correo));
      CREATE INDEX usuario_rol_idx ON usuario(id_rol);
      CREATE TABLE sesion (
        id uuid PRIMARY KEY, ci_usuario varchar(20) NOT NULL REFERENCES usuario(ci),
        refresh_hash varchar(64) NOT NULL, expires_at timestamptz NOT NULL,
        revoked_at timestamptz, created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX sesion_usuario_idx ON sesion(ci_usuario);
      CREATE TABLE bitacora (
        id bigserial PRIMARY KEY, usuario_ci varchar(20) REFERENCES usuario(ci),
        usuario_nombre varchar(100), identidad varchar(100), accion varchar(100) NOT NULL,
        resultado varchar(40) NOT NULL, fecha timestamptz NOT NULL DEFAULT now(),
        ip text, endpoint text, entidad varchar(100), archivado_at timestamptz
      );
      CREATE INDEX bitacora_fecha_idx ON bitacora(fecha DESC);
      CREATE INDEX bitacora_actor_idx ON bitacora(usuario_ci,fecha DESC);
      CREATE INDEX bitacora_archivo_idx ON bitacora(archivado_at,fecha DESC);
      CREATE FUNCTION proteger_bitacora() RETURNS trigger LANGUAGE plpgsql AS $$
      BEGIN
        IF TG_OP = 'DELETE' THEN RAISE EXCEPTION 'La bitácora no permite eliminar eventos'; END IF;
        IF (to_jsonb(NEW) - 'archivado_at') IS DISTINCT FROM (to_jsonb(OLD) - 'archivado_at') THEN
          RAISE EXCEPTION 'El contenido de la bitácora es inmutable';
        END IF;
        IF OLD.archivado_at IS NOT NULL AND NEW.archivado_at IS DISTINCT FROM OLD.archivado_at THEN
          RAISE EXCEPTION 'El archivo de un evento es permanente';
        END IF;
        RETURN NEW;
      END $$;
      CREATE TRIGGER bitacora_inmutable BEFORE UPDATE OR DELETE ON bitacora
        FOR EACH ROW EXECUTE FUNCTION proteger_bitacora();
    `);
  }

  public async down(): Promise<void> {
    throw new Error('La reversión destructiva requiere restaurar una copia de seguridad explícitamente.');
  }
}

export class PasswordReset1700000000001 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      CREATE TABLE password_reset_token (
        token_hash varchar(64) PRIMARY KEY,
        ci_usuario varchar(20) NOT NULL REFERENCES usuario(ci) ON DELETE CASCADE,
        expires_at timestamptz NOT NULL,
        used_at timestamptz,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX password_reset_token_user_idx ON password_reset_token(ci_usuario);
      CREATE INDEX password_reset_token_expiry_idx ON password_reset_token(expires_at);
    `);
  }
  public async down(): Promise<void> {
    throw new Error('La reversión destructiva requiere restaurar una copia de seguridad explícitamente.');
  }
}

export class CycleTwo1700000000002 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      -- CU8: Categorías
      CREATE TABLE categoria (
        id serial PRIMARY KEY,
        nombre varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '',
        imagen_url text NOT NULL DEFAULT '',
        activo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX categoria_nombre_unique ON categoria(lower(nombre));

      -- CU8: Grupos
      CREATE TABLE grupo (
        id serial PRIMARY KEY,
        nombre varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '',
        activo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX grupo_nombre_unique ON grupo(lower(nombre));

      -- CU6: Combustible
      CREATE TABLE combustible (
        id serial PRIMARY KEY,
        tipo varchar(50) NOT NULL,
        octanaje integer NOT NULL,
        nombre varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '',
        esta_activo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX combustible_nombre_unique ON combustible(lower(nombre));

      -- CU5: Productos
      CREATE TABLE producto (
        id serial PRIMARY KEY,
        nombre varchar(100) NOT NULL,
        stock integer NOT NULL DEFAULT 0,
        stock_minimo integer NOT NULL DEFAULT 0,
        descripcion varchar(255) NOT NULL DEFAULT '',
        precio_venta numeric(12,2) NOT NULL DEFAULT 0.00,
        precio_compra numeric(12,2) NOT NULL DEFAULT 0.00,
        iva numeric(5,2) NOT NULL DEFAULT 0.00,
        url_image text NOT NULL DEFAULT '',
        esta_activo boolean NOT NULL DEFAULT true,
        descuento numeric(5,2) NOT NULL DEFAULT 0.00,
        id_categoria integer NOT NULL REFERENCES categoria(id),
        id_sucursal integer REFERENCES sucursal(id),
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX producto_categoria_idx ON producto(id_categoria);
      CREATE INDEX producto_sucursal_idx ON producto(id_sucursal);
      CREATE INDEX producto_nombre_idx ON producto(lower(nombre));

      -- Relación N:M grupo_producto
      CREATE TABLE grupo_producto (
        id_grupo integer NOT NULL REFERENCES grupo(id) ON DELETE CASCADE,
        id_producto integer NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
        PRIMARY KEY (id_grupo, id_producto)
      );
      CREATE INDEX grupo_producto_producto_idx ON grupo_producto(id_producto);

      -- CU20: Módulos del Sistema
      CREATE TABLE modulo_sistema (
        id serial PRIMARY KEY,
        codigo varchar(50) NOT NULL,
        nombre varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '',
        activo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX modulo_sistema_codigo_unique ON modulo_sistema(lower(codigo));
    `);
  }

  public async down(): Promise<void> {
    throw new Error('La reversión destructiva requiere restaurar una copia de seguridad explícitamente.');
  }
}

export class CycleThree1700000000004 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      -- CU13: Proveedor
      CREATE TABLE IF NOT EXISTS proveedor (
        id serial PRIMARY KEY,
        nombre varchar(150) NOT NULL,
        razon_social varchar(150),
        nit varchar(20) NOT NULL,
        contacto varchar(100) NOT NULL DEFAULT '',
        telefono varchar(30) NOT NULL DEFAULT '',
        correo varchar(100) NOT NULL DEFAULT '',
        direccion varchar(255) NOT NULL DEFAULT '',
        detalle varchar(255) NOT NULL DEFAULT '',
        activo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE UNIQUE INDEX IF NOT EXISTS proveedor_nit_unique ON proveedor(lower(nit));
      CREATE INDEX IF NOT EXISTS proveedor_nombre_idx ON proveedor(lower(nombre));

      -- Proveedor ↔ Producto (Precios pactados)
      CREATE TABLE IF NOT EXISTS proveedor_producto (
        id serial PRIMARY KEY,
        detalle varchar(255) NOT NULL DEFAULT '',
        ultimo_precio numeric(12,2) NOT NULL DEFAULT 0.00,
        id_proveedor integer NOT NULL REFERENCES proveedor(id) ON DELETE CASCADE,
        id_producto integer NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
        activo boolean NOT NULL DEFAULT true,
        created_at timestamptz NOT NULL DEFAULT now(),
        UNIQUE(id_proveedor, id_producto)
      );
      CREATE INDEX IF NOT EXISTS pp_proveedor_idx ON proveedor_producto(id_proveedor);
      CREATE INDEX IF NOT EXISTS pp_producto_idx ON proveedor_producto(id_producto);

      -- CU7: Dispensador
      CREATE TABLE IF NOT EXISTS dispensador (
        id serial PRIMARY KEY,
        ubicacion varchar(100) NOT NULL,
        capacidad_maxima integer NOT NULL DEFAULT 0,
        esta_activo boolean NOT NULL DEFAULT true,
        estado varchar(20) NOT NULL DEFAULT 'Activo',
        id_sucursal integer NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS dispensador_sucursal_idx ON dispensador(id_sucursal);

      -- Mangueras del dispensador
      CREATE TABLE IF NOT EXISTS manguera (
        id serial PRIMARY KEY,
        nombre varchar(100) NOT NULL DEFAULT 'Manguera',
        numero integer,
        lado varchar(10),
        color varchar(30),
        esta_activo boolean NOT NULL DEFAULT true,
        estado varchar(20) NOT NULL DEFAULT 'Activo',
        id_dispensador integer NOT NULL REFERENCES dispensador(id) ON DELETE CASCADE,
        id_combustible integer NOT NULL REFERENCES combustible(id) ON DELETE RESTRICT
      );
      CREATE INDEX IF NOT EXISTS manguera_dispensador_idx ON manguera(id_dispensador);
      ALTER TABLE IF EXISTS manguera ADD COLUMN IF NOT EXISTS numero integer;
      ALTER TABLE IF EXISTS manguera ADD COLUMN IF NOT EXISTS lado varchar(10);
      ALTER TABLE IF EXISTS manguera ADD COLUMN IF NOT EXISTS color varchar(30);

      -- CU9: Órdenes de Compra
      CREATE TABLE IF NOT EXISTS orden_compra (
        id serial PRIMARY KEY,
        codigo varchar(50) NOT NULL UNIQUE,
        cantidad integer NOT NULL DEFAULT 0,
        fecha date NOT NULL DEFAULT CURRENT_DATE,
        hora time NOT NULL DEFAULT CURRENT_TIME,
        motivo varchar(255) NOT NULL DEFAULT '',
        estado varchar(20) NOT NULL DEFAULT 'PENDIENTE' CHECK (estado IN ('PENDIENTE','APROBADA','RECIBIDA','ANULADA')),
        id_proveedor integer REFERENCES proveedor(id) ON DELETE SET NULL,
        id_sucursal integer NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
        ci_usuario varchar(20) NOT NULL REFERENCES usuario(ci) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS orden_compra_sucursal_idx ON orden_compra(id_sucursal);
      CREATE INDEX IF NOT EXISTS orden_compra_estado_idx ON orden_compra(estado);

      -- Detalle Orden de Compra
      CREATE TABLE IF NOT EXISTS detalle_orden_compra (
        id serial PRIMARY KEY,
        cantidad numeric(12,2) NOT NULL DEFAULT 0.00,
        id_producto integer NOT NULL REFERENCES producto(id) ON DELETE CASCADE,
        id_orden_compra integer NOT NULL REFERENCES orden_compra(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS detalle_orden_compra_orden_idx ON detalle_orden_compra(id_orden_compra);

      -- CU10: Notas de Compra (Recepción)
      CREATE TABLE IF NOT EXISTS nota_compra (
        id serial PRIMARY KEY,
        codigo varchar(50) NOT NULL UNIQUE,
        motivo varchar(255) NOT NULL DEFAULT '',
        monto_total numeric(14,2) NOT NULL DEFAULT 0.00,
        moneda varchar(10) NOT NULL DEFAULT 'BOB',
        fecha date NOT NULL DEFAULT CURRENT_DATE,
        hora time NOT NULL DEFAULT CURRENT_TIME,
        id_proveedor integer REFERENCES proveedor(id) ON DELETE SET NULL,
        id_sucursal integer REFERENCES sucursal(id) ON DELETE CASCADE,
        id_orden integer REFERENCES orden_compra(id) ON DELETE SET NULL,
        ci_usuario varchar(20) NOT NULL REFERENCES usuario(ci) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS nota_compra_sucursal_idx ON nota_compra(id_sucursal);

      -- Lotes de inventario
      CREATE TABLE IF NOT EXISTS lote (
        id serial PRIMARY KEY,
        codigo varchar(50) NOT NULL,
        fecha_vencimiento date,
        detalle varchar(255) NOT NULL DEFAULT '',
        stock numeric(12,2) NOT NULL DEFAULT 0.00,
        stock_inicial numeric(12,2) NOT NULL DEFAULT 0.00,
        esta_activo boolean NOT NULL DEFAULT true,
        id_producto integer REFERENCES producto(id) ON DELETE CASCADE,
        id_proveedor_producto integer REFERENCES proveedor_producto(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS lote_producto_idx ON lote(id_producto);

      -- Detalle de Compra
      CREATE TABLE IF NOT EXISTS detalle_compra (
        id serial PRIMARY KEY,
        cantidad numeric(12,2) NOT NULL DEFAULT 0.00,
        precio numeric(12,2) NOT NULL DEFAULT 0.00,
        subtotal numeric(14,2) NOT NULL DEFAULT 0.00,
        id_nota_compra integer NOT NULL REFERENCES nota_compra(id) ON DELETE CASCADE,
        id_lote integer REFERENCES lote(id) ON DELETE SET NULL,
        id_producto integer REFERENCES producto(id) ON DELETE CASCADE
      );
      CREATE INDEX IF NOT EXISTS detalle_compra_nota_idx ON detalle_compra(id_nota_compra);

      -- CU12: Descuentos
      CREATE TABLE IF NOT EXISTS descuento (
        id serial PRIMARY KEY,
        nombre varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '',
        tipo varchar(20) NOT NULL CHECK (tipo IN ('PORCENTAJE','MONTO_FIJO','Porcentaje','Fijo')),
        valor numeric(10,2) NOT NULL DEFAULT 0.00,
        monto numeric(10,2) NOT NULL DEFAULT 0.00,
        porcentaje numeric(5,2) NOT NULL DEFAULT 0.00,
        activo boolean NOT NULL DEFAULT true,
        esta_activo boolean NOT NULL DEFAULT true,
        id_sucursal integer REFERENCES sucursal(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now(),
        updated_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS descuento_sucursal_idx ON descuento(id_sucursal);

      -- Cliente (para ventas y fidelización)
      CREATE TABLE IF NOT EXISTS cliente (
        id serial PRIMARY KEY,
        nombre varchar(100) NOT NULL,
        nit varchar(20) NOT NULL,
        placa varchar(20) NOT NULL,
        cantidad_mensual_vendida integer NOT NULL DEFAULT 0,
        ultima_fecha date,
        id_sucursal integer REFERENCES sucursal(id) ON DELETE CASCADE,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS cliente_nit_idx ON cliente(nit);
      CREATE INDEX IF NOT EXISTS cliente_placa_idx ON cliente(placa);

      -- CU11: Notas de Venta
      CREATE TABLE IF NOT EXISTS nota_venta (
        id serial PRIMARY KEY,
        codigo varchar(50) NOT NULL UNIQUE,
        nombre_cliente varchar(100) NOT NULL DEFAULT 'Sin Nombre',
        nit varchar(20) NOT NULL DEFAULT '0',
        placa varchar(20) NOT NULL DEFAULT '',
        metodo_pago varchar(30) NOT NULL DEFAULT 'EFECTIVO',
        monto_pagado numeric(12,2) NOT NULL DEFAULT 0.00,
        monto_por_cobrar numeric(12,2) NOT NULL DEFAULT 0.00,
        monto_cambio numeric(12,2) NOT NULL DEFAULT 0.00,
        fecha date NOT NULL DEFAULT CURRENT_DATE,
        hora time NOT NULL DEFAULT CURRENT_TIME,
        estado_b_sisa boolean NOT NULL DEFAULT true,
        ci_usuario varchar(20) NOT NULL REFERENCES usuario(ci) ON DELETE CASCADE,
        id_dispensador integer REFERENCES dispensador(id) ON DELETE SET NULL,
        id_sucursal integer NOT NULL REFERENCES sucursal(id) ON DELETE CASCADE,
        id_cliente integer REFERENCES cliente(id) ON DELETE SET NULL,
        created_at timestamptz NOT NULL DEFAULT now()
      );
      CREATE INDEX IF NOT EXISTS nota_venta_sucursal_idx ON nota_venta(id_sucursal);
      CREATE INDEX IF NOT EXISTS nota_venta_fecha_idx ON nota_venta(fecha DESC);

      -- Detalle de Venta
      CREATE TABLE IF NOT EXISTS detalle_venta (
        id serial PRIMARY KEY,
        cantidad numeric(10,3) NOT NULL DEFAULT 0.000,
        precio numeric(12,2) NOT NULL DEFAULT 0.00,
        subtotal numeric(14,2) NOT NULL DEFAULT 0.00,
        id_nota_venta integer NOT NULL REFERENCES nota_venta(id) ON DELETE CASCADE,
        id_manguera integer REFERENCES manguera(id) ON DELETE SET NULL,
        id_producto integer REFERENCES producto(id) ON DELETE SET NULL,
        id_descuento integer REFERENCES descuento(id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS detalle_venta_nota_idx ON detalle_venta(id_nota_venta);

      -- CU18: Notificaciones de Stock
      CREATE TABLE IF NOT EXISTS notificacion_producto (
        id serial PRIMARY KEY,
        titulo varchar(100) NOT NULL,
        descripcion varchar(255) NOT NULL DEFAULT '',
        fecha timestamptz NOT NULL DEFAULT now(),
        resuelta boolean NOT NULL DEFAULT false,
        id_producto integer NOT NULL REFERENCES producto(id) ON DELETE CASCADE
      );
      CREATE TABLE IF NOT EXISTS usuario_notificacion (
        id serial PRIMARY KEY,
        visto boolean NOT NULL DEFAULT false,
        recordar boolean NOT NULL DEFAULT false,
        ci_usuario varchar(20) NOT NULL REFERENCES usuario(ci) ON DELETE CASCADE,
        id_notificacion integer NOT NULL REFERENCES notificacion_producto(id) ON DELETE CASCADE
      );

      -- CU19: Salidas de Productos
      CREATE TABLE IF NOT EXISTS salida_producto (
        id serial PRIMARY KEY,
        motivo varchar(255) NOT NULL,
        cantidad numeric(10,2) NOT NULL DEFAULT 0.00,
        fecha timestamptz NOT NULL DEFAULT now(),
        id_lote integer REFERENCES lote(id) ON DELETE SET NULL,
        id_producto integer REFERENCES producto(id) ON DELETE CASCADE,
        id_nota_venta integer REFERENCES nota_venta(id) ON DELETE SET NULL,
        ci_usuario varchar(20) REFERENCES usuario(ci) ON DELETE SET NULL,
        id_sucursal integer REFERENCES sucursal(id) ON DELETE SET NULL
      );
      ALTER TABLE IF EXISTS salida_producto ALTER COLUMN ci_usuario DROP NOT NULL;
      ALTER TABLE IF EXISTS salida_producto ALTER COLUMN id_sucursal DROP NOT NULL;

      -- Triggers de actualización de existencias y alertas
      CREATE OR REPLACE FUNCTION actualizar_stock_venta() RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.id_producto IS NOT NULL THEN
          UPDATE producto SET stock = stock - NEW.cantidad WHERE id = NEW.id_producto;
        END IF;
        RETURN NEW;
      END $$;

      DROP TRIGGER IF EXISTS trg_actualizar_stock_venta ON detalle_venta;
      CREATE TRIGGER trg_actualizar_stock_venta AFTER INSERT ON detalle_venta
        FOR EACH ROW EXECUTE FUNCTION actualizar_stock_venta();

      CREATE OR REPLACE FUNCTION actualizar_stock_compra() RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.id_producto IS NOT NULL THEN
          UPDATE producto SET stock = stock + NEW.cantidad WHERE id = NEW.id_producto;
        END IF;
        RETURN NEW;
      END $$;

      DROP TRIGGER IF EXISTS trg_actualizar_stock_compra ON detalle_compra;
      CREATE TRIGGER trg_actualizar_stock_compra AFTER INSERT ON detalle_compra
        FOR EACH ROW EXECUTE FUNCTION actualizar_stock_compra();

      CREATE OR REPLACE FUNCTION verificar_stock_minimo() RETURNS TRIGGER LANGUAGE plpgsql AS $$
      BEGIN
        IF NEW.stock <= NEW.stock_minimo THEN
          INSERT INTO notificacion_producto(titulo, descripcion, id_producto)
          VALUES ('Stock bajo', 'El producto ' || NEW.nombre || ' ha alcanzado el stock mínimo (' || NEW.stock_minimo || ').', NEW.id);
        END IF;
        RETURN NEW;
      END $$;

      DROP TRIGGER IF EXISTS trg_verificar_stock_minimo ON producto;
      CREATE TRIGGER trg_verificar_stock_minimo AFTER UPDATE OF stock ON producto
        FOR EACH ROW EXECUTE FUNCTION verificar_stock_minimo();

      -- Permisos para Ciclo 3
      INSERT INTO permiso(codigo, nombre, descripcion, modulo, accion, reservado) VALUES
        ('proveedores.gestionar', 'Gestionar proveedores', 'Acceso completo a proveedores', 'proveedores', 'gestionar', false),
        ('proveedores.ver', 'Ver proveedores', 'Consultar lista y detalle de proveedores', 'proveedores', 'ver', false),
        ('proveedores.crear', 'Crear proveedor', 'Registrar nuevo proveedor', 'proveedores', 'crear', false),
        ('proveedores.editar', 'Editar proveedor', 'Modificar datos de proveedor', 'proveedores', 'editar', false),
        ('proveedores.deshabilitar', 'Deshabilitar proveedor', 'Dar de baja proveedor', 'proveedores', 'deshabilitar', false),

        ('dispensadores.gestionar', 'Gestionar dispensadores', 'Acceso completo a dispensadores', 'dispensadores', 'gestionar', false),
        ('dispensadores.ver', 'Ver dispensadores', 'Consultar dispensadores y mangueras', 'dispensadores', 'ver', false),
        ('dispensadores.crear', 'Crear dispensador', 'Registrar dispensador o manguera', 'dispensadores', 'crear', false),
        ('dispensadores.editar', 'Editar dispensador', 'Modificar dispensador o manguera', 'dispensadores', 'editar', false),
        ('dispensadores.deshabilitar', 'Deshabilitar dispensador', 'Desactivar dispensador', 'dispensadores', 'deshabilitar', false),

        ('descuentos.gestionar', 'Gestionar descuentos', 'Acceso completo a descuentos', 'descuentos', 'gestionar', false),
        ('descuentos.ver', 'Ver descuentos', 'Consultar descuentos', 'descuentos', 'ver', false),
        ('descuentos.crear', 'Crear descuento', 'Registrar nuevo descuento', 'descuentos', 'crear', false),
        ('descuentos.editar', 'Editar descuento', 'Modificar o activar/desactivar descuento', 'descuentos', 'editar', false),

        ('ordenes.gestionar', 'Gestionar órdenes de compra', 'Acceso completo a órdenes de compra', 'ordenes', 'gestionar', false),
        ('ordenes.ver', 'Ver órdenes de compra', 'Consultar órdenes de compra', 'ordenes', 'ver', false),
        ('ordenes.crear', 'Crear orden de compra', 'Registrar orden de compra', 'ordenes', 'crear', false),
        ('ordenes.editar', 'Editar orden de compra', 'Modificar o anular orden de compra', 'ordenes', 'editar', false),

        ('compras.gestionar', 'Gestionar compras', 'Acceso completo a notas de compra', 'compras', 'gestionar', false),
        ('compras.ver', 'Ver compras', 'Consultar notas de compra', 'compras', 'ver', false),
        ('compras.crear', 'Crear compra', 'Registrar recepción y notas de compra', 'compras', 'crear', false),

        ('ventas.gestionar', 'Gestionar ventas', 'Acceso completo a ventas', 'ventas', 'gestionar', false),
        ('ventas.ver', 'Ver ventas', 'Consultar notas de venta', 'ventas', 'ver', false),
        ('ventas.crear', 'Registrar venta', 'Registrar ventas de combustible y productos', 'ventas', 'crear', false),

        ('salidas.gestionar', 'Gestionar salidas', 'Acceso a salidas de productos', 'salidas', 'gestionar', false),
        ('salidas.ver', 'Ver salidas', 'Consultar salidas de inventario', 'salidas', 'ver', false),
        ('salidas.crear', 'Crear salida', 'Registrar salidas manuales de inventario', 'salidas', 'crear', false),

        ('notificaciones.gestionar', 'Gestionar notificaciones', 'Acceso a alertas de stock', 'notificaciones', 'gestionar', false),
        ('notificaciones.ver', 'Ver notificaciones', 'Consultar notificaciones de stock', 'notificaciones', 'ver', false)
      ON CONFLICT (codigo) DO NOTHING;

      -- Asignar permisos nuevos a roles correspondientes (ATI, GS, GG, E)
      INSERT INTO permiso_rol(id_rol, id_permiso)
      SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
      WHERE r.codigo IN ('ASU', 'ATI')
        AND p.modulo IN ('proveedores', 'dispensadores', 'descuentos', 'ordenes', 'compras', 'ventas', 'salidas', 'notificaciones')
      ON CONFLICT DO NOTHING;

      INSERT INTO permiso_rol(id_rol, id_permiso)
      SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
      WHERE r.codigo IN ('GS', 'GG')
        AND p.modulo IN ('proveedores', 'dispensadores', 'descuentos', 'ordenes', 'compras', 'ventas', 'salidas', 'notificaciones')
      ON CONFLICT DO NOTHING;

      INSERT INTO permiso_rol(id_rol, id_permiso)
      SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
      WHERE r.codigo = 'E'
        AND p.codigo IN ('ventas.ver', 'ventas.crear')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(): Promise<void> {
    throw new Error('La reversión destructiva requiere restaurar una copia de seguridad explícitamente.');
  }
}

export class CycleThreePatch1700000000005 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      ALTER TABLE IF EXISTS manguera ADD COLUMN IF NOT EXISTS numero integer;
      ALTER TABLE IF EXISTS manguera ADD COLUMN IF NOT EXISTS lado varchar(10);
      ALTER TABLE IF EXISTS manguera ADD COLUMN IF NOT EXISTS color varchar(30);
      ALTER TABLE IF EXISTS salida_producto ALTER COLUMN ci_usuario DROP NOT NULL;
      ALTER TABLE IF EXISTS salida_producto ALTER COLUMN id_sucursal DROP NOT NULL;
      ALTER TABLE IF EXISTS orden_compra DROP CONSTRAINT IF EXISTS orden_compra_estado_check;
      ALTER TABLE IF EXISTS orden_compra ADD CONSTRAINT orden_compra_estado_check CHECK (estado IN ('PENDIENTE', 'APROBADA', 'RECIBIDA', 'ANULADA'));
    `);
  }

  public async down(): Promise<void> {
    throw new Error('La reversión destructiva requiere restaurar una copia de seguridad explícitamente.');
  }
}

export class CycleThreeFourAlignment1700000000006 implements MigrationInterface {
  public async up(runner: QueryRunner): Promise<void> {
    await runner.query(`
      -- CU11: Estado de nota_venta para anulación trazable con restitución de stock
      ALTER TABLE IF EXISTS nota_venta ADD COLUMN IF NOT EXISTS estado varchar(20) NOT NULL DEFAULT 'EMITIDA';

      -- CU10: Estado de nota_compra para corrección/anulación trazable
      ALTER TABLE IF EXISTS nota_compra ADD COLUMN IF NOT EXISTS estado varchar(20) NOT NULL DEFAULT 'COMPLETADA';

      -- CU19: Campos de análisis de SalidaProducto (estado, documentoOrigen, referenciaReversion)
      ALTER TABLE IF EXISTS salida_producto ADD COLUMN IF NOT EXISTS estado varchar(20) NOT NULL DEFAULT 'CONFIRMADA';
      ALTER TABLE IF EXISTS salida_producto ADD COLUMN IF NOT EXISTS documento_origen varchar(100);
      ALTER TABLE IF EXISTS salida_producto ADD COLUMN IF NOT EXISTS referencia_reversion integer REFERENCES salida_producto(id) ON DELETE SET NULL;

      -- CU12: Vigencia temporal de descuentos (fechaInicio, fechaFin)
      ALTER TABLE IF EXISTS descuento ADD COLUMN IF NOT EXISTS fecha_inicio date;
      ALTER TABLE IF EXISTS descuento ADD COLUMN IF NOT EXISTS fecha_fin date;

      -- Permisos completos del catálogo cerrado para Ciclos 3 y 4
      INSERT INTO permiso(codigo, nombre, descripcion, modulo, accion, reservado) VALUES
        ('descuentos.deshabilitar', 'Deshabilitar descuentos', 'Activar, desactivar o dar de baja descuentos', 'descuentos', 'deshabilitar', false),
        ('ordenes.deshabilitar', 'Cancelar órdenes de compra', 'Cancelar o anular órdenes de compra pendientes', 'ordenes', 'deshabilitar', false),
        ('compras.editar', 'Editar compras', 'Modificar glosa o borrador de notas de compra', 'compras', 'editar', false),
        ('compras.deshabilitar', 'Anular compras', 'Anular notas de compra mediante reversión trazable', 'compras', 'deshabilitar', false),
        ('ventas.editar', 'Editar ventas', 'Modificar notas de venta en borrador', 'ventas', 'editar', false),
        ('ventas.deshabilitar', 'Anular ventas', 'Anular notas de venta confirmadas restituyendo stock', 'ventas', 'deshabilitar', false),
        ('salidas.editar', 'Editar salidas de productos', 'Modificar registros de salida antes de confirmar', 'salidas', 'editar', false),
        ('salidas.deshabilitar', 'Revertir salidas de productos', 'Revertir salidas confirmadas restituyendo stock', 'salidas', 'deshabilitar', false),
        ('notificaciones.crear', 'Crear notificaciones', 'Registrar alertas de inventario', 'notificaciones', 'crear', false),
        ('notificaciones.editar', 'Actualizar notificaciones', 'Marcar o resolver notificaciones', 'notificaciones', 'editar', false),
        ('notificaciones.deshabilitar', 'Deshabilitar notificaciones', 'Descartar o cerrar notificaciones', 'notificaciones', 'deshabilitar', false),
        ('reportes.gestionar', 'Gestionar reportes', 'Acceso completo a reportes y estadísticas', 'reportes', 'gestionar', false),
        ('reportes.ver', 'Consultar reportes', 'Consultar reportes operativos', 'reportes', 'ver', false),
        ('reportes.exportar', 'Exportar reportes CSV', 'Exportar reportes en formato CSV', 'reportes', 'exportar', false)
      ON CONFLICT (codigo) DO NOTHING;

      INSERT INTO permiso_rol(id_rol, id_permiso)
      SELECT r.id, p.id FROM rol r CROSS JOIN permiso p
      WHERE r.codigo IN ('ASU', 'ATI', 'GS', 'GG')
        AND p.modulo IN ('proveedores', 'dispensadores', 'descuentos', 'ordenes', 'compras', 'ventas', 'salidas', 'notificaciones', 'reportes')
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(): Promise<void> {
    throw new Error('La reversión destructiva requiere restaurar una copia de seguridad explícitamente.');
  }
}
