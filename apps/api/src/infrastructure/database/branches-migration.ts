import { MigrationInterface, QueryRunner } from 'typeorm';
export class BranchManagement1700000000003 implements MigrationInterface {
    async up(runner: QueryRunner): Promise<void> {
        await runner.query(`INSERT INTO permiso(codigo,nombre,descripcion,modulo,accion,reservado)
          VALUES('sucursales.gestionar','Gestionar sucursales','Registrar, consultar, modificar y deshabilitar sucursales.','sucursales','gestionar',false)
          ON CONFLICT(codigo) DO NOTHING`);
        await runner.query(`INSERT INTO permiso_rol(id_rol,id_permiso)
          SELECT r.id,p.id FROM rol r CROSS JOIN permiso p
          WHERE r.codigo IN ('ATI','GG','GS') AND p.codigo='sucursales.gestionar' ON CONFLICT DO NOTHING`);
    }
    async down(): Promise<void> { throw new Error('La reversión requiere restaurar una copia de seguridad.'); }
}
