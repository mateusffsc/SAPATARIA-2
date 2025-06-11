import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../../context/AppContext';
import { X } from 'lucide-react';
import { formatCurrency } from '../../../utils/currencyUtils';
import { BankAccount } from '../../../types';

const TransactionModal: React.FC = () => {
  const { 
    setShowModal, 
    setModalType, 
    createFinancialTransaction,
    bankAccounts,
    paymentMethods
  } = useAppContext();

  const [transactionForm, setTransactionForm] = useState({
    type: 'income' as 'income' | 'expense' | 'transfer',
    amount: '',
    description: '',
    customDescription: '',
    category: '',
    payment_method: '',
    date: new Date().toISOString().split('T')[0],
    source_account_id: '',
    destination_account_id: ''
  });

  // Set default account on load
  useEffect(() => {
    if (bankAccounts.length > 0) {
      // Find the cash account
      const cashAccount = bankAccounts.find(account => account.name.toLowerCase() === 'caixa');
      if (cashAccount) {
        setTransactionForm(prev => ({
          ...prev,
          source_account_id: cashAccount.id.toString(),
          destination_account_id: cashAccount.id.toString()
        }));
      }
    }
  }, [bankAccounts]);

  const incomeCategories = [
    'Serviços',
    'Produtos',
    'Consultoria',
    'Outros'
  ];

  const expenseCategories = [
    'Materiais e Insumos',
    'Aluguel',
    'Energia Elétrica',
    'Telefone/Internet',
    'Equipamentos',
    'Marketing',
    'Impostos',
    'Salários',
    'Manutenção',
    'Outros'
  ];

  const handleSaveTransaction = async () => {
    try {
      const amount = parseFloat(transactionForm.amount);
      if (isNaN(amount) || amount <= 0) {
        alert('Por favor, insira um valor válido');
        return;
      }

      if (transactionForm.type === 'transfer') {
        if (!transactionForm.source_account_id || !transactionForm.destination_account_id) {
          alert('Selecione as contas de origem e destino');
          return;
        }

        if (transactionForm.source_account_id === transactionForm.destination_account_id) {
          alert('As contas de origem e destino não podem ser iguais');
          return;
        }
      } else {
        if (transactionForm.category === 'Outros' && !transactionForm.customDescription.trim()) {
          alert('Descrição é obrigatória quando categoria é "Outros"');
          return;
        }

        if (!transactionForm.category) {
          alert('Selecione uma categoria');
          return;
        }
        
        if (!transactionForm.payment_method) {
          alert('Selecione uma forma de pagamento');
          return;
        }
      }

      const transactionData: any = {
        type: transactionForm.type,
        amount,
        description: transactionForm.type === 'transfer' 
          ? transactionForm.description 
          : (transactionForm.category === 'Outros' ? transactionForm.customDescription : transactionForm.description),
        category: transactionForm.type === 'transfer' ? 'Transferência Interna' : transactionForm.category,
        payment_method: transactionForm.payment_method,
        date: transactionForm.date,
        created_by: 'Admin',
        reference_type: transactionForm.type === 'transfer' ? 'transfer' : 'manual'
      };

      // Add account IDs for transfers
      if (transactionForm.type === 'transfer') {
        transactionData.source_account_id = parseInt(transactionForm.source_account_id);
        transactionData.destination_account_id = parseInt(transactionForm.destination_account_id);
      } else {
        // For regular transactions, use the selected account
        if (transactionForm.source_account_id) {
          if (transactionForm.type === 'income') {
            transactionData.destination_account_id = parseInt(transactionForm.source_account_id);
          } else {
            transactionData.source_account_id = parseInt(transactionForm.source_account_id);
          }
        }
      }

      await createFinancialTransaction(transactionData);
      setShowModal(false);
      setModalType('');
    } catch (error) {
      console.error('Error saving transaction:', error);
      alert('Erro ao salvar transação: ' + (error instanceof Error ? error.message : 'Erro desconhecido'));
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex justify-between items-center">
          <h3 className="text-lg font-semibold">Nova Transação</h3>
          <button
            onClick={() => {
              setShowModal(false);
              setModalType('');
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={transactionForm.type}
              onChange={(e) => setTransactionForm(prev => ({ 
                ...prev, 
                type: e.target.value as 'income' | 'expense' | 'transfer',
                category: '', // Reset category when type changes
                source_account_id: '',
                destination_account_id: ''
              }))}
            >
              <option value="income">Receita</option>
              <option value="expense">Despesa</option>
              <option value="transfer">Transferência</option>
            </select>
          </div>

          {transactionForm.type === 'transfer' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Origem</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={transactionForm.source_account_id}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, source_account_id: e.target.value }))}
                >
                  <option value="">Selecione a conta de origem</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta de Destino</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={transactionForm.destination_account_id}
                  onChange={(e) => setTransactionForm(prev => ({ ...prev, destination_account_id: e.target.value }))}
                >
                  <option value="">Selecione a conta de destino</option>
                  {bankAccounts.map(account => (
                    <option key={account.id} value={account.id}>
                      {account.name} ({formatCurrency(account.balance)})
                    </option>
                  ))}
                </select>
              </div>
            </>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={transactionForm.source_account_id}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, source_account_id: e.target.value }))}
              >
                <option value="">Selecione a conta</option>
                {bankAccounts.map(account => (
                  <option key={account.id} value={account.id}>
                    {account.name} ({formatCurrency(account.balance)})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Valor</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={transactionForm.amount}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0,00"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={transactionForm.description}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, description: e.target.value }))}
              placeholder={transactionForm.type === 'transfer' ? 'Transferência entre contas' : 'Descrição da transação'}
            />
          </div>

          {transactionForm.type !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={transactionForm.category}
                onChange={(e) => {
                  const newCategory = e.target.value;
                  setTransactionForm(prev => ({ 
                    ...prev, 
                    category: newCategory,
                    customDescription: newCategory !== 'Outros' ? '' : prev.customDescription 
                  }));
                }}
              >
                <option value="">Selecione uma categoria</option>
                {(transactionForm.type === 'income' ? incomeCategories : expenseCategories).map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          )}

          {transactionForm.category === 'Outros' && (
            <div className="transition-all duration-300 ease-in-out">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição personalizada</label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={transactionForm.customDescription}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value.length <= 100) {
                    setTransactionForm(prev => ({ ...prev, customDescription: value }));
                  }
                }}
                placeholder="Ex: Venda de equipamento usado, Taxa bancária..."
                minLength={3}
                maxLength={100}
                required
                autoFocus
              />
              {transactionForm.customDescription.length < 3 && transactionForm.customDescription.length > 0 && (
                <p className="mt-1 text-sm text-red-600">Mínimo de 3 caracteres</p>
              )}
              <p className="mt-1 text-sm text-gray-500">
                {transactionForm.customDescription.length}/100 caracteres
              </p>
            </div>
          )}

          {transactionForm.type !== 'transfer' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Forma de Pagamento</label>
              <select
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                value={transactionForm.payment_method}
                onChange={(e) => setTransactionForm(prev => ({ ...prev, payment_method: e.target.value }))}
              >
                <option value="">Selecione uma forma de pagamento</option>
                {paymentMethods.map(method => (
                  <option key={method.id} value={method.name}>{method.name}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Data</label>
            <input
              type="date"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={transactionForm.date}
              onChange={(e) => setTransactionForm(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={() => {
              setShowModal(false);
              setModalType('');
            }}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSaveTransaction}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Salvar
          </button>
        </div>
      </div>
    </div>
  );
};

export default TransactionModal;