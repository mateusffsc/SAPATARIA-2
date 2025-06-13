import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Search, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { useToast } from '../shared/ToastContainer';

const ServicesView: React.FC = () => {
  const { services, setServices } = useAppContext();
  const { showSuccess, showError } = useToast();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    defaultPrice: 0,
    group: '',
    description: ''
  });

  const filteredServices = services.filter(service => 
    service.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (service.group && service.group.toLowerCase().includes(searchTerm.toLowerCase())) ||
    (service.description && service.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      showError('Nome obrigatório', 'O nome do serviço é obrigatório.');
      return;
    }

    if (formData.defaultPrice <= 0) {
      showError('Preço inválido', 'O preço deve ser maior que zero.');
      return;
    }
    
    try {
      if (editingService) {
        setServices(prev => prev.map(service => 
          service.id === editingService.id 
            ? { ...service, ...formData }
            : service
        ));
        showSuccess('Serviço atualizado com sucesso!');
      } else {
        const newService = {
          id: services.length + 1,
          ...formData,
          isActive: true
        };
        setServices(prev => [...prev, newService]);
        showSuccess('Serviço cadastrado com sucesso!');
      }

      setShowModal(false);
      setEditingService(null);
      setFormData({ name: '', defaultPrice: 0, group: '', description: '' });
    } catch (error) {
      showError('Erro ao salvar', 'Ocorreu um erro ao salvar o serviço.');
    }
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      defaultPrice: service.defaultPrice,
      group: service.group || '',
      description: service.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      try {
        setServices(prev => prev.filter(service => service.id !== id));
        showSuccess('Serviço excluído com sucesso!');
      } catch (error) {
        showError('Erro ao excluir', 'Ocorreu um erro ao excluir o serviço.');
      }
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Serviços</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, grupo ou descrição..."
            className="pl-10 pr-10 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          {searchTerm && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
        
        {/* Search Results Summary */}
        <div className="mt-2 text-sm text-gray-600">
          {searchTerm ? (
            <span>
              {filteredServices.length} resultado(s) para "{searchTerm}"
            </span>
          ) : (
            <span>{filteredServices.length} serviços</span>
          )}
        </div>
      </div>

      {/* Services Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredServices.map(service => (
                <tr key={service.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{service.name}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-500">{service.group || 'Sem grupo'}</td>
                  <td className="px-6 py-4 text-gray-500">
                    <div className="max-w-xs truncate">
                      {service.description || 'Sem descrição'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap font-bold text-green-600">
                    {formatCurrency(service.defaultPrice)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(service)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(service.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredServices.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p>Nenhum serviço encontrado para "{searchTerm}"</p>
                        <button
                          onClick={clearSearch}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Limpar busca
                        </button>
                      </div>
                    ) : (
                      'Nenhum serviço cadastrado'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Service Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6 border-b">
              <h2 className="text-xl font-semibold">
                {editingService ? 'Editar Serviço' : 'Novo Serviço'}
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome *</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.group}
                  onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                  placeholder="Ex: Reparos, Manutenção, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Padrão *</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultPrice: Number(e.target.value) }))}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Descreva o serviço..."
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                    setFormData({ name: '', defaultPrice: 0, group: '', description: '' });
                  }}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingService ? 'Atualizar' : 'Salvar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;