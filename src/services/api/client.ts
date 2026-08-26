const MANTIS_BASE_URL_KEY = 'mantis_api_base_url';
const MANTIS_TOKEN_KEY = 'mantis_api_token';

/**
 * Cliente HTTP base para la API de Mantis.
 * Maneja autenticación Sanctum, configuración de URL y peticiones genéricas.
 */
export class ApiClient {
  protected baseUrl: string;
  protected token: string;

  constructor() {
    const envDefault = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
    this.baseUrl = localStorage.getItem(MANTIS_BASE_URL_KEY) || envDefault;
    this.token = localStorage.getItem(MANTIS_TOKEN_KEY) || '';
  }

  public getBaseUrl(): string { return this.baseUrl; }
  public setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(MANTIS_BASE_URL_KEY, this.baseUrl);
  }

  public getToken(): string { return this.token; }
  public setToken(token: string) {
    this.token = token.trim();
    localStorage.setItem(MANTIS_TOKEN_KEY, this.token);
  }

  public isAuthenticated(): boolean {
    return !!this.token;
  }

  public async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {})
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token.replace(/^Bearer\s+/i, '')}`;
    }

    const url = `${this.baseUrl}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      let errMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.message) errMessage = errJson.message;
      } catch { /* fallback */ }
      throw new Error(errMessage);
    }

    if (response.status === 204) {
      return {} as T;
    }

    const json = await response.json();
    return json.data !== undefined ? json.data : json;
  }

  public async fetchAuthenticatedBlobUrl(path: string): Promise<string> {
    const headers: HeadersInit = {};
    if (this.token) headers['Authorization'] = `Bearer ${this.token}`;
    const response = await fetch(`${this.baseUrl}${path}`, { headers });
    if (!response.ok) {
      throw new Error(`No se pudo descargar ${path} (HTTP ${response.status})`);
    }
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  }

  public triggerDownload(url: string, filename: string): void {
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
