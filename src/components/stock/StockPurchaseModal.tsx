import React, { useState, useEffect } from 'react';
import { X, ShoppingCart, Save } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { CashService } from '../../services/cashService';
import { useToast } from '../shared/ToastContainer';

interface StockPurchaseModalProps {
  product?: any;
  onSave: (data: any) => void;
  onClose: () => void;
}

const StockPurchaseModal: React.FC<StockPurchaseModalProps> = ({ product, onSave, onClose }) => {
  const { suppliers, products, paymentMethods } = useAppContext();
  const { showError } = useToast();
  
  const [formData, setFormData] = useState({
    productId: product?.id || '',
    quantity: 1,
    unitCost: product?.cost || 0,
    totalCost: product?.cost || 0,
    supplier: product?.supplier || '',
    paymentMethod: '',
    date: new Date().toISOString().split('T')[0],
    description: ''
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Update product options when product changes
  useEffect(() => {
    if (product) {
      setFormData(prev => ({
        ...prev,
        productId: product.id,
        unitCost: product.cost,
        totalCost: product.cost * prev.quantity,
        supplier: product.supplier
      }));
    }
  }, [product]);

  // Update total cost when quantity or unit cost changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      totalCost: prev.quantity * prev.unitCost
    }));
  }, [formData.quantity, formData.unitCost]);

  // Get product options for select
  const productOptions = products.map(p => ({
    id: p.id,
    name: p.name,
    cost: p.cost,
    supplier: p.supplier
  }));

  // Get supplier options for select
  const supplierOptions = suppliers.map(s => ({
    id: s.id,
    name: s.name,
    category: s.category || 'Fornecedor'
  }));

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.productId) {
      newErrors.productId = 'Selecione um produto';
    }

    if (formData.quantity <= 0) {
      newErrors.quantity = 'A quantidade deve ser maior que zero';
    }

    if (formData.unitCost <= 0) {
      newErrors.unitCost = 'O custo unitário deve ser maior que zero';
    }

    if (!formData.supplier) {
      newErrors.supplier = 'Selecione um fornecedor';
    }

    if (!formData.paymentMethod) {
      newErrors.paymentMethod = 'Selecione uma forma de pagamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleProductChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const productId = Number(e.target.value);
    const selectedProduct = products.find(p => p.id === productId);
    
    if (selectedProduct) {
      setFormData(prev => ({
        ...prev,
        productId,
        unitCost: selectedProduct.cost,
        totalCost: selectedProduct.cost * prev.quantity,
        supplier: selectedProduct.supplier
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      // Get the selected product and supplier
      const selectedProduct = products.find(p => p.id === Number(formData.productId));
      const selectedSupplier = suppliers.find(s => s.name === formData.supplier);
      
      if (!selectedProduct) {
        showError('Produto não encontrado', 'O produto selecionado não foi encontrado.');
        return;
      }

      // Create financial transaction for the purchase
      await CashService.processOperation({
        type: 'expense',
        amount: formData.totalCost,
        description: `Compra de estoque: ${selectedProduct.name} (${formData.quantity} unid.) - ${formData.description}`,
        category: selectedSupplier?.category || 'Materiais e Insumos',
        reference_type: 'stock_purchase',
        payment_method: formData.paymentMethod,
        date: formData.date,
        created_by: 'Admin'
      });

      // Call onSave to update the product stock
      onSave({
        productId: Number(formData.productId),
        quantity: formData.quantity,
        unitCost: formData.unitCost,
        totalCost: formData.totalCost,
        supplier: formData.supplier,
        paymentMethod: formData.paymentMethod,
        date: formData.date
      });
    } catch (error) {
      console.error('Error processing purchase:', error);
      showError('Erro ao processar compra', 'Não foi possível registrar a compra. Tente novamente.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Compra de Estoque</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Produto *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.productId ? 'border-red-500' : ''
              }`}
              value={formData.productId}
              onChange={handleProductChange}
              disabled={!!product}
            >
              <option value="">Selecione um produto</option>
              {productOptions.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} - Custo: {formatCurrency(p.cost)}
                </option>
              ))}
            </select>
            {errors.productId && (
              <p className="text-red-500 text-sm mt-1">{errors.productId}</p>
            )}
          </div>

          {/* Quantity and Unit Cost */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Quantidade *
              </label>
              <input
                type="number"
                min="1"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.quantity ? 'border-red-500' : ''
                }`}
                value={formData.quantity}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  quantity: parseInt(e.target.value) || 0
                }))}
              />
              {errors.quantity && (
                <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Custo Unitário *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.unitCost ? 'border-red-500' : ''
                }`}
                value={formData.unitCost}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  unitCost: parseFloat(e.target.value) || 0
                }))}
              />
              {errors.unitCost && (
                <p className="text-red-500 text-sm mt-1">{errors.unitCost}</p>
              )}
            </div>
          </div>

          {/* Total Cost */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Custo Total
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg bg-gray-50"
              value={formatCurrency(formData.totalCost)}
              readOnly
            />
          </div>

          {/* Supplier */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fornecedor *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.supplier ? 'border-red-500' : ''
              }`}
              value={formData.supplier}
              onChange={(e) => setFormData(prev => ({ ...prev, supplier: e.target.value }))}
            >
              <option value="">Selecione um fornecedor</option>
              {supplierOptions.map(s => (
                <option key={s.id} value={s.name}>
                  {s.name} - {s.category}
                </option>
              ))}
            </select>
            {errors.supplier && (
              <p className="text-red-500 text-sm mt-1">{errors.supplier}</p>
            )}
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pagamento *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.paymentMethod ? 'border-red-500' : ''
              }`}
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
            >
              <option value="">Selecione uma forma de pagamento</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.name}>{method.name}</option>
              ))}
            </select>
            {errors.paymentMethod && (
              <p className="text-red-500 text-sm mt-1">{errors.paymentMethod}</p>
            )}
          </div>

          {/* Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data da Compra *
            </label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição Adicional
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Detalhes adicionais sobre a compra..."
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Registrar Compra</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default StockPurchaseModal;