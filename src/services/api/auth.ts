import { ApiClient } from './client';
import { User, Company, AuthSessionToken } from '../../types';

export class AuthApi {
  constructor(protected client: ApiClient) {}

  public async login(email: string, password: string): Promise<{ access_token: string; user: User }> {
    const res = await this.client.request<{ access_token: string; token_type: string; user: User }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    this.client.setToken(res.access_token);
    return { access_token: res.access_token, user: res.user };
  }

  public async logout(): Promise<void> {
    if (this.client.isAuthenticated()) {
      try {
        await this.client.request('/auth/logout', { method: 'POST' });
      } catch (e) {
        console.warn('Logout request failed on backend server:', e);
      }
    }
    this.client.setToken('');
    localStorage.removeItem('mantis_api_token');
  }

  public async getMe(): Promise<User> {
    return this.client.request<User>('/auth/me');
  }

  public async getCurrentCompany(): Promise<Company> {
    return this.client.request<Company>('/empresas/actual');
  }

  public async getTokens(): Promise<AuthSessionToken[]> {
    return this.client.request<AuthSessionToken[]>('/auth/tokens');
  }

  public async revokeToken(tokenId: string): Promise<void> {
    await this.client.request<void>(`/auth/tokens/${tokenId}`, { method: 'DELETE' });
  }
}
