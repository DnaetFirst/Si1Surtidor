export interface Branch {
    id: number;
    nombre: string;
}
export interface BranchFormData { nombre: string; direccion: string; telefono: string; correo: string; }
export interface BranchDetail extends Branch, BranchFormData { activo: boolean; empresaId: number; }
export interface BranchPage { items: BranchDetail[]; page: number; pageSize: number; total: number; empresa: { id: number; nombre: string } | null; }
