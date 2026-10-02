import { ArgumentsHost, Catch, ExceptionFilter, HttpException } from '@nestjs/common';
import { Response } from 'express';
import { DomainError } from '../domain/errors';
@Catch()
export class SafeExceptionFilter implements ExceptionFilter {
    catch(error: any, host: ArgumentsHost) {
        const response = host.switchToHttp().getResponse<Response>();
        if (error instanceof DomainError)
            return response.status(error.statusCode).json({ statusCode: error.statusCode, message: error.message });
        if (error instanceof HttpException) {
            const body = error.getResponse();
            return response.status(error.getStatus()).json(typeof body === 'string' ? { statusCode: error.getStatus(), message: body } : body);
        }
        const code = error?.driverError?.code ?? error?.code;
        if (code === '23505')
            return response.status(409).json({ statusCode: 409, message: 'Ya existe un registro con esos datos únicos.' });
        if (code === '23503')
            return response.status(409).json({ statusCode: 409, message: 'El registro está relacionado con otros datos o la referencia no existe.' });
        if (['22P02', '22007', '22008', '23514', '22001'].includes(code))
            return response.status(400).json({ statusCode: 400, message: 'Los datos enviados no son válidos.' });
        console.error('Error interno:', error?.name ?? 'Unknown', code ?? '');
        return response.status(500).json({ statusCode: 500, message: 'No se pudo completar la operación. Intenta nuevamente.' });
    }
}
