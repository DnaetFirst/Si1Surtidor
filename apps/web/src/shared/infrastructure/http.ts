const base = '/api';
let csrfToken = '';
let csrfRequest: Promise<void> | null = null;
let refreshRequest: Promise<void> | null = null;
export class ApiError extends Error {
    constructor(public status: number, message: string) { super(message); }
}
async function ensureCsrf() {
    if (csrfToken)
        return;
    if (!csrfRequest)
        csrfRequest = fetch(`${base}/auth/csrf`, { credentials: 'include' })
            .then(async (response) => { if (!response.ok)
            throw new ApiError(response.status, 'No se pudo establecer una conexión segura.'); csrfToken = (await response.json()).csrfToken; })
            .finally(() => { csrfRequest = null; });
    await csrfRequest;
}
async function request(path: string, options: RequestInit = {}, retry = true): Promise<Response> {
    const method = options.method || 'GET';
    const mutation = !['GET', 'HEAD'].includes(method);
    if (path === '/auth/login')
        csrfToken = '';
    if (mutation)
        await ensureCsrf();
    const headers = new Headers(options.headers);
    if (options.body)
        headers.set('Content-Type', 'application/json');
    if (mutation)
        headers.set('X-CSRF-Token', csrfToken);
    const response = await fetch(`${base}${path}`, { ...options, headers, credentials: 'include' });
    if (response.status === 401 && retry && !['/auth/login', '/auth/refresh', '/auth/logout'].includes(path)) {
        if (!refreshRequest)
            refreshRequest = request('/auth/refresh', { method: 'POST' }, false).then(() => { }).finally(() => { refreshRequest = null; });
        try {
            await refreshRequest;
            return request(path, options, false);
        }
        catch {
            window.dispatchEvent(new Event('session-expired'));
            throw new ApiError(401, 'Tu sesión ha expirado. Inicia sesión nuevamente.');
        }
    }
    if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new ApiError(response.status, Array.isArray(body.message) ? body.message.join('. ') : body.message || 'No fue posible completar la operación.');
    }
    if (path === '/auth/logout')
        csrfToken = '';
    return response;
}
export async function api<T>(path: string, options: RequestInit = {}): Promise<T> {
    try {
        const response = await request(path, options);
        return response.status === 204 ? undefined as T : await response.json();
    }
    catch (error) {
        if (error instanceof ApiError)
            throw error;
        throw new Error('No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.');
    }
}
export const send = <T,>(path: string, method: string, body?: unknown) => api<T>(path, { method, ...(body !== undefined ? { body: JSON.stringify(body) } : {}) });
export async function download(path: string, filename: string) {
    const response = await request(path);
    const url = URL.createObjectURL(await response.blob());
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function errorText(error: unknown) { return error instanceof Error ? error.message : 'Ocurrió un error inesperado.'; }
