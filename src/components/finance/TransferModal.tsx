import React, { useState, useEffect } from 'react';
import { X, ArrowRight, Save } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { CashService } from '../../services/cashService';
import { useToast } from '../shared/ToastContainer';

interface BankAccount {
  id: number;
  name: string;
  balance: number;
}

interface TransferModalProps {
  accounts: BankAccount[];
  onClose: () => void;
  onSuccess: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ accounts, onClose, onSuccess }) => {
  const { showSuccess, showError } = useToast();
  
  const [formData, setFormData] = useState({
    sourceAccountId: '',
    destinationAccountId: '',
    amount: '',
    description: '',
    paymentMethod: 'Transferência',
    date: new Date().toISOString().split('T')[0]
  });
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Set default source account to Caixa Loja if available
  useEffect(() => {
    if (accounts.length > 0) {
      const caixaLoja = accounts.find(a => a.name === 'Caixa Loja');
      if (caixaLoja) {
        setFormData(prev => ({
          ...prev,
          sourceAccountId: caixaLoja.id.toString()
        }));
      }
    }
  }, [accounts]);
  
  const validateForm = () => {
    const newErrors: Record<string, string> = {};
    
    if (!formData.sourceAccountId) {
      newErrors.sourceAccountId = 'Selecione a conta de origem';
    }
    
    if (!formData.destinationAccountId) {
      newErrors.destinationAccountId = 'Selecione a conta de destino';
    }
    
    if (formData.sourceAccountId === formData.destinationAccountId) {
      newErrors.destinationAccountId = 'As contas de origem e destino não podem ser iguais';
    }
    
    const amount = parseFloat(formData.amount);
    if (isNaN(amount) || amount <= 0) {
      newErrors.amount = 'Digite um valor válido maior que zero';
    } else {
      // Check if source account has enough balance
      const sourceAccount = accounts.find(a => a.id.toString() === formData.sourceAccountId);
      if (sourceAccount && sourceAccount.balance < amount) {
        newErrors.amount = 'Saldo insuficiente na conta de origem';
      }
    }
    
    if (!formData.date) {
      newErrors.date = 'Selecione a data da transferência';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setLoading(true);
    
    try {
      // Get account names for better description
      const sourceAccount = accounts.find(a => a.id.toString() === formData.sourceAccountId);
      const destinationAccount = accounts.find(a => a.id.toString() === formData.destinationAccountId);
      
      // Create default description if none provided
      const description = formData.description || 
        `Transferência de ${sourceAccount?.name || 'conta'} para ${destinationAccount?.name || 'conta'}`;
      
      // Process the transfer
      await CashService.processTransfer(
        parseInt(formData.sourceAccountId),
        parseInt(formData.destinationAccountId),
        parseFloat(formData.amount),
        description,
        formData.paymentMethod,
        formData.date,
        'Admin'
      );
      
      showSuccess('Transferência realizada com sucesso!');
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error processing transfer:', error);
      showError(
        'Erro ao processar transferência', 
        error instanceof Error ? error.message : 'Não foi possível processar a transferência.'
      );
    } finally {
      setLoading(false);
    }
  };
  
  // Get account balance
  const getAccountBalance = (accountId: string) => {
    const account = accounts.find(a => a.id.toString() === accountId);
    return account ? account.balance : 0;
  };
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <ArrowRight className="w-5 h-5 mr-2 text-blue-600" />
            Nova Transferência
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
              Conta de Origem *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.sourceAccountId ? 'border-red-500' : ''
              }`}
              value={formData.sourceAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, sourceAccountId: e.target.value }))}
            >
              <option value="">Selecione a conta de origem</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
            {errors.sourceAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.sourceAccountId}</p>
            )}
            {formData.sourceAccountId && (
              <p className="text-sm text-gray-600 mt-1">
                Saldo disponível: {formatCurrency(getAccountBalance(formData.sourceAccountId))}
              </p>
            )}
          </div>
          
          <div className="flex justify-center items-center">
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-blue-600" />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Conta de Destino *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.destinationAccountId ? 'border-red-500' : ''
              }`}
              value={formData.destinationAccountId}
              onChange={(e) => setFormData(prev => ({ ...prev, destinationAccountId: e.target.value }))}
            >
              <option value="">Selecione a conta de destino</option>
              {accounts.map(account => (
                <option key={account.id} value={account.id}>
                  {account.name} - {formatCurrency(account.balance)}
                </option>
              ))}
            </select>
            {errors.destinationAccountId && (
              <p className="text-red-500 text-sm mt-1">{errors.destinationAccountId}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor *
            </label>
            <input
              type="number"
              step="0.01"
              min="0.01"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.amount ? 'border-red-500' : ''
              }`}
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0,00"
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount}</p>
            )}
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Descrição
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descrição da transferência (opcional)"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Método de Transferência
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={formData.paymentMethod}
              onChange={(e) => setFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
              placeholder="PIX, TED, DOC, etc."
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Data *
            </label>
            <input
              type="date"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.date ? 'border-red-500' : ''
              }`}
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
            {errors.date && (
              <p className="text-red-500 text-sm mt-1">{errors.date}</p>
            )}
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2 disabled:opacity-50"
              disabled={loading}
            >
              {loading ? (
                <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{loading ? 'Processando...' : 'Transferir'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransferModal;