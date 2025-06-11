import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, Plus, Eye, Edit, DollarSign, CheckCircle, ShoppingBag, AlertTriangle, X } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/statusUtils';
import OSLink from '../shared/OSLink';
import { formatCurrency, formatRelativeDate, highlightSearchTerm } from '../../utils/formatters';
import LoadingSpinner from '../shared/LoadingSpinner';
import RefundModal from './RefundModal';
import ProductSaleModal from './ProductSaleModal';

interface RefundData {
  amount: number;
  method: string;
  reason: string;
  observations: string;
}

const OrdersList: React.FC = () => {
  const { orders, setOrders, setModalType, setFormData, setShowModal } = useAppContext();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortBy, setSortBy] = useState<'date' | 'delivery' | 'value' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [orderToRefund, setOrderToRefund] = useState<any>(null);
  const [showProductSaleModal, setShowProductSaleModal] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState<number | null>(null);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  
  // Enhanced filtering with search highlighting
  const filteredOrders = orders.filter(order => {
    const matchesSearch = !searchTerm || 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.serialNumber && order.serialNumber.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.article.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.brand.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = !statusFilter || order.status === statusFilter;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    let aValue, bValue;
    
    switch (sortBy) {
      case 'date':
        aValue = new Date(a.date).getTime();
        bValue = new Date(b.date).getTime();
        break;
      case 'delivery':
        aValue = new Date(a.deliveryDate).getTime();
        bValue = new Date(b.deliveryDate).getTime();
        break;
      case 'value':
        aValue = a.totalValue;
        bValue = b.totalValue;
        break;
      case 'status':
        aValue = a.status;
        bValue = b.status;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Priority indicators
  const getPriorityIndicator = (order: any) => {
    const isOverdue = new Date(order.deliveryDate) < new Date() && order.status !== 'finalizada';
    const isDueToday = new Date(order.deliveryDate).toDateString() === new Date().toDateString();
    
    if (isOverdue) return { color: 'border-l-4 border-red-500 bg-red-50', label: 'ATRASADA' };
    if (isDueToday) return { color: 'border-l-4 border-yellow-500 bg-yellow-50', label: 'VENCE HOJE' };
    return { color: '', label: '' };
  };

  const handleStatusChange = (orderId: number, newStatus: string) => {
    // Check if user has permission to change status
    if (!hasPermission('orders.edit')) {
      alert('Você não tem permissão para alterar o status de ordens de serviço.');
      return;
    }
    
    const order = orders.find(o => o.id === orderId);
    
    // Show confirmation for cancellation
    if (newStatus === 'cancelada' && order && order.status !== 'cancelada') {
      setShowCancelConfirm(orderId);
      return;
    }

    // Check if order has payments and needs refund
    if (newStatus === 'cancelada' && order && order.totalValue > order.remainingValue) {
      setOrderToRefund(order);
      setShowRefundModal(true);
      return;
    }

    updateOrderStatus(orderId, newStatus);
  };

  const updateOrderStatus = (orderId: number, newStatus: string) => {
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { ...order, status: newStatus }
        : order
    ));
  };

  const confirmCancellation = (orderId: number) => {
    const order = orders.find(o => o.id === orderId);
    
    if (order && order.totalValue > order.remainingValue) {
      setOrderToRefund(order);
      setShowRefundModal(true);
    } else {
      updateOrderStatus(orderId, 'cancelada');
    }
    
    setShowCancelConfirm(null);
  };

  const handleRefund = (refundData: RefundData) => {
    if (!orderToRefund) return;

    const refund = {
      date: new Date().toISOString().split('T')[0],
      type: 'SAÍDA',
      category: 'Estorno Cliente',
      description: `Estorno OS ${orderToRefund.number} - ${refundData.reason}`,
      value: refundData.amount,
      method: refundData.method,
      observations: refundData.observations,
      reference: orderToRefund.number
    };

    setOrders(prev => prev.map(order => 
      order.id === orderToRefund.id 
        ? { 
            ...order, 
            status: 'cancelada',
            refund: refund,
            canceledAt: new Date().toISOString(),
            cancelReason: refundData.reason,
            cancelObservations: refundData.observations
          }
        : order
    ));

    setModalType('financial');
    setFormData({
      type: 'expense',
      ...refund
    });
    setShowModal(true);

    setOrderToRefund(null);
    setShowRefundModal(false);
  };

  const openModal = (type: string, data = {}) => {
    setModalType(type);
    setFormData(data);
    setShowModal(true);
  };

  const openPaymentModal = (order: any, isFullPayment = false) => {
    // Check if user has permission to handle payments
    if (!hasPermission('financial.payments')) {
      alert('Você não tem permissão para registrar pagamentos.');
      return;
    }
    
    setFormData({
      ...order,
      paymentType: isFullPayment ? 'total' : 'partial',
      paymentValue: isFullPayment ? order.remainingValue : 0,
      paymentMethod: ''
    });
    setModalType('payment');
    setShowModal(true);
  };

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    
    // Save to search history
    if (value.trim() && !searchHistory.includes(value)) {
      const newHistory = [value, ...searchHistory.slice(0, 4)];
      setSearchHistory(newHistory);
      localStorage.setItem('order_search_history', JSON.stringify(newHistory));
    }
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Ordens de Serviço</h1>
        <div className="flex space-x-4">
          <button
            onClick={() => setShowProductSaleModal(true)}
            className="w-full sm:w-auto bg-green-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Vender Produto</span>
          </button>
          {hasPermission('orders.create') && (
            <button
              onClick={() => openModal('order')}
              className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors" 
            >
              <Plus className="w-4 h-4" />
              <span>Nova OS</span>
            </button>
          )}
        </div>
      </div>

      {/* Enhanced Search and Filters */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Buscar por cliente, número da OS, série, artigo..."
                className="pl-10 pr-10 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
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
          
          <div className="flex flex-col sm:flex-row gap-4">
            <select
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="serviço pronto">Serviço Pronto</option>
              <option value="em-andamento">Em andamento</option>
              <option value="finalizada">Finalizada</option>
              <option value="cancelada">Cancelada</option>
              <option value="orçamento">Orçamento</option>
            </select>
            
            <select
              className="px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={`${sortBy}-${sortOrder}`}
              onChange={(e) => {
                const [field, order] = e.target.value.split('-');
                setSortBy(field as typeof sortBy);
                setSortOrder(order as 'asc' | 'desc');
              }}
            >
              <option value="date-desc">Mais recentes</option>
              <option value="date-asc">Mais antigas</option>
              <option value="delivery-asc">Entrega próxima</option>
              <option value="delivery-desc">Entrega distante</option>
              <option value="value-desc">Maior valor</option>
              <option value="value-asc">Menor valor</option>
            </select>
          </div>
        </div>
        
        {/* Search Results Summary */}
        <div className="mt-2 text-sm text-gray-600">
          {searchTerm && (
            <span>
              {filteredOrders.length} resultado(s) para "{searchTerm}"
            </span>
          )}
          {!searchTerm && (
            <span>{filteredOrders.length} ordens de serviço</span>
          )}
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {filteredOrders.map(order => {
          const priority = getPriorityIndicator(order);
          
          return (
            <div 
              key={order.id}
              className={`bg-white rounded-lg shadow p-4 space-y-3 transition-all hover:shadow-md ${priority.color}`}
              onClick={() => openModal('view-order', order)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <OSLink order={order} />
                  <p className="text-sm text-gray-600 mt-1">
                    {searchTerm ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(order.client, searchTerm) 
                      }} />
                    ) : (
                      order.client
                    )}
                  </p>
                  {priority.label && (
                    <span className="text-xs font-bold text-red-600">{priority.label}</span>
                  )}
                </div>
                {hasPermission('orders.edit') ? (
                  <select
                    className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(order.status)}`}
                    value={order.status}
                    onChange={(e) => {
                      e.stopPropagation();
                      handleStatusChange(order.id, e.target.value);
                    }}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <option value="serviço pronto">Serviço Pronto</option>
                    <option value="em-andamento">Em andamento</option>
                    <option value="finalizada">Finalizada</option>
                    <option value="cancelada">Cancelada</option>
                    <option value="orçamento">Orçamento</option>
                  </select>
                ) : (
                  <span className={`text-xs font-medium px-2 py-1 rounded-full ${getStatusColor(order.status)}`}>
                    {order.status}
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-500">Artigo:</span>
                  <p className="font-medium">
                    {searchTerm ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(order.article, searchTerm) 
                      }} />
                    ) : (
                      order.article
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {order.brand} {order.model} {order.color} {order.size}
                  </p>
                  {order.serialNumber && (
                    <p className="text-xs text-gray-500">
                      Série: {searchTerm ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(order.serialNumber, searchTerm) 
                        }} />
                      ) : (
                        order.serialNumber
                      )}
                    </p>
                  )}
                </div>
                <div>
                  <div>
                    <span className="text-gray-500">Abertura:</span>
                    <p className="font-medium">{formatRelativeDate(order.date)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Entrega:</span>
                    <p className={new Date(order.deliveryDate) < new Date() && order.status !== 'finalizada' ? 'text-red-600 font-medium' : 'font-medium'}>
                      {formatRelativeDate(order.deliveryDate)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="border-t pt-3 mt-3">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm text-gray-600">Valor Total:</p>
                    <p className="font-bold">{formatCurrency(order.totalValue)}</p>
                    {order.remainingValue > 0 && (
                      <p className="text-sm text-red-600">
                        Pendente: {formatCurrency(order.remainingValue)}
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                    {hasPermission('orders.edit') && (
                      <button
                        onClick={() => openModal('order', order)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-5 h-5" />
                      </button>
                    )}
                    {order.remainingValue > 0 && hasPermission('financial.payments') && (
                      <button
                        onClick={() => openPaymentModal(order, false)}
                        className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="Receber Pagamento"
                      >
                        <DollarSign className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {searchTerm ? (
              <div>
                <p>Nenhuma ordem encontrada para "{searchTerm}"</p>
                <button
                  onClick={clearSearch}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              'Nenhuma ordem de serviço encontrada'
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
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('date')}
                >
                  OS {sortBy === 'date' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artigo</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('status')}
                >
                  Status {sortBy === 'status' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Abertura</th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('delivery')}
                >
                  Entrega {sortBy === 'delivery' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th 
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase cursor-pointer hover:bg-gray-100"
                  onClick={() => handleSort('value')}
                >
                  Valor {sortBy === 'value' && (sortOrder === 'asc' ? '↑' : '↓')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map(order => {
                const priority = getPriorityIndicator(order);
                
                return (
                  <tr key={order.id} className={`hover:bg-gray-50 transition-colors ${priority.color}`}>
                    <td className="px-6 py-4">
                      <OSLink order={order} />
                      {priority.label && (
                        <div className="text-xs font-bold text-red-600">{priority.label}</div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {searchTerm ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(order.client, searchTerm) 
                        }} />
                      ) : (
                        order.client
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium">
                          {searchTerm ? (
                            <span dangerouslySetInnerHTML={{ 
                              __html: highlightSearchTerm(order.article, searchTerm) 
                            }} />
                          ) : (
                            order.article
                          )}
                        </div>
                        <div className="text-sm text-gray-500">
                          {order.brand} {order.model} {order.color} {order.size}
                        </div>
                        {order.serialNumber && (
                          <div className="text-xs text-gray-500">
                            Série: {searchTerm ? (
                              <span dangerouslySetInnerHTML={{ 
                                __html: highlightSearchTerm(order.serialNumber, searchTerm) 
                              }} />
                            ) : (
                              order.serialNumber
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {hasPermission('orders.edit') ? (
                        <select
                          className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        >
                          <option value="serviço pronto">Serviço Pronto</option>
                          <option value="em-andamento">Em andamento</option>
                          <option value="finalizada">Finalizada</option>
                          <option value="cancelada">Cancelada</option>
                          <option value="orçamento">Orçamento</option>
                        </select>
                      ) : (
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          {getStatusIcon(order.status)}
                          <span className="ml-1 capitalize">{order.status.replace('-', ' ')}</span>
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div>{new Date(order.date).toLocaleDateString()}</div>
                        <div className="text-xs text-gray-500">{formatRelativeDate(order.date)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <span className={new Date(order.deliveryDate) < new Date() && order.status !== 'finalizada' ? 'text-red-600 font-medium' : ''}>
                          {new Date(order.deliveryDate).toLocaleDateString()}
                        </span>
                        <div className="text-xs text-gray-500">{formatRelativeDate(order.deliveryDate)}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div>{formatCurrency(order.totalValue)}</div>
                        {order.remainingValue > 0 && (
                          <div className="text-red-600 text-sm">Pendente: {formatCurrency(order.remainingValue)}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openModal('view-order', order)}
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                          title="Visualizar OS"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission('orders.edit') && (
                          <button
                            onClick={() => openModal('order', order)}
                            className="text-green-600 hover:text-green-800 transition-colors"
                            title="Editar OS"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        {order.remainingValue > 0 && hasPermission('financial.payments') && (
                          <>
                            <button
                              onClick={() => openPaymentModal(order, false)}
                              className="text-blue-600 hover:text-blue-800 transition-colors"
                              title="Pagamento Parcial"
                            >
                              <DollarSign className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => openPaymentModal(order, true)}
                              className="text-green-600 hover:text-green-800 transition-colors"
                              title="Quitar Total"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p>Nenhuma ordem encontrada para "{searchTerm}"</p>
                        <button
                          onClick={clearSearch}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Limpar busca
                        </button>
                      </div>
                    ) : (
                      'Nenhuma ordem de serviço encontrada'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Cancellation Confirmation Modal */}
      {showCancelConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center mb-4">
              <AlertTriangle className="w-6 h-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-semibold">Confirmar Cancelamento</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              Tem certeza que deseja cancelar esta ordem de serviço? Esta ação não pode ser desfeita.
            </p>
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelConfirm(null)}
                className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
              >
                Voltar
              </button>
              <button
                onClick={() => confirmCancellation(showCancelConfirm)}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Sale Modal */}
      {showProductSaleModal && (
        <ProductSaleModal
          onClose={() => setShowProductSaleModal(false)}
          onSave={(saleData) => {
            // Handle product sale
            setShowProductSaleModal(false);
          }}
        />
      )}

      {/* Existing modals */}
      {showRefundModal && orderToRefund && (
        <RefundModal
          order={orderToRefund}
          onConfirm={handleRefund}
          onCancel={() => {
            setOrderToRefund(null);
            setShowRefundModal(false);
          }}
        />
      )}
    </div>
  );
};

export default OrdersList;