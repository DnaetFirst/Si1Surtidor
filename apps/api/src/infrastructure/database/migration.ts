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
