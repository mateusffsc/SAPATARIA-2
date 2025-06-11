import { supabase } from '../lib/supabase';
import { Employee, UserRole } from '../types';
import { useAuth } from '../context/AuthContext';

export class EmployeeService {
  static async getAll(): Promise<Employee[]> {
    try {
      console.log('Fetching all employees...');
      const { data, error } = await supabase
        .from('employees')
        .select('*')
        .order('name');

      if (error) {
        console.error('Error fetching employees:', error);
        throw error;
      }

      console.log('Employees fetched successfully:', data);
      return data.map(this.mapFromDatabase);
    } catch (err) {
      console.error('Unexpected error in getAll:', err);
      throw err;
    }
  }

  static async create(employee: Omit<Employee, 'id' | 'createdAt' | 'lastLogin'>): Promise<Employee> {
    try {
      console.log('Creating new employee:', employee);

      const dbData = this.mapToDatabase(employee);
      console.log('Mapped data for database:', dbData);

      const { data, error } = await supabase
        .from('employees')
        .insert(dbData)
        .select()
        .single();

      if (error) {
        console.error('Error creating employee:', error);
        throw error;
      }

      console.log('Employee created successfully:', data);
      return this.mapFromDatabase(data);
    } catch (err) {
      console.error('Unexpected error in create:', err);
      throw err;
    }
  }

  static async update(id: number, employee: Partial<Employee>): Promise<Employee | null> {
    try {
      console.log('Updating employee:', id, employee);

      const dbData = this.mapToDatabase(employee);
      console.log('Mapped data for database:', dbData);

      const { data, error } = await supabase
        .from('employees')
        .update(dbData)
        .eq('id', id)
        .select();

      if (error) {
        console.error('Error updating employee:', error);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log('No employee found with id:', id);
        return null;
      }

      console.log('Employee updated successfully:', data[0]);
      return this.mapFromDatabase(data[0]);
    } catch (err) {
      console.error('Unexpected error in update:', err);
      throw err;
    }
  }

  static async delete(id: number): Promise<void> {
    try {
      console.log('Deleting employee:', id);

      const { error } = await supabase
        .from('employees')
        .delete()
        .eq('id', id);

      if (error) {
        console.error('Error deleting employee:', error);
        throw error;
      }

      console.log('Employee deleted successfully');
    } catch (err) {
      console.error('Unexpected error in delete:', err);
      throw err;
    }
  }

  private static mapFromDatabase(data: any): Employee {
    return {
      id: data.id,
      name: data.name,
      email: data.email,
      username: data.username,
      password: data.password,
      role: data.role as UserRole,
      isActive: data.is_active,
      customPermissions: data.custom_permissions || [],
      createdAt: data.created_at,
      lastLogin: data.last_login
    };
  }

  private static mapToDatabase(employee: Partial<Employee>): any {
    const dbData: any = {
      name: employee.name,
      email: employee.email,
      username: employee.username,
      password: employee.password,
      role: employee.role,
      is_active: employee.isActive,
      custom_permissions: employee.customPermissions
    };

    return dbData;
  }
}