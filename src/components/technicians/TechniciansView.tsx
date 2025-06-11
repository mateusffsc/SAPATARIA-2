import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Search, Edit, Trash2, User, Phone, Mail, Calendar } from 'lucide-react';
import EmployeeForm from '../cadastros/employees/EmployeeForm';
import { Employee } from '../../types';
import { EmployeeService } from '../../services/employeeService';
import { useToast } from '../shared/ToastContainer';

const TechniciansView: React.FC = () => {
  const { employees, setEmployees } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const { showSuccess, showError } = useToast();

  // Filter only technicians from employees
  const technicians = employees.filter(emp => emp.role === 'technician');
  
  const filteredTechnicians = technicians.filter(tech =>
    tech.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    tech.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: number) => {
    try {
      if (window.confirm('Tem certeza que deseja excluir este técnico?')) {
        await EmployeeService.delete(id);
        setEmployees(prev => prev.filter(emp => emp.id !== id));
        showSuccess('Técnico excluído com sucesso!');
      }
    } catch (error) {
      console.error('Error deleting technician:', error);
      showError('Erro ao excluir técnico', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  const handleSave = async (employeeData: Partial<Employee>) => {
    try {
      // Always set role to technician
      const technicianData = {
        ...employeeData,
        role: 'technician' as const
      };
      
      if (editingEmployee) {
        const updatedEmployee = await EmployeeService.update(editingEmployee.id, technicianData);
        setEmployees(prev => prev.map(emp => 
          emp.id === editingEmployee.id ? updatedEmployee : emp
        ));
        showSuccess('Técnico atualizado com sucesso!');
      } else {
        const newEmployee = await EmployeeService.create({
          ...technicianData as Omit<Employee, 'id' | 'createdAt' | 'lastLogin'>,
          role: 'technician'
        });
        
        setEmployees(prev => [...prev, newEmployee]);
        showSuccess('Técnico criado com sucesso!');
      }
      
      setShowModal(false);
      setEditingEmployee(null);
    } catch (error) {
      console.error('Error saving technician:', error);
      showError('Erro ao salvar técnico', error instanceof Error ? error.message : 'Tente novamente.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Técnicos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Técnico</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome ou e-mail..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Technicians list */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredTechnicians.map(technician => (
          <div key={technician.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">{technician.name}</h3>
                  <p className="text-sm text-gray-600">Técnico</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingEmployee(technician);
                    setShowModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar técnico"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(technician.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Excluir técnico"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span>{technician.username}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span>{technician.email}</span>
              </div>
              <div className="flex items-center">
                <Calendar className="w-4 h-4 text-gray-400 mr-2" />
                <span>Desde {new Date(technician.createdAt).toLocaleDateString()}</span>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                technician.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
              }`}>
                {technician.isActive ? 'Ativo' : 'Inativo'}
              </span>
            </div>
          </div>
        ))}
        {filteredTechnicians.length === 0 && (
          <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">Nenhum técnico encontrado</p>
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

export default TechniciansView;