import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { Plus, Edit, Trash2, CreditCard, Building2, Clock, DollarSign } from 'lucide-react';
import { PaymentMethod } from '../../../types';
import { formatCurrency } from '../../../utils/currencyUtils';
import { supabase } from '../../../lib/supabase';

const PaymentMethodsView: React.FC = () => {
  const { paymentMethods, setPaymentMethods, banks } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    bankId: '',
    fee: 0,
    settlementDays: 0,
    isActive: true
  });

  const loadPaymentMethods = async () => {
    try {
      const { data, error } = await supabase
        .from('payment_methods')
        .select('*')
        .order('name');
      
      if (error) throw error;

      const mappedMethods = data.map(pm => ({
        id: pm.id,
        name: pm.name,
        bankId: pm.bank_id,
        fee: pm.fee,
        settlementDays: pm.settlement_days,
        isActive: pm.is_active,
        createdAt: pm.created_at
      }));

      setPaymentMethods(mappedMethods);
    } catch (error) {
      console.error('Error loading payment methods:', error);
      alert('Erro ao carregar formas de pagamento');
    }
  };

  useEffect(() => {
    loadPaymentMethods();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      alert('Nome é obrigatório');
      return;
    }

    setLoading(true);

    try {
      const methodData = {
        name: formData.name,
        bank_id: formData.bankId ? parseInt(formData.bankId) : null,
        fee: formData.fee,
        settlement_days: formData.settlementDays,
        is_active: formData.isActive
      };

      if (editingMethod) {
        const { error } = await supabase
          .from('payment_methods')
          .update(methodData)
          .eq('id', editingMethod.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('payment_methods')
          .insert([methodData]);

        if (error) throw error;
      }

      await loadPaymentMethods();
      setShowModal(false);
      setEditingMethod(null);
      setFormData({ name: '', bankId: '', fee: 0, settlementDays: 0, isActive: true });
    } catch (error) {
      console.error('Error saving payment method:', error);
      alert('Erro ao salvar forma de pagamento');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (method: PaymentMethod) => {
    setEditingMethod(method);
    setFormData({
      name: method.name,
      bankId: method.bankId?.toString() || '',
      fee: method.fee,
      settlementDays: method.settlementDays,
      isActive: method.isActive
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta forma de pagamento?')) {
      try {
        const { error } = await supabase
          .from('payment_methods')
          .delete()
          .eq('id', id);

        if (error) throw error;

        await loadPaymentMethods();
      } catch (error) {
        console.error('Error deleting payment method:', error);
        alert('Erro ao excluir forma de pagamento');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Formas de Pagamento</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Forma de Pagamento</span>
        </button>
      </div>

      {/* Payment Methods Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {paymentMethods.map(method => {
          const bank = banks.find(b => b.id === method.bankId);
          
          return (
            <div key={method.id} className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <CreditCard className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-lg font-semibold">{method.name}</h3>
                    {bank && (
                      <p className="text-sm text-gray-600">{bank.name}</p>
                    )}
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(method)}
                    className="text-blue-600 hover:text-blue-800 transition-colors"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(method.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                {bank && (
                  <div className="flex items-center">
                    <Building2 className="w-4 h-4 text-gray-400 mr-2" />
                    <span>Banco: {bank.name}</span>
                  </div>
                )}
                <div className="flex items-center">
                  <DollarSign className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Taxa: {method.fee}%</span>
                </div>
                <div className="flex items-center">
                  <Clock className="w-4 h-4 text-gray-400 mr-2" />
                  <span>Liquidação: D+{method.settlementDays}</span>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  method.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {method.isActive ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            </div>
          );
        })}
        {paymentMethods.length === 0 && (
          <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
            <p className="text-gray-500">Nenhuma forma de pagamento cadastrada</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingMethod ? 'Editar Forma de Pagamento' : 'Nova Forma de Pagamento'}
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
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.bankId}
                  onChange={(e) => setFormData(prev => ({ ...prev, bankId: e.target.value }))}
                >
                  <option value="">Selecione um banco</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Taxa (%)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.fee}
                  onChange={(e) => setFormData(prev => ({ ...prev, fee: Number(e.target.value) }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Dias para Liquidação</label>
                <input
                  type="number"
                  min="0"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.settlementDays}
                  onChange={(e) => setFormData(prev => ({ ...prev, settlementDays: Number(e.target.value) }))}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Quantidade de dias para liquidação (D+X)
                </p>
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
                  Forma de pagamento ativa
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingMethod(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                  disabled={loading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? 'Salvando...' : editingMethod ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PaymentMethodsView;