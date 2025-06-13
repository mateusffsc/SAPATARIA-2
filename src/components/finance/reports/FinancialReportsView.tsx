import React, { useState, useEffect } from 'react';
import { Calendar, Filter, Download, FileText, DollarSign, TrendingUp, TrendingDown, RefreshCw, X, ShoppingBag, ArrowRight } from 'lucide-react';
import { FinancialService, FinancialTransaction } from '../../../services/financialService';
import { formatCurrency } from '../../../utils/currencyUtils';
import DateRangePicker from './DateRangePicker';
import TransactionTable from './TransactionTable';
import ExportModal from './ExportModal';
import { useToast } from '../../../components/shared/ToastContainer';
import { OrderService } from '../../../services/orderService';
import { ProductSaleService } from '../../../services/productSaleService';
import { useAppContext } from '../../../context/AppContext';

interface FilterState {
  dateRange: {
    startDate: string;
    endDate: string;
    preset: 'today' | 'week' | 'month' | 'custom';
  };
  movementType: 'all' | 'income' | 'expense' | 'transfer';
  paymentMethod: string;
  category: string;
  source: 'all' | 'services' | 'products' | 'manual' | 'transfer';
}

const FinancialReportsView: React.FC = () => {
  const [transactions, setTransactions] = useState<FinancialTransaction[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<FinancialTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [runningBalance, setRunningBalance] = useState(0);
  const { showSuccess, showError } = useToast();
  const { setOrders, setProductSales, setCurrentView, setModalType, setFormData, setShowModal } = useAppContext();

  // Get current date in YYYY-MM-DD format
  const today = new Date().toISOString().split('T')[0];

  const [filters, setFilters] = useState<FilterState>({
    dateRange: {
      startDate: today,
      endDate: today,
      preset: 'today'
    },
    movementType: 'all',
    paymentMethod: '',
    category: '',
    source: 'all'
  });

  const [availableFilters, setAvailableFilters] = useState({
    paymentMethods: [] as string[],
    categories: [] as string[],
    sources: ['all', 'services', 'products', 'manual', 'transfer']
  });

  useEffect(() => {
    loadTransactions();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [transactions, filters]);

  const loadTransactions = async () => {
    try {
      setLoading(true);
      const data = await FinancialService.getAllTransactions();
      
      // Log the data to see what's coming back
      console.log('Loaded transactions:', data);
      console.log('Expenses:', data.filter(t => t.type === 'expense'));
      console.log('Transfers:', data.filter(t => t.type === 'transfer'));
      
      setTransactions(data);

      // Extract unique payment methods and categories for filters
      const paymentMethods = [...new Set(data.map(t => t.payment_method).filter(Boolean))];
      const categories = [...new Set(data.map(t => t.category))];
      
      setAvailableFilters({
        paymentMethods,
        categories,
        sources: ['all', 'services', 'products', 'manual', 'transfer']
      });
    } catch (error) {
      console.error('Error loading transactions:', error);
      showError('Erro ao carregar transações', 'Não foi possível carregar as transações financeiras.');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...transactions];

    // Date range filter
    filtered = filtered.filter(transaction => {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(filters.dateRange.startDate);
      const endDate = new Date(filters.dateRange.endDate);
      
      // Set time to beginning/end of day for proper comparison
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);
      
      return transactionDate >= startDate && transactionDate <= endDate;
    });

    // Movement type filter
    if (filters.movementType !== 'all') {
      filtered = filtered.filter(transaction => transaction.type === filters.movementType);
    }

    // Payment method filter
    if (filters.paymentMethod) {
      filtered = filtered.filter(transaction => transaction.payment_method === filters.paymentMethod);
    }

    // Category filter
    if (filters.category) {
      filtered = filtered.filter(transaction => transaction.category === filters.category);
    }

    // Source filter
    if (filters.source !== 'all') {
      if (filters.source === 'services') {
        filtered = filtered.filter(transaction => 
          transaction.reference_type === 'order' || 
          transaction.category === 'Serviços'
        );
      } else if (filters.source === 'products') {
        filtered = filtered.filter(transaction => 
          transaction.reference_type === 'sale' || 
          transaction.category === 'Produtos'
        );
      } else if (filters.source === 'manual') {
        filtered = filtered.filter(transaction => 
          transaction.reference_type === 'manual'
        );
      } else if (filters.source === 'transfer') {
        filtered = filtered.filter(transaction => 
          transaction.type === 'transfer'
        );
      }
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Calculate running balance
    calculateRunningBalance(filtered);
  };

  const calculateRunningBalance = (transactions: FinancialTransaction[]) => {
    let balance = 0;
    const transactionsWithBalance = transactions
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map(transaction => {
        if (transaction.type === 'income') {
          balance += Math.abs(transaction.amount);
        } else if (transaction.type === 'expense') {
          balance -= Math.abs(transaction.amount);
        }
        // Transfers don't affect the overall balance
        return { ...transaction, runningBalance: balance };
      });
    
    setRunningBalance(balance);
    setFilteredTransactions(transactionsWithBalance.reverse());
  };

  const handleDateRangeChange = (startDate: string, endDate: string, preset: string) => {
    setFilters(prev => ({
      ...prev,
      dateRange: {
        startDate,
        endDate,
        preset: preset as any
      }
    }));
  };

  const handleFilterChange = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const clearFilters = () => {
    // Get current date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];
    
    setFilters({
      dateRange: {
        startDate: today,
        endDate: today,
        preset: 'today'
      },
      movementType: 'all',
      paymentMethod: '',
      category: '',
      source: 'all'
    });
  };

  const calculateSummary = () => {
    const income = filteredTransactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const expenses = filteredTransactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Calculate service and product income
    const serviceIncome = filteredTransactions
      .filter(t => t.type === 'income' && (t.reference_type === 'order' || t.category === 'Serviços'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
    const productIncome = filteredTransactions
      .filter(t => t.type === 'income' && (t.reference_type === 'sale' || t.category === 'Produtos'))
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    // Calculate transfer volume
    const transferVolume = filteredTransactions
      .filter(t => t.type === 'transfer')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    return {
      totalIncome: income,
      totalExpenses: expenses,
      netFlow: income - expenses,
      serviceIncome,
      productIncome,
      transferVolume
    };
  };

  const handleDeleteTransaction = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta transação? Esta ação não pode ser desfeita.')) {
      try {
        await FinancialService.deleteTransaction(id);
        showSuccess('Transação excluída com sucesso!');
        await loadTransactions();
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Erro ao excluir transação', 'Não foi possível excluir a transação. Tente novamente.');
      }
    }
  };

  const handleEditTransaction = (transaction: FinancialTransaction) => {
    // This would be implemented if we had a transaction edit modal
    console.log('Edit transaction:', transaction);
    showError('Funcionalidade em desenvolvimento', 'A edição de transações será implementada em breve.');
  };

  // Load related data for reference links
  const loadRelatedData = async () => {
    try {
      // Load orders
      const orders = await OrderService.getAll();
      setOrders(orders);
      
      // Load product sales
      const sales = await ProductSaleService.getAll();
      setProductSales(sales);
    } catch (error) {
      console.error('Error loading related data:', error);
    }
  };

  // Load related data on component mount
  useEffect(() => {
    loadRelatedData();
  }, []);

  const summary = calculateSummary();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Relatórios Financeiros</h1>
          <p className="text-gray-600">Análise detalhada do fluxo de caixa</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Download className="w-4 h-4" />
            <span>Exportar</span>
          </button>
          
          <button
            onClick={loadTransactions}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {/* Total Income */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Receitas</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(summary.totalIncome)}
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 space-y-1">
            <div className="flex items-center text-sm text-green-600">
              <FileText className="w-4 h-4 mr-1" />
              <span>Serviços: {formatCurrency(summary.serviceIncome)}</span>
            </div>
            <div className="flex items-center text-sm text-green-600">
              <ShoppingBag className="w-4 h-4 mr-1" />
              <span>Produtos: {formatCurrency(summary.productIncome)}</span>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Total de Despesas</p>
              <p className="text-2xl font-bold text-red-600">
                {formatCurrency(summary.totalExpenses)}
              </p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <TrendingDown className="w-6 h-6 text-red-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-red-600">
              <TrendingDown className="w-4 h-4 mr-1" />
              <span>Saídas</span>
            </div>
          </div>
        </div>

        {/* Net Flow */}
        <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${
          summary.netFlow >= 0 ? 'border-blue-500' : 'border-orange-500'
        }`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Fluxo Líquido</p>
              <p className={`text-2xl font-bold ${
                summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`}>
                {formatCurrency(summary.netFlow)}
              </p>
            </div>
            <div className={`p-3 rounded-full ${
              summary.netFlow >= 0 ? 'bg-blue-100' : 'bg-orange-100'
            }`}>
              <DollarSign className={`w-6 h-6 ${
                summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
              }`} />
            </div>
          </div>
          <div className="mt-4">
            <div className={`flex items-center text-sm ${
              summary.netFlow >= 0 ? 'text-blue-600' : 'text-orange-600'
            }`}>
              {summary.netFlow >= 0 ? (
                <TrendingUp className="w-4 h-4 mr-1" />
              ) : (
                <TrendingDown className="w-4 h-4 mr-1" />
              )}
              <span>{summary.netFlow >= 0 ? 'Positivo' : 'Negativo'}</span>
            </div>
          </div>
        </div>

        {/* Transfers */}
        <div className="bg-white p-6 rounded-lg shadow border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 mb-1">Transferências</p>
              <p className="text-2xl font-bold text-purple-600">
                {formatCurrency(summary.transferVolume)}
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <ArrowRight className="w-6 h-6 text-purple-600" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex items-center text-sm text-purple-600">
              <ArrowRight className="w-4 h-4 mr-1" />
              <span>Movimentações internas</span>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros
          </h3>
          <button
            onClick={clearFilters}
            className="text-gray-500 hover:text-gray-700 flex items-center space-x-1"
          >
            <X className="w-4 h-4" />
            <span>Limpar</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Date Range */}
          <div>
            <DateRangePicker
              startDate={filters.dateRange.startDate}
              endDate={filters.dateRange.endDate}
              preset={filters.dateRange.preset}
              onChange={handleDateRangeChange}
            />
          </div>

          {/* Movement Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tipo de Movimento
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.movementType}
              onChange={(e) => handleFilterChange('movementType', e.target.value)}
            >
              <option value="all">Todos</option>
              <option value="income">Receitas</option>
              <option value="expense">Despesas</option>
              <option value="transfer">Transferências</option>
            </select>
          </div>

          {/* Source */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Origem
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.source}
              onChange={(e) => handleFilterChange('source', e.target.value)}
            >
              <option value="all">Todas</option>
              <option value="services">Serviços</option>
              <option value="products">Produtos</option>
              <option value="manual">Manual</option>
              <option value="transfer">Transferências</option>
            </select>
          </div>

          {/* Payment Method */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Forma de Pagamento
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.paymentMethod}
              onChange={(e) => handleFilterChange('paymentMethod', e.target.value)}
            >
              <option value="">Todas</option>
              {availableFilters.paymentMethods.map(method => (
                <option key={method} value={method}>{method}</option>
              ))}
            </select>
          </div>

          {/* Category */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Categoria
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              value={filters.category}
              onChange={(e) => handleFilterChange('category', e.target.value)}
            >
              <option value="">Todas</option>
              {availableFilters.categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600">
            Mostrando {filteredTransactions.length} transações de {transactions.length} total
            {filters.dateRange.preset !== 'custom' && (
              <span> • Período: {filters.dateRange.preset === 'today' ? 'Hoje' : 
                filters.dateRange.preset === 'week' ? 'Esta semana' : 'Este mês'}</span>
            )}
            {filters.movementType !== 'all' && (
              <span> • Tipo: {
                filters.movementType === 'income' ? 'Receitas' : 
                filters.movementType === 'expense' ? 'Despesas' : 
                'Transferências'
              }</span>
            )}
            {filters.source !== 'all' && (
              <span> • Origem: {
                filters.source === 'services' ? 'Serviços' : 
                filters.source === 'products' ? 'Produtos' : 
                filters.source === 'transfer' ? 'Transferências' :
                'Manual'
              }</span>
            )}
          </p>
        </div>
      </div>

      {/* Transactions Table */}
      <TransactionTable 
        transactions={filteredTransactions}
        onRefresh={loadTransactions}
        onDelete={handleDeleteTransaction}
        onEdit={handleEditTransaction}
      />

      {/* Export Modal */}
      {showExportModal && (
        <ExportModal
          transactions={filteredTransactions}
          summary={summary}
          filters={filters}
          onClose={() => setShowExportModal(false)}
        />
      )}
    </div>
  );
};

export default FinancialReportsView;