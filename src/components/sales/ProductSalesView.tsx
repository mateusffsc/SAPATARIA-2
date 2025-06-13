import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Eye, Edit, DollarSign, Package, Calendar, User, ShoppingBag, X } from 'lucide-react';
import { formatCurrency, formatRelativeDate, highlightSearchTerm } from '../../utils/formatters';
import { ProductSaleService } from '../../services/productSaleService';
import { ProductSale } from '../../types';
import { useToast } from '../shared/ToastContainer';
import LoadingSpinner from '../shared/LoadingSpinner';
import { formatSaoPauloDate } from '../../utils/dateUtils';

const ProductSalesView: React.FC = () => {
  const { 
    clients, 
    products, 
    setModalType, 
    setFormData, 
    setShowModal,
    productSales,
    setProductSales
  } = useAppContext();
  
  const { hasPermission } = useAuth();
  const { showError } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      setLoading(true);
      const sales = await ProductSaleService.getAll();
      setProductSales(sales);
    } catch (error) {
      console.error('Error loading sales:', error);
      showError('Erro ao carregar vendas', 'Não foi possível carregar as vendas. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = productSales.filter(sale => {
    // Find client to check CPF
    const client = clients.find(c => c.id === sale.clientId);
    const clientCpf = client?.cpf || '';
    
    const matchesSearch = !searchTerm || 
      sale.saleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sale.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientCpf.includes(searchTerm) || // Search by CPF
      sale.items.some(item => item.productName.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesStatus = !statusFilter || sale.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalSales: productSales.length,
    totalRevenue: productSales.reduce((sum, sale) => sum + sale.totalAmount, 0),
    todaySales: productSales.filter(sale => sale.date === new Date().toISOString().split('T')[0]).length,
    averageTicket: productSales.length > 0 ? productSales.reduce((sum, sale) => sum + sale.totalAmount, 0) / productSales.length : 0
  };

  const openSaleModal = (sale?: ProductSale) => {
    setModalType('view-sale');
    setFormData(sale || {});
    setShowModal(true);
  };

  const openNewSaleModal = () => {
    setModalType('product-sale');
    setFormData({});
    setShowModal(true);
  };

  // Get client CPF for display
  const getClientCpf = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.cpf || '';
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Vendas de Produtos</h1>
        <button
          onClick={openNewSaleModal}
          className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Venda</span>
        </button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <ShoppingBag className="w-8 h-8 text-green-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total de Vendas</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalSales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Receita Total</p>
              <p className="text-xl sm:text-2xl font-bold text-blue-600">{formatCurrency(stats.totalRevenue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-purple-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Vendas Hoje</p>
              <p className="text-xl sm:text-2xl font-bold text-purple-600">{stats.todaySales}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Package className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Ticket Médio</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(stats.averageTicket)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por número da venda, cliente, CPF ou produto..."
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm && (
                <button
                  onClick={clearSearch}
                  className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
          <div className="w-full sm:w-48">
            <select
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="completed">Concluída</option>
              <option value="cancelled">Cancelada</option>
            </select>
          </div>
        </div>
        
        {/* Search Results Summary */}
        <div className="mt-2 text-sm text-gray-600">
          {searchTerm && (
            <span>
              {filteredSales.length} resultado(s) para "{searchTerm}"
            </span>
          )}
          {!searchTerm && (
            <span>{filteredSales.length} vendas</span>
          )}
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {filteredSales.map(sale => {
          const clientCpf = getClientCpf(sale.clientId);
          
          return (
            <div 
              key={sale.id}
              className="bg-white rounded-lg shadow p-4 space-y-3 hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => openSaleModal(sale)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-bold text-blue-600">{sale.saleNumber}</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {searchTerm ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(sale.clientName, searchTerm) 
                      }} />
                    ) : (
                      sale.clientName
                    )}
                    {clientCpf && (
                      <span className="ml-1 text-xs text-gray-500">
                        ({searchTerm && clientCpf.includes(searchTerm) ? (
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(clientCpf, searchTerm) 
                          }} />
                        ) : clientCpf})
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Data</p>
                  <p className="font-medium">{formatSaoPauloDate(sale.date)}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Produtos</p>
                <div className="space-y-1">
                  {sale.items.map((item, index) => (
                    <p key={index} className="text-sm">
                      {item.quantity}x {
                        searchTerm && item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                          <span dangerouslySetInnerHTML={{ 
                            __html: highlightSearchTerm(item.productName, searchTerm) 
                          }} />
                        ) : item.productName
                      } - {formatCurrency(item.totalPrice)}
                    </p>
                  ))}
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-600">Total</p>
                  <p className="font-bold text-green-600">{formatCurrency(sale.totalAmount)}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Pagamento</p>
                  <p className="text-sm font-medium">{sale.paymentMethod}</p>
                </div>
              </div>
            </div>
          );
        })}
        {filteredSales.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {searchTerm ? (
              <div>
                <p>Nenhuma venda encontrada para "{searchTerm}"</p>
                <button
                  onClick={clearSearch}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              'Nenhuma venda encontrada'
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Venda</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produtos</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredSales.map(sale => {
                const clientCpf = getClientCpf(sale.clientId);
                
                return (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600">{sale.saleNumber}</div>
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {searchTerm ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(sale.clientName, searchTerm) 
                        }} />
                      ) : (
                        sale.clientName
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {searchTerm && clientCpf.includes(searchTerm) ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(clientCpf, searchTerm) 
                        }} />
                      ) : (
                        clientCpf
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {sale.items.map((item, index) => (
                          <div key={index} className="text-sm">
                            {item.quantity}x {
                              searchTerm && item.productName.toLowerCase().includes(searchTerm.toLowerCase()) ? (
                                <span dangerouslySetInnerHTML={{ 
                                  __html: highlightSearchTerm(item.productName, searchTerm) 
                                }} />
                              ) : item.productName
                            }
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div>{formatSaoPauloDate(sale.date)}</div>
                        <div className="text-xs text-gray-500">{formatRelativeDate(sale.date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-bold text-green-600">
                      {formatCurrency(sale.totalAmount)}
                    </td>
                    <td className="px-6 py-4">{sale.paymentMethod}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {sale.status === 'completed' ? 'Concluída' : 'Cancelada'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            openSaleModal(sale);
                          }}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSales.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p>Nenhuma venda encontrada para "{searchTerm}"</p>
                        <button
                          onClick={clearSearch}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Limpar busca
                        </button>
                      </div>
                    ) : (
                      'Nenhuma venda encontrada'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductSalesView;