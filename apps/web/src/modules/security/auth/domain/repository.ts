import { SessionUser } from './models';
export interface AuthApi {
    login(correo: string, contrasena: string): Promise<{
        user: SessionUser;
    }>;
}
