import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
function derive(password: string, salt: string): Promise<Buffer> {
    return new Promise((resolve, reject) => scryptCallback(password, salt, 64, { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 }, (error, key) => error ? reject(error) : resolve(key)));
}
export async function hashPassword(password: string): Promise<string> {
    const salt = randomBytes(16).toString('hex');
    return `scrypt$${salt}$${(await derive(password, salt)).toString('hex')}`;
}
export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    const [kind, salt, digest] = hash.split('$');
    if (kind !== 'scrypt' || !salt || !digest)
        return false;
    const expected = Buffer.from(digest, 'hex');
    const result = await derive(password, salt);
    return expected.length === result.length && timingSafeEqual(expected, result);
}
export function validPassword(password: string): boolean {
    return password.length >= 8 && password.length <= 128 && /[A-Z]/.test(password) &&
        /[a-z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9\s]/.test(password);
}
