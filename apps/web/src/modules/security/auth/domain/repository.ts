import { SessionUser } from './models';
export interface AuthApi {
    login(correo: string, contrasena: string): Promise<{
        user: SessionUser;
    }>;
    requestPasswordReset(correo: string): Promise<void>;
    resetPassword(token: string, contrasena: string): Promise<void>;
}
