import { send } from '../../../../shared/infrastructure/http';
import { CompanyApi } from '../domain/repository';
import { Company } from '../domain/models';
export const companyApi: CompanyApi = {
    detailKey: () => '/empresa',
    save: (data: Company | null | undefined, form: Company) => send<Company>('/empresa', data ? 'PATCH' : 'POST', {
        nombre: form.nombre.trim(), correo: form.correo.trim(), telefono: form.telefono,
        direccion: form.direccion, nombrePropietario: form.nombrePropietario,
        fechaCreacion: form.fechaCreacion, logoUrl: form.logoUrl, nit: form.nit,
    })
};
