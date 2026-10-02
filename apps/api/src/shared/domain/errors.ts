export class DomainError extends Error {
    constructor(public readonly statusCode: number, message: string) { super(message); this.name = new.target.name; }
}
export class BadRequestException extends DomainError {
    constructor(message: string) { super(400, message); }
}
export class ConflictException extends DomainError {
    constructor(message: string) { super(409, message); }
}
export class ForbiddenException extends DomainError {
    constructor(message: string) { super(403, message); }
}
export class NotFoundException extends DomainError {
    constructor(message: string) { super(404, message); }
}
export class UnauthorizedException extends DomainError {
    constructor(message: string) { super(401, message); }
}
