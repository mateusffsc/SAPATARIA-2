import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import { User, AuthContextType, AuthProviderProps, UserRole } from '../types';
import { defaultPermissions } from '../data/permissions';
import { supabase } from '../lib/supabase';
import { EmployeeService } from '../services/employeeService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const STORAGE_KEY = 'sapataria_session';

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Default users if none exist
  const defaultUsers: User[] = [
    { 
      id: 1, 
      username: 'admin', 
      password: 'admin123', 
      name: 'Administrador', 
      role: 'admin' as UserRole,
      isActive: true,
      createdAt: '2025-01-01',
      lastLogin: '2025-06-04'
    },
    { 
      id: 2, 
      username: 'gerente', 
      password: 'gerente123', 
      name: 'Gerente', 
      role: 'manager' as UserRole,
      isActive: true,
      createdAt: '2025-01-01'
    },
    { 
      id: 3, 
      username: 'atendente', 
      password: 'atend123', 
      name: 'Atendente', 
      role: 'attendant' as UserRole,
      isActive: true,
      createdAt: '2025-01-01'
    },
    { 
      id: 4, 
      username: 'tecnico', 
      password: 'tec123', 
      name: 'Técnico', 
      role: 'technician' as UserRole,
      isActive: true,
      createdAt: '2025-01-01'
    },
    { 
      id: 5, 
      username: 'financeiro', 
      password: 'fin123', 
      name: 'Financeiro Básico', 
      role: 'financial_low' as UserRole,
      isActive: true,
      createdAt: '2025-01-01'
    }
  ];

  // Load users from local storage or initialize with defaults
  const [users, setUsers] = useState<User[]>(defaultUsers);

  // Load saved session on mount
  useEffect(() => {
    const savedSession = localStorage.getItem(STORAGE_KEY);
    if (savedSession) {
      const { user } = JSON.parse(savedSession);
      setCurrentUser(user);
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  // Load employees from database and sync with local users
  useEffect(() => {
    const loadEmployees = async () => {
      try {
        setLoading(true);
        const employees = await EmployeeService.getAll();
        
        if (employees && employees.length > 0) {
          // Convert database employees to User objects
          const dbUsers: User[] = employees.map(emp => ({
            id: emp.id,
            username: emp.username,
            password: emp.password,
            name: emp.name,
            role: emp.role as UserRole,
            isActive: emp.isActive,
            createdAt: emp.createdAt,
            lastLogin: emp.lastLogin,
            customPermissions: emp.customPermissions
          }));
          
          // Merge with default users, prioritizing database users
          const mergedUsers = [...defaultUsers];
          
          // Add or update users from database
          dbUsers.forEach(dbUser => {
            const existingIndex = mergedUsers.findIndex(u => u.username === dbUser.username);
            if (existingIndex >= 0) {
              mergedUsers[existingIndex] = dbUser;
            } else {
              mergedUsers.push(dbUser);
            }
          });
          
          setUsers(mergedUsers);
        }
      } catch (error) {
        console.error('Error syncing employees:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEmployees();
  }, []);

  const login = (username: string, password: string): boolean => {
    const user = users.find(u => 
      u.username === username && 
      u.password === password &&
      u.isActive
    );
    
    if (user) {
      // Update last login
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      
      // Update last login in database
      if (user.id > 4) { // Only update database for non-default users
        EmployeeService.update(user.id, { lastLogin: new Date().toISOString() })
          .catch(err => console.error('Error updating last login:', err));
      }
      
      // Save session to localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ user: updatedUser }));
      
      setCurrentUser(updatedUser);
      setIsAuthenticated(true);
      return true;
    }
    
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setCurrentUser(null);
    setIsAuthenticated(false);
  };

  const addUser = (user: Omit<User, 'id' | 'createdAt'>): User => {
    // This function is no longer needed as we're using the database
    throw new Error('Use EmployeeService.create instead');
  };

  const updateUser = (id: number, updates: Partial<User>): User => {
    // This function is no longer needed as we're using the database
    throw new Error('Use EmployeeService.update instead');
  };

  const deleteUser = (id: number): void => {
    // This function is no longer needed as we're using the database
    throw new Error('Use EmployeeService.delete instead');
  };

  const hasPermission = (permission: string): boolean => {
    if (!currentUser) return false;
    
    // Admin has all permissions
    if (currentUser.role === 'admin') return true;

    // Check custom permissions first
    if (currentUser.customPermissions) {
      // Check if permission is explicitly denied (prefixed with -)
      if (currentUser.customPermissions.includes(`-${permission}`)) return false;
      
      // Check if permission is explicitly granted
      if (currentUser.customPermissions.includes(permission)) return true;
    }

    // Check role-based permissions
    const rolePermissions = defaultPermissions[currentUser.role];
    return rolePermissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider value={{ 
      isAuthenticated, 
      currentUser, 
      login, 
      logout,
      hasPermission,
      addUser,
      updateUser,
      deleteUser,
      users,
      loading
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};