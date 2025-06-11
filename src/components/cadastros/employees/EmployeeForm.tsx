import React, { useState } from 'react';
import { X, Save, Eye, EyeOff, RefreshCw } from 'lucide-react';
import { Employee, UserRole } from '../../../types';
import { permissions, permissionGroups, defaultPermissions } from '../../../data/permissions';

interface EmployeeFormProps {
  employee: Employee | null;
  onSave: (data: Partial<Employee>) => void;
  onClose: () => void;
}

const EmployeeForm: React.FC<EmployeeFormProps> = ({ employee, onSave, onClose }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const [formData, setFormData] = useState({
    name: employee?.name || '',
    email: employee?.email || '',
    username: employee?.username || '',
    password: '',
    confirmPassword: '',
    role: employee?.role || 'attendant',
    isActive: employee?.isActive ?? true,
    customPermissions: employee?.customPermissions || []
  });

  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'E-mail é obrigatório';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'E-mail inválido';
    }

    if (!formData.username.trim()) {
      newErrors.username = 'Usuário é obrigatório';
    }

    if (!employee && !formData.password) {
      newErrors.password = 'Senha é obrigatória';
    }

    if (!employee && formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'As senhas não coincidem';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    const employeeData = {
      name: formData.name,
      email: formData.email,
      username: formData.username,
      role: formData.role as UserRole,
      isActive: formData.isActive,
      customPermissions: formData.customPermissions,
      ...(formData.password && { password: formData.password })
    };

    onSave(employeeData);
  };

  const handlePermissionChange = (permissionId: string, checked: boolean) => {
    setFormData(prev => {
      const newCustomPermissions = [...prev.customPermissions];
      
      // Check if we have a negated version of this permission
      const negatedPermissionIndex = newCustomPermissions.indexOf(`-${permissionId}`);
      const permissionIndex = newCustomPermissions.indexOf(permissionId);
      
      // Remove both versions if they exist
      if (negatedPermissionIndex !== -1) {
        newCustomPermissions.splice(negatedPermissionIndex, 1);
      }
      
      if (permissionIndex !== -1) {
        newCustomPermissions.splice(permissionIndex, 1);
      }
      
      // Add the appropriate version based on the checkbox state
      const hasDefaultPermission = defaultPermissions[formData.role as UserRole].includes(permissionId);
      
      if (checked) {
        // If checked and not in default permissions, add it
        if (!hasDefaultPermission) {
          newCustomPermissions.push(permissionId);
        }
        // If checked and in default permissions, we don't need to add anything
      } else {
        // If unchecked and in default permissions, add the negated version
        if (hasDefaultPermission) {
          newCustomPermissions.push(`-${permissionId}`);
        }
        // If unchecked and not in default permissions, we don't need to add anything
      }
      
      return {
        ...prev,
        customPermissions: newCustomPermissions
      };
    });
  };

  const isPermissionCustomized = (permissionId: string) => {
    const hasDefaultPermission = defaultPermissions[formData.role as UserRole].includes(permissionId);
    const hasCustomPermission = formData.customPermissions.includes(permissionId);
    const hasNegatedPermission = formData.customPermissions.includes(`-${permissionId}`);
    
    return (hasDefaultPermission && hasNegatedPermission) || (!hasDefaultPermission && hasCustomPermission);
  };

  const hasPermission = (permissionId: string) => {
    const hasDefaultPermission = defaultPermissions[formData.role as UserRole].includes(permissionId);
    const hasCustomPermission = formData.customPermissions.includes(permissionId);
    const hasNegatedPermission = formData.customPermissions.includes(`-${permissionId}`);
    
    return (hasCustomPermission || (hasDefaultPermission && !hasNegatedPermission));
  };

  const resetPermissions = () => {
    setFormData(prev => ({
      ...prev,
      customPermissions: []
    }));
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] flex flex-col">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {employee ? 'Editar Funcionário' : 'Novo Funcionário'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b">
          <nav className="flex">
            <button
              onClick={() => setActiveTab('basic')}
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'basic'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Dados Básicos
            </button>
            <button
              onClick={() => setActiveTab('permissions')}
              className={`py-4 px-6 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'permissions'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Permissões
            </button>
          </nav>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.name ? 'border-red-500' : ''
                    }`}
                    value={formData.name}
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  />
                  {errors.name && (
                    <p className="text-red-500 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    E-mail *
                  </label>
                  <input
                    type="email"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.email ? 'border-red-500' : ''
                    }`}
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  />
                  {errors.email && (
                    <p className="text-red-500 text-sm mt-1">{errors.email}</p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Usuário *
                  </label>
                  <input
                    type="text"
                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.username ? 'border-red-500' : ''
                    }`}
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                  {errors.username && (
                    <p className="text-red-500 text-sm mt-1">{errors.username}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Função
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={formData.role}
                    onChange={(e) => {
                      setFormData(prev => ({ 
                        ...prev, 
                        role: e.target.value as UserRole,
                        customPermissions: [] // Reset custom permissions when role changes
                      }));
                    }}
                  >
                    <option value="attendant">Atendente</option>
                    <option value="technician">Técnico</option>
                    <option value="manager">Gerente</option>
                    <option value="financial_low">Financeiro Básico</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Senha {!employee && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.password ? 'border-red-500' : ''
                      }`}
                      value={formData.password}
                      onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-red-500 text-sm mt-1">{errors.password}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Senha {!employee && '*'}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.confirmPassword ? 'border-red-500' : ''
                      }`}
                      value={formData.confirmPassword}
                      onChange={(e) => setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    />
                  </div>
                  {errors.confirmPassword && (
                    <p className="text-red-500 text-sm mt-1">{errors.confirmPassword}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={formData.isActive}
                  onChange={(e) => setFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Usuário ativo
                </label>
              </div>
            </div>
          )}

          {/* Permissions Tab */}
          {activeTab === 'permissions' && (
            <div className="p-6 space-y-6">
              {/* Permissions Header */}
              <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">Permissões do Usuário</h3>
                  <p className="text-sm text-gray-500 mt-1">
                    Função: {formData.role.charAt(0).toUpperCase() + formData.role.slice(1)}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={resetPermissions}
                  className="flex items-center space-x-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span>Resetar para padrão</span>
                </button>
              </div>

              {/* Permissions Legend */}
              <div className="flex items-center space-x-6 text-sm">
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-gray-100 border rounded"></div>
                  <span>Padrão</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 bg-blue-50 border-2 border-blue-500 rounded"></div>
                  <span>Customizado</span>
                </div>
              </div>

              {/* Permissions Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {Object.entries(permissionGroups).map(([groupKey, group]) => (
                  <div key={groupKey} className="bg-white border rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b">
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                    </div>
                    <div className="p-4 space-y-3">
                      {group.permissions.map(permissionId => {
                        const isCustom = isPermissionCustomized(permissionId);
                        const hasDefaultPerm = defaultPermissions[formData.role as UserRole].includes(permissionId);
                        
                        return (
                          <label 
                            key={permissionId} 
                            className={`flex items-center space-x-3 p-2 rounded transition-colors ${
                              isCustom ? 'bg-blue-50' : 'hover:bg-gray-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={hasPermission(permissionId)}
                              onChange={(e) => handlePermissionChange(permissionId, e.target.checked)}
                              className={`rounded border-2 transition-colors ${
                                isCustom 
                                  ? 'border-blue-500 text-blue-600 focus:ring-blue-500' 
                                  : 'border-gray-300 text-gray-600 focus:ring-gray-500'
                              }`}
                            />
                            <span className="text-sm text-gray-700">
                              {permissions[permissionId as keyof typeof permissions]}
                              {isCustom && (
                                <span className="ml-2 text-xs text-blue-600 font-medium">
                                  {hasDefaultPerm ? 
                                    (hasPermission(permissionId) ? '' : '[REMOVIDO]') : 
                                    '[ADICIONADO]'}
                                </span>
                              )}
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </form>

        <div className="p-6 border-t flex justify-end space-x-3 bg-white">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>Salvar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default EmployeeForm;