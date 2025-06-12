import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, DollarSign, ArrowUpCircle, ArrowDownCircle, RefreshCw, Clock, Eye, Edit, CheckCircle, MessageCircle, X, User, AlertCircle } from 'lucide-react';
import OSLink from '../shared/OSLink';
import { formatCurrency } from '../../utils/currencyUtils';
import { useToast } from '../shared/ToastContainer';
import WhatsAppSender from '../orders/WhatsAppSender';

const CreditView: React.FC = () => {
  const { showError } = useToast();
  const { setModalType, setFormData, setShowModal, bankAccounts, orders, clients } = useAppContext();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showWhatsAppModal, setShowWhatsAppModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  
  // Get orders with remaining value
  const pendingOrders = orders.filter(order => order.remainingValue > 0);

  // Calculate payment status
  const getPaymentStatus = (deliveryDate: string) => {
    const today = new Date().toDateString();
    const delivery = new Date(deliveryDate).toDateString();
    const deliveryDateTime = new Date(deliveryDate).getTime();
    const todayTime = new Date().getTime();

    if (deliveryDateTime < todayTime) return 'overdue';
    if (delivery === today) return 'due-today';
    return 'on-time';
  };

  // Filter orders
  const filteredOrders = pendingOrders.filter(order => {
    const client = clients.find(c => c.id === order.clientId);
    const clientCpf = client?.cpf || '';
    
    const matchesSearch = 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      clientCpf.includes(searchTerm);

    const paymentStatus = getPaymentStatus(order.deliveryDate);
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'overdue' && paymentStatus === 'overdue') ||
      (statusFilter === 'due-today' && paymentStatus === 'due-today') ||
      (statusFilter === 'on-time' && paymentStatus === 'on-time');

    return matchesSearch && matchesStatus;
  });

  // Calculate statistics
  const stats = {
    totalClients: new Set(pendingOrders.map(o => o.clientId)).size,
    totalPending: pendingOrders.reduce((sum, o) => sum + o.remainingValue, 0),
    overdue: pendingOrders.filter(o => getPaymentStatus(o.deliveryDate) === 'overdue')
      .reduce((sum, o) => sum + o.remainingValue, 0),
    dueToday: pendingOrders.filter(o => getPaymentStatus(o.deliveryDate) === 'due-today')
      .reduce((sum, o) => sum + o.remainingValue, 0)
  };

  const openModal = (type: string, data = {}) => {
    setModalType(type);
    setFormData(data);
    setShowModal(true);
  };

  const openPaymentModal = (order: any, isFullPayment = false) => {
    console.log('Abrindo modal de pagamento:', { order, isFullPayment }); // Debug
    setFormData({
      ...order,
      paymentType: isFullPayment ? 'total' : 'partial',
      paymentValue: isFullPayment ? order.remainingValue : 0,
      paymentMethod: ''
    });
    setModalType('payment');
    setShowModal(true);
  };

  const openWhatsAppModal = (order: any) => {
    setSelectedOrder(order);
    setShowWhatsAppModal(true);
  };

  // Get client CPF for display
  const getClientCpf = (clientId: number) => {
    const client = clients.find(c => c.id === clientId);
    return client?.cpf || '';
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  // Helper function to highlight search terms
  const highlightSearchTerm = (text: string, searchTerm: string) => {
    if (!searchTerm) return text;
    const regex = new RegExp(`(${searchTerm})`, 'gi');
    return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Crediário</h1>
        <div className="text-sm text-gray-600">
          {filteredOrders.length} registros encontrados
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-blue-100">
              <User className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Clientes</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-orange-100">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Pendente</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(stats.totalPending)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-red-100">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Vencido</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <div className="p-2 rounded-lg bg-yellow-100">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Vence Hoje</p>
              <p className="text-xl sm:text-2xl font-bold text-yellow-600">{formatCurrency(stats.dueToday)}</p>
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
                placeholder="Buscar por cliente, CPF ou número da OS..."
                className="pl-10 pr-10 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              <option value="all">Todas as situações</option>
              <option value="overdue">Vencidos</option>
              <option value="due-today">Vence hoje</option>
              <option value="on-time">Em dia</option>
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
            <span>{filteredOrders.length} pendências</span>
          )}
        </div>
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {filteredOrders.map(order => {
          const paymentStatus = getPaymentStatus(order.deliveryDate);
          const statusColors = {
            'overdue': 'border-l-4 border-red-500 bg-red-50',
            'due-today': 'border-l-4 border-yellow-500 bg-yellow-50',
            'on-time': 'border-l-4 border-green-500'
          };
          const clientCpf = getClientCpf(order.clientId);

          return (
            <div 
              key={order.id}
              className={`bg-white rounded-lg shadow p-4 space-y-3 ${statusColors[paymentStatus]}`}
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
                  <p className="text-sm text-gray-600">Vencimento</p>
                  <p className={`font-medium ${
                    paymentStatus === 'overdue' ? 'text-red-600' :
                    paymentStatus === 'due-today' ? 'text-yellow-600' :
                    'text-green-600'
                  }`}>
                    {new Date(order.deliveryDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-600">Artigo</p>
                <p className="font-medium">{order.article} {order.color} {order.size}</p>
                <p className="text-sm text-gray-500">{order.brand}</p>
              </div>

              <div className="flex justify-between items-end pt-2 border-t">
                <div>
                  <p className="text-sm text-gray-600">Total: {formatCurrency(order.totalValue)}</p>
                  <p className="text-red-600 font-bold">
                    Pendente: {formatCurrency(order.remainingValue)}
                  </p>
                </div>
                <div className="flex space-x-2" onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => openPaymentModal(order, false)}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Pagamento Parcial"
                  >
                    <DollarSign className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openPaymentModal(order, true)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Quitar Total"
                  >
                    <CheckCircle className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => openWhatsAppModal(order)}
                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                    title="Cobrar por WhatsApp"
                  >
                    <MessageCircle className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-lg shadow p-8 text-center text-gray-500">
            {searchTerm ? (
              <div>
                <p>Nenhuma pendência encontrada para "{searchTerm}"</p>
                <button
                  onClick={clearSearch}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              'Nenhuma ordem de serviço com pendências encontrada'
            )}
          </div>
        )}
      </div>

      {/* Desktop Table View */}
      <div className="hidden lg:block bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">OS</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Cliente</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">CPF</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Artigo</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Pago</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Restante</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredOrders.map((order, index) => {
                const paymentStatus = getPaymentStatus(order.deliveryDate);
                const statusColors = {
                  'overdue': 'border-l-4 border-red-500 bg-red-50',
                  'due-today': 'border-l-4 border-yellow-500 bg-yellow-50',
                  'on-time': 'border-l-4 border-green-500'
                };
                const clientCpf = getClientCpf(order.clientId);

                return (
                  <tr 
                    key={order.id}
                    className={`hover:bg-blue-50 cursor-pointer transition-colors ${
                      index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
                    } ${statusColors[paymentStatus] || ''}`}
                    onClick={() => openModal('view-order', order)}
                  >
                    <td className="px-6 py-4">
                      <OSLink order={order} />
                    </td>
                    <td className="px-6 py-4 font-medium">
                      {searchTerm ? (
                        <span dangerouslySetInnerHTML={{ 
                          __html: highlightSearchTerm(order.client, searchTerm) 
                        }} />
                      ) : (
                        order.client
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
                      <div>
                        <div className="font-medium">{order.article}</div>
                        <div className="text-sm text-gray-600">
                          {order.color} {order.size} {order.brand}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">{formatCurrency(order.totalValue)}</td>
                    <td className="px-6 py-4 text-green-600 font-medium">
                      {formatCurrency(order.totalValue - order.remainingValue)}
                    </td>
                    <td className="px-6 py-4 text-red-600 font-bold">
                      {formatCurrency(order.remainingValue)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        ${paymentStatus === 'overdue' ? 'text-red-600 font-bold' : ''}
                        ${paymentStatus === 'due-today' ? 'text-yellow-600 font-bold' : ''}
                        ${paymentStatus === 'on-time' ? 'text-green-600' : ''}
                      `}>
                        {new Date(order.deliveryDate).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex space-x-1">
                        <button
                          onClick={() => openModal('view-order', order)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Ver OS"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {hasPermission('orders.edit') && (
                          <button
                            onClick={() => openModal('order', order)}
                            className="text-green-600 hover:text-green-800 p-1"
                            title="Editar OS"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => openPaymentModal(order, false)}
                          className="text-blue-600 hover:text-blue-800 p-1"
                          title="Pagamento Parcial"
                        >
                          <DollarSign className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openPaymentModal(order, true)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Quitar Total"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openWhatsAppModal(order)}
                          className="text-green-600 hover:text-green-800 p-1"
                          title="Cobrar por WhatsApp"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredOrders.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                    {searchTerm ? (
                      <div>
                        <p>Nenhuma pendência encontrada para "{searchTerm}"</p>
                        <button
                          onClick={clearSearch}
                          className="mt-2 text-blue-600 hover:text-blue-800"
                        >
                          Limpar busca
                        </button>
                      </div>
                    ) : (
                      'Nenhuma ordem de serviço com pendências encontrada'
                    )}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* WhatsApp Modal */}
      {showWhatsAppModal && selectedOrder && (
        <WhatsAppSender
          order={selectedOrder}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}
    </div>
  );
};

export default CreditView;