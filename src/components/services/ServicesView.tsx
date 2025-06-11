import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Edit, Trash2, Image, Eye, X } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const ServicesView: React.FC = () => {
  const { services, setServices } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingService, setEditingService] = useState<any>(null);
  const [viewingService, setViewingService] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    defaultPrice: 0,
    group: '',
    description: '',
    image: null as File | null
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingService) {
      setServices(prev => prev.map(service => 
        service.id === editingService.id 
          ? { ...service, ...formData }
          : service
      ));
    } else {
      const newService = {
        id: services.length + 1,
        ...formData
      };
      setServices(prev => [...prev, newService]);
    }

    setShowModal(false);
    setEditingService(null);
    setFormData({ name: '', defaultPrice: 0, group: '', description: '', image: null });
  };

  const handleEdit = (service: any) => {
    setEditingService(service);
    setFormData({
      name: service.name,
      defaultPrice: service.defaultPrice,
      group: service.group || '',
      description: service.description || '',
      image: null
    });
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este serviço?')) {
      setServices(prev => prev.filter(service => service.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Serviços</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Serviço</span>
        </button>
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map(service => (
          <div key={service.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-lg font-semibold">{service.name}</h3>
                <p className="text-sm text-gray-600">{service.group || 'Sem grupo'}</p>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingService(service)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Visualizar"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleEdit(service)}
                  className="text-green-600 hover:text-green-800 transition-colors"
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
            </div>

            <div className="space-y-4">
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                <Image className="w-12 h-12 text-gray-400" />
              </div>
              
              <div>
                <p className="text-sm text-gray-600">{service.description || 'Sem descrição'}</p>
                <p className="text-xl font-bold text-green-600 mt-2">
                  {formatCurrency(service.defaultPrice)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingService ? 'Editar Serviço' : 'Novo Serviço'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grupo</label>
                <input
                  type="text"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.group}
                  onChange={(e) => setFormData(prev => ({ ...prev, group: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Preço Padrão</label>
                <input
                  type="number"
                  required
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.defaultPrice}
                  onChange={(e) => setFormData(prev => ({ ...prev, defaultPrice: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                <textarea
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Imagem</label>
                <input
                  type="file"
                  accept="image/*"
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  onChange={(e) => setFormData(prev => ({ ...prev, image: e.target.files?.[0] || null }))}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingService(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingService ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Modal */}
      {viewingService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detalhes do Serviço</h2>
              <button
                onClick={() => setViewingService(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              {/* Service Image */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-100 rounded-lg flex items-center justify-center">
                <Image className="w-24 h-24 text-gray-400" />
              </div>

              {/* Service Details */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{viewingService.name}</h3>
                  <p className="text-sm text-gray-600">{viewingService.group || 'Sem grupo'}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Preço Padrão</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(viewingService.defaultPrice)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {viewingService.description && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">Descrição</h4>
                  <p className="text-gray-600 bg-gray-50 p-4 rounded-lg">
                    {viewingService.description}
                  </p>
                </div>
              )}
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setViewingService(null)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  handleEdit(viewingService);
                  setViewingService(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
              >
                <Edit className="w-4 h-4" />
                <span>Editar</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ServicesView;