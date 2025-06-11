import React, { useState } from 'react';
import { X, Save } from 'lucide-react';
import { useAppContext } from '../../../context/AppContext';
import SearchableSelect from '../../shared/SearchableSelect';

interface Product {
  id: number;
  name: string;
  category: string;
  brand: string;
  model: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  supplier: string;
  isActive: boolean;
  createdAt: string;
}

interface ProductFormProps {
  product: Product | null;
  onSave: (data: Partial<Product>) => void;
  onClose: () => void;
}

const ProductForm: React.FC<ProductFormProps> = ({ product, onSave, onClose }) => {
  const { suppliers } = useAppContext();
  
  const [formData, setFormData] = useState({
    name: product?.name || '',
    category: product?.category || '',
    brand: product?.brand || '',
    model: product?.model || '',
    price: product?.price || 0,
    cost: product?.cost || 0,
    stock: product?.stock || 0,
    minStock: product?.minStock || 0,
    supplier: product?.supplier || '',
    isActive: product?.isActive ?? true
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Nome é obrigatório';
    }

    if (!formData.category.trim()) {
      newErrors.category = 'Categoria é obrigatória';
    }

    if (formData.price <= 0) {
      newErrors.price = 'Preço deve ser maior que zero';
    }

    if (formData.cost <= 0) {
      newErrors.cost = 'Custo deve ser maior que zero';
    }

    if (formData.stock < 0) {
      newErrors.stock = 'Estoque não pode ser negativo';
    }

    if (formData.minStock < 0) {
      newErrors.minStock = 'Estoque mínimo não pode ser negativo';
    }

    if (!formData.supplier) {
      newErrors.supplier = 'Fornecedor é obrigatório';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSave(formData);
  };

  // Prepare supplier options for the select component
  const supplierOptions = suppliers.map(s => ({
    value: s.name,
    label: s.name,
    subtitle: s.cnpj
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {product ? 'Editar Produto' : 'Novo Produto'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              />
              {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <input
                type="text"
                required
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.category}
                onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
              />
              {errors.category && <p className="text-red-500 text-sm mt-1">{errors.category}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.brand}
                onChange={(e) => setFormData(prev => ({ ...prev, brand: e.target.value }))}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.model}
                onChange={(e) => setFormData(prev => ({ ...prev, model: e.target.value }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço de Venda</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.price}
                onChange={(e) => setFormData(prev => ({ ...prev, price: Number(e.target.value) }))}
              />
              {errors.price && <p className="text-red-500 text-sm mt-1">{errors.price}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Custo</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.cost}
                onChange={(e) => setFormData(prev => ({ ...prev, cost: Number(e.target.value) }))}
              />
              {errors.cost && <p className="text-red-500 text-sm mt-1">{errors.cost}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Atual</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.stock}
                onChange={(e) => setFormData(prev => ({ ...prev, stock: Number(e.target.value) }))}
              />
              {errors.stock && <p className="text-red-500 text-sm mt-1">{errors.stock}</p>}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Estoque Mínimo</label>
              <input
                type="number"
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={formData.minStock}
                onChange={(e) => setFormData(prev => ({ ...prev, minStock: Number(e.target.value) }))}
              />
              {errors.minStock && <p className="text-red-500 text-sm mt-1">{errors.minStock}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Fornecedor</label>
            <SearchableSelect
              options={supplierOptions}
              value={formData.supplier}
              onChange={(value) => setFormData(prev => ({ ...prev, supplier: value as string }))}
              placeholder="Selecione um fornecedor"
              error={errors.supplier}
              required
            />
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
              Produto ativo
            </label>
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Salvar</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProductForm;