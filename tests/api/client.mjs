/** Minimal cookie-aware client. Tests exercise public HTTP endpoints, not service mocks. */
export class ApiClient {
  constructor(base = process.env.TEST_API_URL || 'http://127.0.0.1:3000/api') {
    this.base = base.replace(/\/$/, '');
    this.cookies = new Map();
    this.csrf = '';
  }

  clone() {
    const client = new ApiClient(this.base);
    client.cookies = new Map(this.cookies);
    client.csrf = this.csrf;
    return client;
  }

  async request(method, path, body, options = {}) {
    const headers = new Headers({ Accept: 'application/json' });
    if (body !== undefined) headers.set('Content-Type', 'application/json');
    if (this.cookies.size) headers.set('Cookie', [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; '));
    if (this.csrf && options.csrf !== false) headers.set('X-CSRF-Token', this.csrf);
    for (const [name, value] of Object.entries(options.headers || {})) headers.set(name, value);
    const response = await fetch(`${this.base}${path}`, {
      method, headers, body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(15_000), redirect: 'manual',
    });
    const setCookies = response.headers.getSetCookie();
    for (const cookie of setCookies) {
      const pair = cookie.split(';')[0];
      const separator = pair.indexOf('=');
      const name = pair.slice(0, separator);
      const value = pair.slice(separator + 1);
      if (!value || /max-age=0(?:;|$)/i.test(cookie)) this.cookies.delete(name);
      else this.cookies.set(name, value);
    }
    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = text; }
    return { status: response.status, headers: response.headers, setCookies, data, text };
  }

  async initCsrf() {
    const result = await this.request('GET', '/auth/csrf');
    if (result.status !== 200 || !result.data.csrfToken) throw new Error(`No se obtuvo CSRF: ${result.status} ${result.text}`);
    this.csrf = result.data.csrfToken;
    return result;
  }

  async login(correo, contrasena) {
    await this.initCsrf();
    return this.request('POST', '/auth/login', { correo, contrasena });
  }
}

export function fixtureCredentials(actor) {
  const correo = process.env[`TEST_${actor}_EMAIL`];
  const contrasena = process.env[`TEST_${actor}_PASSWORD`];
  if (!correo || !contrasena) throw new Error(`Defina TEST_${actor}_EMAIL y TEST_${actor}_PASSWORD para una base de datos exclusiva de pruebas.`);
  return { correo, contrasena };
}

export function expected(response, status, context = '') {
  if (response.status !== status) throw new Error(`${context}: esperado HTTP ${status}, recibido ${response.status}: ${response.text}`);
  return response.data;
}

export function accepted(response, statuses, context = '') {
  if (!statuses.includes(response.status)) throw new Error(`${context}: esperado HTTP ${statuses.join('/')}, recibido ${response.status}: ${response.text}`);
  return response.data;
}
