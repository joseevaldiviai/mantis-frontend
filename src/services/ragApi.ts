/**
 * Servicio de comunicación con el backend RAG (Retrieval-Augmented Generation).
 *
 * Conecta al endpoint real del backend Laravel:
 *   POST /rag/chat  — { mensaje, contexto? } → { respuesta, fuentes? }
 *
 * El backend escopea todo por empresa (rol `integracion`, solo lectura).
 */

export interface RagMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  sources?: RagSource[];
}

export interface RagSource {
  tipo: 'documento' | 'maquina' | 'orden_trabajo' | 'procedimiento';
  titulo: string;
  id?: number;
  relevancia?: number;
}

interface RagApiResponse {
  respuesta: string;
  fuentes?: RagSource[];
}

const RAG_BASE_KEY = 'mantis_rag_api_url';

export class RagApiService {
  private baseUrl: string;

  constructor() {
    this.baseUrl = localStorage.getItem(RAG_BASE_KEY) || '';
  }

  public getBaseUrl(): string { return this.baseUrl; }
  public setBaseUrl(url: string) {
    this.baseUrl = url.trim().replace(/\/+$/, '');
    localStorage.setItem(RAG_BASE_KEY, this.baseUrl);
  }

  /**
   * Envía un mensaje al RAG y retorna la respuesta del asistente.
   */
  public async sendMessage(
    mensaje: string,
    token?: string,
    conversationHistory?: RagMessage[]
  ): Promise<{ respuesta: string; fuentes: RagSource[] }> {
    if (!this.baseUrl) {
      throw new Error('No hay URL configurada para el backend RAG. Configurala en la sección de ajustes del chat.');
    }

    const headers: Record<string, string> = {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token.replace(/^Bearer\s+/i, '')}`;
    }

    const contexto = conversationHistory
      ?.slice(-10)
      .map(m => `${m.role}: ${m.content}`)
      .join('\n');

    const response = await fetch(`${this.baseUrl}/rag/chat`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        mensaje,
        contexto: contexto || undefined
      })
    });

    if (!response.ok) {
      let errMessage = `Error ${response.status}: ${response.statusText}`;
      try {
        const errJson = await response.json();
        if (errJson.message) errMessage = errJson.message;
      } catch { /* fallback */ }
      throw new Error(errMessage);
    }

    const json: RagApiResponse = await response.json();
    return {
      respuesta: json.respuesta,
      fuentes: json.fuentes || []
    };
  }
}

export const ragApi = new RagApiService();
