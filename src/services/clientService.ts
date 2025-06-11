import { supabase } from '../lib/supabase';
import { Client } from '../types';

export class ClientService {
  static async getAll(): Promise<Client[]> {
    try {
      console.log('Fetching all clients...');
      const { data, error } = await supabase
        .from('clients')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching clients:', error);
        throw error;
      }

      console.log('Clients fetched successfully:', data);
      return data.map(this.mapFromDatabase);
    } catch (err) {
      console.error('Unexpected error in getAll:', err);
      throw err;
    }
  }

  static async getById(id: number): Promise<Client | null> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return this.mapFromDatabase(data);
  }

  static async create(client: Omit<Client, 'id'>): Promise<Client> {
    try {
      console.log('Creating new client:', client);
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session:', session);

      const { data, error } = await supabase
        .from('clients')
        .insert(this.mapToDatabase(client))
        .select()
        .single();

      if (error) {
        console.error('Error creating client:', error);
        throw error;
      }

      // Força uma nova consulta para verificar se os dados foram salvos
      const { data: checkData, error: checkError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', data.id)
        .single();

      if (checkError) {
        console.error('Error verifying client creation:', checkError);
      } else {
        console.log('Verified client in database:', checkData);
      }

      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('Unexpected error in create:', err);
      throw err;
    }
  }

  static async update(id: number, client: Partial<Client>): Promise<Client> {
    try {
      console.log('Updating client:', id, client);
      const { data: session } = await supabase.auth.getSession();
      console.log('Current session:', session);

      const { data, error } = await supabase
        .from('clients')
        .update(this.mapToDatabase(client))
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating client:', error);
        throw error;
      }

      // Força uma nova consulta para verificar se os dados foram atualizados
      const { data: checkData, error: checkError } = await supabase
        .from('clients')
        .select('*')
        .eq('id', id)
        .single();

      if (checkError) {
        console.error('Error verifying client update:', checkError);
      } else {
        console.log('Verified client in database:', checkData);
      }

      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('Unexpected error in update:', err);
      throw err;
    }
  }

  static async delete(id: number): Promise<void> {
    const { error } = await supabase
      .from('clients')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }

  static async search(query: string): Promise<Client[]> {
    const { data, error } = await supabase
      .from('clients')
      .select('*')
      .or(`name.ilike.%${query}%,cpf.ilike.%${query}%,phone.ilike.%${query}%`)
      .order('name');

    if (error) throw error;

    return data.map(this.mapFromDatabase);
  }

  private static mapFromDatabase(data: any): Client {
    return {
      id: data.id,
      name: data.name,
      cpf: data.cpf,
      phone: data.phone,
      email: data.email,
      street: data.street,
      number: data.number,
      complement: data.complement,
      neighborhood: data.neighborhood,
      city: data.city,
      state: data.state,
      zipCode: data.zip_code
    };
  }

  private static mapToDatabase(client: Partial<Client>): any {
    return {
      name: client.name,
      cpf: client.cpf,
      phone: client.phone,
      email: client.email,
      street: client.street,
      number: client.number,
      complement: client.complement,
      neighborhood: client.neighborhood,
      city: client.city,
      state: client.state,
      zip_code: client.zipCode
    };
  }
}