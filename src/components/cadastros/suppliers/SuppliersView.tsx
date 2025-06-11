import React, { useState } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { Plus, Search, Edit, Trash2, Building2, Phone, Mail, User, Eye } from 'lucide-react';
import SupplierForm from './SupplierForm';
import { Supplier } from '../../../types';
import { useToast } from '../../../components/shared/ToastContainer';

const SuppliersView: React.FC = () => {
  const { suppliers, setSuppliers } = useAppContext();
  const { showSuccess, showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
  const [viewingSupplier, setViewingSupplier] = useState<Supplier | null>(null);

  const filteredSuppliers = suppliers.filter(supplier =>
    supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    supplier.cnpj.includes(searchTerm) ||
    supplier.contact.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este fornecedor?')) {
      setSuppliers(prev => prev.filter(s => s.id !== id));
      showSuccess('Fornecedor excluído com sucesso!');
    }
  };

  const handleSave = (supplierData: Partial<Supplier>) => {
    if (editingSupplier) {
      setSuppliers(prev => prev.map(s => 
        s.id === editingSupplier.id ? { ...s, ...supplierData } : s
      ));
      showSuccess('Fornecedor atualizado com sucesso!');
    } else {
      const newSupplier = {
        id: suppliers.length + 1,
        createdAt: new Date().toISOString(),
        isActive: true,
        ...supplierData
      } as Supplier;
      
      setSuppliers(prev => [...prev, newSupplier]);
      showSuccess('Fornecedor cadastrado com sucesso!');
    }
    
    setShowModal(false);
    setEditingSupplier(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Fornecedor</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CNPJ ou contato..."
            className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">{supplier.name}</h3>
                  <p className="text-sm text-gray-600">{supplier.cnpj}</p>
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setViewingSupplier(supplier)}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Ver detalhes"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setEditingSupplier(supplier);
                    setShowModal(true);
                  }}
                  className="text-green-600 hover:text-green-800 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(supplier.id)}
                  className="text-red-600 hover:text-red-800 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center">
                <Phone className="w-4 h-4 text-gray-400 mr-2" />
                <span>{supplier.phone}</span>
              </div>
              <div className="flex items-center">
                <Mail className="w-4 h-4 text-gray-400 mr-2" />
                <span>{supplier.email}</span>
              </div>
              <div className="flex items-center">
                <User className="w-4 h-4 text-gray-400 mr-2" />
                <span>Contato: {supplier.contact}</span>
              </div>
              {supplier.category && (
                <div className="flex items-center">
                  <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                    {supplier.category}
                  </span>
                </div>
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              <p className="text-sm text-gray-600">{supplier.address}</p>
            </div>
          </div>
        ))}
        {filteredSuppliers.length === 0 && (
          <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">Nenhum fornecedor encontrado</p>
          </div>
        )}
      </div>

      {/* Supplier Form Modal */}
      {showModal && (
        <SupplierForm
          supplier={editingSupplier}
          onSave={handleSave}
          onClose={() => {
            setShowModal(false);
            setEditingSupplier(null);
          }}
        />
      )}

      {/* Supplier View Modal */}
      {viewingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full">
            <div className="p-6 border-b flex items-center justify-between">
              <h2 className="text-xl font-semibold">Detalhes do Fornecedor</h2>
              <button
                onClick={() => setViewingSupplier(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Nome</p>
                  <p className="font-medium">{viewingSupplier.name}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">CNPJ</p>
                  <p className="font-medium">{viewingSupplier.cnpj}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Telefone</p>
                  <p className="font-medium">{viewingSupplier.phone}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">E-mail</p>
                  <p className="font-medium">{viewingSupplier.email}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Contato</p>
                  <p className="font-medium">{viewingSupplier.contact}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <p className={`font-medium ${viewingSupplier.isActive ? 'text-green-600' : 'text-red-600'}`}>
                    {viewingSupplier.isActive ? 'Ativo' : 'Inativo'}
                  </p>
                </div>
                {viewingSupplier.category && (
                  <div>
                    <p className="text-sm text-gray-600">Categoria</p>
                    <p className="font-medium">{viewingSupplier.category}</p>
                  </div>
                )}
              </div>

              <div>
                <p className="text-sm text-gray-600">Endereço</p>
                <p className="font-medium">{viewingSupplier.address}</p>
              </div>

              <div>
                <p className="text-sm text-gray-600">Data de Cadastro</p>
                <p className="font-medium">
                  {new Date(viewingSupplier.createdAt).toLocaleDateString()}
                </p>
              </div>
            </div>

            <div className="p-6 border-t flex justify-end space-x-3">
              <button
                onClick={() => setViewingSupplier(null)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Fechar
              </button>
              <button
                onClick={() => {
                  setEditingSupplier(viewingSupplier);
                  setViewingSupplier(null);
                  setShowModal(true);
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

export default SuppliersView;