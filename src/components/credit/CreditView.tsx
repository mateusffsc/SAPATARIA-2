import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Search, DollarSign, Calendar, AlertCircle, Users, Clock, Eye, Edit, CheckCircle, MessageCircle } from 'lucide-react';
import OSLink from '../shared/OSLink';
import { formatCurrency } from '../../utils/currencyUtils';
import PaymentModal from '../payments/PaymentModal';
import WhatsAppSender from '../orders/WhatsAppSender';

const CreditView: React.FC = () => {
  const { orders, clients, setModalType, setFormData, setShowModal } = useAppContext();
  const { hasPermission } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
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
    const matchesSearch = 
      order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.number.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (client?.cpf || '').includes(searchTerm);

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
    setShowPaymentModal(true);
  };

  const openWhatsAppModal = (order: any) => {
    setSelectedOrder(order);
    setShowWhatsAppModal(true);
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
            <Users className="w-8 h-8 text-blue-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Clientes</p>
              <p className="text-xl sm:text-2xl font-bold">{stats.totalClients}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <DollarSign className="w-8 h-8 text-orange-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Pendente</p>
              <p className="text-xl sm:text-2xl font-bold text-orange-600">{formatCurrency(stats.totalPending)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <AlertCircle className="w-8 h-8 text-red-600" />
            <div className="ml-4">
              <p className="text-sm text-gray-600">Vencido</p>
              <p className="text-xl sm:text-2xl font-bold text-red-600">{formatCurrency(stats.overdue)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-4 sm:p-6 rounded-lg shadow hover:shadow-md transition-shadow">
          <div className="flex items-center">
            <Clock className="w-8 h-8 text-yellow-600" />
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
                className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
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
      </div>

      {/* Mobile Cards View */}
      <div className="block lg:hidden space-y-4">
        {filteredOrders.map(order => {
          const paymentStatus = getPaymentStatus(order.deliveryDate);
          const statusColors = {
            'overdue': 'border-l-4 border-red-500',
            'due-today': 'border-l-4 border-yellow-500',
            'on-time': 'border-l-4 border-green-500'
          };

          return (
            <div 
              key={order.id}
              className={`bg-white rounded-lg shadow p-4 space-y-3 ${statusColors[paymentStatus]}`}
              onClick={() => openModal('view-order', order)}
            >
              <div className="flex justify-between items-start">
                <div>
                  <OSLink order={order} />
                  <p className="text-sm text-gray-600 mt-1">{order.client}</p>
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
            Nenhuma ordem de serviço com pendências encontrada
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
                    <td className="px-6 py-4 font-medium">{order.client}</td>
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
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma ordem de serviço com pendências encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modais */}
      {showWhatsAppModal && selectedOrder && (
        <WhatsAppSender
          order={selectedOrder}
          onClose={() => setShowWhatsAppModal(false)}
        />
      )}

      {showPaymentModal && (
        <PaymentModal />
      )}
    </div>
  );
};

export default CreditView;