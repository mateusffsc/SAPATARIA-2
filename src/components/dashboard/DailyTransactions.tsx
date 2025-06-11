import React, { useState, useEffect } from 'react';
import { Calendar, ArrowUpCircle, ArrowDownCircle, RefreshCw, Search, DollarSign, Plus } from 'lucide-react';
import { FinancialService, FinancialTransaction } from '../../services/financialService';
import { formatCurrency } from '../../utils/currencyUtils';
import { useToast } from '../shared/ToastContainer';
import { useAppContext } from '../../context/AppContext';

const DailyTransactions: React.FC = () => {
  const { showError } = useToast();
  const { setModalType, setFormData, setShowModal, bankAccounts } = useAppContext();
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [todayStats, setTodayStats] = useState({
    income: 0,
    expenses: 0,
    balance: 0
  });

  // Get today's date
  const today = new Date().toISOString().split('T')[0];

  const loadData = async () => {
    try {
      setLoading(true);
      
      const todayTransactions = await FinancialService.getTransactionsByDateRange(today, today);
      
      // Find the cash account
      const cashAccount = bankAccounts.find(account => account.name.toLowerCase() === 'caixa');
      
      // Filter transactions to only show cash expenses
      const filteredTransactions = todayTransactions.filter(t => {
        // For expenses, only show those paid with cash
        if (t.type === 'expense') {
          return t.payment_method?.toLowerCase().includes('dinheiro') || 
                 (cashAccount && t.source_account_id === cashAccount.id);
        }
        // Show all income transactions
        return true;
      });
      
      setTransactions(filteredTransactions);
      
      // Calculate today's stats
      const income = filteredTransactions
        .filter(t => t.type === 'income')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      const expenses = filteredTransactions
        .filter(t => t.type === 'expense')
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      setTodayStats({
        income,
        expenses,
        balance: income - expenses
      });
    } catch (error) {
      console.error('Error loading financial data:', error);
      showError('Erro ao carregar dados financeiros', 'Não foi possível carregar as transações do dia.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [bankAccounts]);

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(transaction => 
    transaction.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    transaction.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (transaction.payment_method && transaction.payment_method.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleNewTransaction = () => {
    // Allow all users to create new transactions
    setModalType('transaction');
    setFormData({});
    setShowModal(true);
  };

  return (
    <div className="bg-white rounded-lg shadow">
      <div className="p-4 border-b flex items-center justify-between">
        <div className="flex items-center">
          <Calendar className="w-5 h-5 text-blue-600 mr-2" />
          <h2 className="text-lg font-semibold">Movimentações do Dia</h2>
        </div>
        <div className="flex space-x-2">
          <button
            onClick={handleNewTransaction}
            className="p-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center"
            title="Nova Transação"
          >
            <Plus className="w-4 h-4 mr-1" />
            <span className="text-sm">Nova Transação</span>
          </button>
          <button
            onClick={loadData}
            className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100 transition-colors"
            title="Atualizar"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 p-4 border-b">
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1 flex items-center justify-center">
            <ArrowUpCircle className="w-4 h-4 text-green-600 mr-1" />
            Receitas
          </p>
          <p className="text-lg font-bold text-green-600">{formatCurrency(todayStats.income)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1 flex items-center justify-center">
            <ArrowDownCircle className="w-4 h-4 text-red-600 mr-1" />
            Despesas (Dinheiro)
          </p>
          <p className="text-lg font-bold text-red-600">{formatCurrency(todayStats.expenses)}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-600 mb-1 flex items-center justify-center">
            <DollarSign className="w-4 h-4 text-blue-600 mr-1" />
            Saldo
          </p>
          <p className={`text-lg font-bold ${todayStats.balance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>
            {formatCurrency(todayStats.balance)}
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="p-4 border-b">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar transações..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* Transactions List */}
      <div className="overflow-y-auto max-h-[400px]">
        {loading ? (
          <div className="flex justify-center items-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredTransactions.length > 0 ? (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Hora</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Descrição</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Forma</th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {new Date(transaction.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      transaction.type === 'income' ? 'bg-green-100 text-green-800' : 
                      transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {transaction.type === 'income' ? 'Receita' : 
                       transaction.type === 'expense' ? 'Despesa' : 
                       'Transf.'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-900">
                    <div className="truncate max-w-[200px]" title={transaction.description}>
                      {transaction.description}
                    </div>
                    <div className="text-xs text-gray-500">{transaction.category}</div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                    {transaction.payment_method || '-'}
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                    <span className={
                      transaction.type === 'income' ? 'text-green-600' : 
                      transaction.type === 'expense' ? 'text-red-600' : 
                      'text-blue-600'
                    }>
                      {transaction.type === 'income' ? '+' : 
                       transaction.type === 'expense' ? '-' : 
                       '↔'} {formatCurrency(Math.abs(transaction.amount))}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <div className="text-center py-8 text-gray-500">
            {searchTerm ? (
              <p>Nenhuma transação encontrada para "{searchTerm}"</p>
            ) : (
              <p>Nenhuma transação em dinheiro registrada hoje</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default DailyTransactions;