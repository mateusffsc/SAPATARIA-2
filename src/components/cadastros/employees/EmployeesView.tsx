import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { useAuth } from '../../../context/AuthContext';
import { Plus, Search, Edit, Trash2, User, Mail, Shield, Calendar } from 'lucide-react';
import EmployeeForm from './EmployeeForm';
import { Employee } from '../../../types';
import { EmployeeService } from '../../../services/employeeService';
import { useToast } from '../../../components/shared/ToastContainer';

const EmployeesView: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { employees, setEmployees } = useAppContext();
  const { showSuccess, showError } = useToast();

  const handleDelete = async (id: number) => {
    try {
      if (window.confirm('Tem certeza que deseja excluir este funcionário?')) {
        await EmployeeService.delete(id);
        setEmployees((prev: Employee[]) => prev.filter((emp: Employee) => emp.id !== id));
        showSuccess('Funcionário excluído com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting employee:', error);
      showError('Erro ao excluir funcionário', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const handleEdit = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowModal(true);
  };

  const handleSave = async (employeeData: Partial<Employee>) => {
    try {
      if (editingEmployee) {
        const updatedEmployee = await EmployeeService.update(editingEmployee.id, employeeData);
        
        if (updatedEmployee) {
          setEmployees((prev: Employee[]) => prev.map((emp: Employee) => 
            emp.id === editingEmployee.id ? updatedEmployee : emp
          ));
          showSuccess('Funcionário atualizado com sucesso!');
        } else {
          showError('Erro ao atualizar funcionário', 'Funcionário não encontrado no banco de dados.');
          return;
        }
      } else {
        const newEmployee = await EmployeeService.create(employeeData as Omit<Employee, 'id' | 'createdAt' | 'lastLogin'>);
        setEmployees((prev: Employee[]) => [...prev, newEmployee]);
        showSuccess('Funcionário criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving employee:', error);
      showError('Erro ao salvar funcionário', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const filteredEmployees = employees.filter(emp =>
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.username.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getRoleLabel = (role: string) => {
    const roles = {
      admin: 'Administrador',
      manager: 'Gerente',
      attendant: 'Atendente',
      technician: 'Técnico'
    };
    return roles[role as keyof typeof roles] || role;
  };

  const getRoleColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      manager: 'bg-blue-100 text-blue-800',
      attendant: 'bg-green-100 text-green-800',
      technician: 'bg-orange-100 text-orange-800'
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Funcionários</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Funcionário</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, e-mail ou usuário..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Employees list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map(employee => (
          <div key={employee.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">{employee.name}</h3>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getRoleColor(employee.role)}`}>
                    {getRoleLabel(employee.role)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => handleEdit(employee)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {employee.role !== 'admin' && (
                  <button
                    onClick={() => handleDelete(employee.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span>{employee.username}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span>Desde {new Date(employee.createdAt).toLocaleDateString()}</span>
              </div>
              {employee.lastLogin && (
                <div className="flex items-center">
                  <Shield className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Último acesso: {new Date(employee.lastLogin).toLocaleDateString()}</span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                employee.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {employee.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">Nenhum funcionário encontrado</p>
          </div>
        )}
      </div>

      {/* Employee Form Modal */}
      {showModal && (
        <EmployeeForm
          employee={editingEmployee}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingEmployee(null);
          }}
        />
      )}
    </div>
  );
};

export default EmployeesView;