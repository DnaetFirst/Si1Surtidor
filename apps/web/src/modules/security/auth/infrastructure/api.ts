import { send } from '../../../../shared/infrastructure/http';
import { AuthApi } from '../domain/repository';
import { SessionUser } from '../domain/models';
export const authApi: AuthApi = {
    login: (correo: string, contrasena: string) => send<{
        user: SessionUser;
    }>('/auth/login', 'POST', { correo: correo.trim(), contrasena }),
    requestPasswordReset: (correo: string) => send<void>('/auth/password-reset/request', 'POST', { correo: correo.trim() }),
    resetPassword: (token: string, contrasena: string) => send<void>('/auth/password-reset/complete', 'POST', { token, contrasena })
};
