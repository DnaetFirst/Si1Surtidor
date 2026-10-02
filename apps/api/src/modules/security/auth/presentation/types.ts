import { Request } from 'express';
import { SessionUser } from '../../../../shared/domain/context';
export { SessionUser };
export interface AuthRequest extends Request {
    user: SessionUser;
    sessionId: string;
}
