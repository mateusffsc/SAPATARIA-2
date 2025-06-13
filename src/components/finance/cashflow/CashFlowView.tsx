import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell, PieChart, Pie } from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Calendar, ArrowUpCircle, ArrowDownCircle, Plus, Edit, Trash2, Building2, ArrowRightLeft } from 'lucide-react';
import { FinancialService, FinancialTransaction, CashFlowData } from '../../../services/financialService';
import { CashService } from '../../../services/cashService';
import { formatCurrency } from '../../../utils/currencyUtils';
import { useAppContext } from '../../../context/AppContext';
import { getCurrentDate } from '../../../utils/formatters';
import { formatSaoPauloDate, toSaoPauloDate } from '../../../utils/dateUtils';

const CashFlowView: React.FC = () => {
  const { bankAccounts, setModalType, setShowModal } = useAppContext();
  
  // Get current date in YYYY-MM-DD format with correct timezone
  const today = getCurrentDate();
  
  const [dateRange, setDateRange] = useState({
    startDate: '2025-06-01',
    endDate: today
  });
  
  const [cashFlowData, setCashFlowData] = useState<CashFlowData[]>([]);
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [categorySummary, setCategorySummary] = useState<{ category: string; amount: number; type: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTransactionModal, setShowTransactionModal] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<FinancialTransaction | null>(null);
  const [transactionForm, setTransactionForm] = useState({
    type: 'income' as 'income' | 'expense' | 'transfer',
    amount: '',
    description: '',
    customDescription: '',
    category: '',
    payment_method: '',
    date: today
  });
  const [balance, setBalance] = useState<{ cash: number } | null>(null);
  const [accountBalances, setAccountBalances] = useState<{ id: number; name: string; balance: number }[]>([]);

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

  const loadData = async () => {
    try {
      setLoading(true);
      
      const [cashFlow, transactionsList, categories, balance] = await Promise.all([
        FinancialService.getCashFlowData(dateRange.startDate, dateRange.endDate),
        FinancialService.getTransactionsByDateRange(dateRange.startDate, dateRange.endDate),
        FinancialService.getCategorySummary(dateRange.startDate, dateRange.endDate),
        CashService.getBalance()
      ]);
      
      setCashFlowData(cashFlow);
      setTransactions(transactionsList);
      setCategorySummary(categories);
      setBalance(balance);
      
      // Extract account balances
      setAccountBalances(
        bankAccounts.map(account => ({
          id: account.id,
          name: account.name,
          balance: account.balance
        }))
      );
    } catch (error) {
      console.error('Error loading financial data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dateRange, bankAccounts]);

  const handleOpenTransactionModal = () => {
    setModalType('transaction');
    setShowModal(true);
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    setEditingTransaction(transaction);
    setTransactionForm({
      type: transaction.type,
      amount: Math.abs(transaction.amount).toString(),
      description: transaction.description,
      customDescription: transaction.category === 'Outros' ? transaction.description : '',
      category: transaction.category,
      payment_method: transaction.payment_method || '',
      date: transaction.date
    });
    setShowTransactionModal(true);
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação?')) {
      try {
        await FinancialService.deleteTransaction(id);
        await loadData();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        alert('Erro ao excluir transação');
      }
    }
  };

  // Calculate summary statistics
  const summary = cashFlowData.reduce(
    (acc, day) => ({
      totalIncome: acc.totalIncome + day.income,
      totalExpenses: acc.totalExpenses + day.expenses,
      netBalance: acc.netBalance + day.balance
    }),
    { totalIncome: 0, totalExpenses: 0, netBalance: 0 }
  );

  const finalBalance = cashFlowData.length > 0 ? cashFlowData[cashFlowData.length - 1].running_balance : 0;

  // Prepare chart data
  const chartData = cashFlowData.map(day => ({
    date: new Date(day.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' }),
    fullDate: day.date,
    income: day.income,
    expenses: day.expenses,
    balance: day.balance,
    runningBalance: day.running_balance
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fluxo de Caixa</h1>
        
        <div className="flex items-center space-x-4">
          <button
            onClick={handleOpenTransactionModal}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Transação</span>
          </button>
          
          <div className="flex space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Inicial</label>
              <input
                type="date"
                value={dateRange.startDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Data Final</label>
              <input
                type="date"
                value={dateRange.endDate}
                onChange={(e) => setDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Account Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {accountBalances.map(account => (
          <div key={account.id} className="bg-white p-6 rounded-lg shadow">
            <div className="flex items-center">
              <div className="p-2 rounded-lg bg-blue-100">
                <Building2 className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{account.name}</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-green-100">
              <ArrowUpCircle className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <ArrowDownCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Saldo em Caixa</p>
              <p className="text-2xl font-bold text-blue-600">
                {formatCurrency(balance?.cash || 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${finalBalance >= 0 ? 'bg-purple-100' : 'bg-red-100'}`}>
              <TrendingUp className={`w-6 h-6 ${finalBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`} />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Saldo Acumulado</p>
              <p className={`text-2xl font-bold ${finalBalance >= 0 ? 'text-purple-600' : 'text-red-600'}`}>
                {formatCurrency(finalBalance)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow Chart */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Fluxo de Caixa Diário</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => formatCurrency(value)}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Line 
                type="monotone" 
                dataKey="income" 
                stroke="#10B981" 
                name="Receitas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="expenses" 
                stroke="#EF4444" 
                name="Despesas"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="runningBalance" 
                stroke="#3B82F6" 
                name="Saldo Acumulado"
                strokeWidth={3}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Category Summary */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-4">Resumo por Categoria</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categorySummary.slice(0, 8)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="category" angle={-45} textAnchor="end" height={80} />
              <YAxis />
              <Tooltip formatter={(value: number) => formatCurrency(value)} />
              <Bar 
                dataKey="amount" 
                fill={(entry) => entry.type === 'income' ? '#10B981' : '#EF4444'}
                name="Valor"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-6 border-b">
          <h2 className="text-lg font-semibold">Transações do Período</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta/Destino</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {transactions.map((transaction) => {
                const sourceAccount = transaction.source_account_id 
                  ? bankAccounts.find(a => a.id === transaction.source_account_id)?.name 
                  : '';
                
                const destinationAccount = transaction.destination_account_id 
                  ? bankAccounts.find(a => a.id === transaction.destination_account_id)?.name 
                  : '';
                
                return (
                  <tr key={transaction.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      {formatSaoPauloDate(transaction.created_at)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        transaction.type === 'income' ? 'bg-green-100 text-green-800' : 
                        transaction.type === 'expense' ? 'bg-red-100 text-red-800' :
                        'bg-blue-100 text-blue-800'
                      }`}>
                        {transaction.type === 'income' ? 'Receita' : 
                         transaction.type === 'expense' ? 'Despesa' : 
                         'Transferência'}
                      </span>
                    </td>
                    <td className="px-6 py-4">{transaction.description}</td>
                    <td className="px-6 py-4">{transaction.category}</td>
                    <td className="px-6 py-4">
                      {transaction.type === 'transfer' ? (
                        <div className="flex items-center">
                          <span>{sourceAccount}</span>
                          <ArrowRightLeft className="w-4 h-4 mx-1" />
                          <span>{destinationAccount}</span>
                        </div>
                      ) : (
                        transaction.type === 'income' ? destinationAccount : sourceAccount
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <span className={
                        transaction.type === 'income' ? 'text-green-600 font-medium' : 
                        transaction.type === 'expense' ? 'text-red-600 font-medium' : 
                        'text-blue-600 font-medium'
                      }>
                        {transaction.type === 'income' ? '+' : 
                         transaction.type === 'expense' ? '-' : 
                         ''} {formatCurrency(Math.abs(transaction.amount))}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {transaction.reference_type === 'manual' && (
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditTransaction(transaction)}
                            className="text-blue-600 hover:text-blue-800"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteTransaction(transaction.id)}
                            className="text-red-600 hover:text-red-800"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default CashFlowView;