import React, { useState } from 'react';
import { X, Save, Building2 } from 'lucide-react';
import { Bank } from '../../types';
import { useToast } from '../shared/ToastContainer';

interface BankAccount {
  id: number;
  name: string;
  balance: number;
  bankId?: number;
}

interface BankAccountModalProps {
  account: BankAccount | null;
  banks: Bank[];
  onSave: (data: any) => void;
  onClose: () => void;
}

const BankAccountModal: React.FC<BankAccountModalProps> = ({ account, banks, onSave, onClose }) => {
  const { showError } = useToast();
  
  const [formData, setFormData] = useState({
    name: account?.name || '',
    bankId: account?.bankId?.toString() || '',
    initialBalance: 0 // Added initial balance field
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.name.trim()) {
      newErrors.name = 'Nome da conta é obrigatório';
    }
    
    // Special accounts (Caixa and Cofre) cannot be associated with a bank
    if ((formData.name === 'Caixa' || formData.name === 'Cofre') && formData.bankId) {
      newErrors.bankId = 'Contas especiais não podem ser associadas a bancos';
    }
    
    // Validate initial balance (only for new accounts)
    if (!account && formData.initialBalance < 0) {
      newErrors.initialBalance = 'O saldo inicial não pode ser negativo';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      showError('Verifique os campos', 'Existem campos com erros ou não preenchidos.');
      return;
    }
    
    onSave({
      name: formData.name,
      bankId: formData.bankId ? parseInt(formData.bankId) : null,
      initialBalance: formData.initialBalance // Pass the initial balance to the parent component
    });
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <Building2 className="w-5 h-5 mr-2 text-blue-600" />
            {account ? 'Editar Conta' : 'Nova Conta'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nome da Conta *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.name ? 'border-red-500' : ''
              }`}
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Conta Corrente, Poupança, etc."
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Banco (opcional)
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.bankId ? 'border-red-500' : ''
              }`}
              value={formData.bankId}
              onChange={(e) => setFormData(prev => ({ ...prev, bankId: e.target.value }))}
            >
              <option value="">Selecione um banco</option>
              {banks.map(bank => (
                <option key={bank.id} value={bank.id}>
                  {bank.name} ({bank.code})
                </option>
              ))}
            </select>
            {errors.bankId && (
              <p className="text-red-500 text-sm mt-1">{errors.bankId}</p>
            )}
            <p className="text-sm text-gray-500 mt-1">
              Associe esta conta a um banco cadastrado (opcional)
            </p>
          </div>
          
          {/* Initial Balance - Only show for new accounts */}
          {!account && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Saldo Inicial
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.initialBalance ? 'border-red-500' : ''
                }`}
                value={formData.initialBalance}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  initialBalance: parseFloat(e.target.value) || 0 
                }))}
                placeholder="0,00"
              />
              {errors.initialBalance && (
                <p className="text-red-500 text-sm mt-1">{errors.initialBalance}</p>
              )}
              <p className="text-sm text-gray-500 mt-1">
                Defina o saldo inicial desta conta
              </p>
            </div>
          )}
          
          {account && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <p className="text-sm text-gray-600">Saldo Atual</p>
              <p className="text-xl font-bold text-gray-900">{account.balance.toFixed(2)}</p>
              <p className="text-xs text-gray-500 mt-1">
                O saldo é atualizado automaticamente com base nas transações
              </p>
            </div>
          )}
          
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
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
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

export default BankAccountModal;