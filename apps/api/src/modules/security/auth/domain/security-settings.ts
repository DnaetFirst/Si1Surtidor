export abstract class SecuritySettings {
    abstract readonly csrfSecret: string;
    abstract readonly allowedOrigins: string[];
}
