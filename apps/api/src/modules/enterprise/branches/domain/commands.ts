export interface CreateBranchCommand { nombre: string; direccion: string; telefono: string; correo: string; }
export type UpdateBranchCommand = Partial<CreateBranchCommand>;
