import { send } from '../../../../shared/infrastructure/http';
import { AuthApi } from '../domain/repository';
import { SessionUser } from '../domain/models';
export const authApi: AuthApi = {
    login: (correo: string, contrasena: string) => send<{
        user: SessionUser;
    }>('/auth/login', 'POST', { correo: correo.trim(), contrasena })
};
