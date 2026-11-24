export abstract class PasswordResetMailer {
    abstract send(email: string, token: string, code?: string): Promise<void>;
}
