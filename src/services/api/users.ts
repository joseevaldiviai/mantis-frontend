import { ApiClient } from './client';
import { User, Company } from '../../types';

export class UsersApi {
  constructor(protected client: ApiClient) {}

  public async getCompanies(): Promise<Company[]> {
    return this.client.request<Company[]>('/empresas?per_page=100&all=true');
    }
  public async createCompany(data: { nombre: string; nit_ruc?: string }): Promise<Company> {
    return this.client.request<Company>('/empresas', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateCompany(id: number, data: Partial<Company>): Promise<Company> {
    return this.client.request<Company>(`/empresas/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async getUsers(companyId?: number): Promise<User[]> {
    return this.client.request<User[]>('/users?per_page=100');
  }

  public async createUser(data: Partial<User> & { especialidad_ids?: number[]; password?: string }): Promise<User> {
    return this.client.request<User>('/users', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  public async updateUser(id: number, data: Partial<User> & { especialidad_ids?: number[]; password?: string }): Promise<User> {
    return this.client.request<User>(`/users/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data)
    });
  }

  public async deleteUser(id: number): Promise<void> {
    await this.client.request<void>(`/users/${id}`, { method: 'DELETE' });
  }
}
