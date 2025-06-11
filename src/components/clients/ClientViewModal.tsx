import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, Edit, User, Phone, Mail, MapPin, Package, Calendar, DollarSign } from 'lucide-react';
import OSLink from '../shared/OSLink';

const ClientViewModal: React.FC = () => {
  const { formData: client, orders, setShowModal, setModalType, setFormData } = useAppContext();

  // Get all orders for this client
  const clientOrders = orders.filter(order => order.clientId === client.id);
  
  // Calculate statistics
  const stats = {
    totalOrders: clientOrders.length,
    totalSpent: clientOrders.reduce((sum, order) => sum + order.totalValue, 0),
    pendingPayments: clientOrders.reduce((sum, order) => sum + order.remainingValue, 0),
    lastVisit: clientOrders.length > 0 
      ? new Date(Math.max(...clientOrders.map(o => new Date(o.date).getTime()))).toLocaleDateString()
      : 'Nunca'
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <User className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">{client.name}</h2>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Client Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Package className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">{stats.totalOrders}</span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Total de OS</p>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <DollarSign className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">
                  R$ {stats.totalSpent.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-green-600 mt-1">Total Gasto</p>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <DollarSign className="w-5 h-5 text-red-600" />
                <span className="text-2xl font-bold text-red-600">
                  R$ {stats.pendingPayments.toFixed(2)}
                </span>
              </div>
              <p className="text-sm text-red-600 mt-1">Pagamentos Pendentes</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-bold text-purple-600">{stats.lastVisit}</span>
              </div>
              <p className="text-sm text-purple-600 mt-1">Última Visita</p>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Informações de Contato</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-3">
                <div className="flex items-center space-x-2">
                  <User className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">CPF: {client.cpf}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{client.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-600">{client.email}</span>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-start space-x-2">
                  <MapPin className="w-5 h-5 text-gray-400 mt-1" />
                  <div className="text-gray-600">
                    <p>{client.street}, {client.number}</p>
                    {client.complement && <p>{client.complement}</p>}
                    <p>{client.neighborhood}</p>
                    <p>{client.city} - {client.state}</p>
                    <p>{client.zipCode}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Order History */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Histórico de Ordens de Serviço</h3>
            <div className="bg-white rounded-lg overflow-hidden border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">OS</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Artigo</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clientOrders.map(order => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <OSLink order={order} />
                      </td>
                      <td className="px-6 py-4">
                        {new Date(order.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">{order.article}</div>
                          <div className="text-sm text-gray-600">
                            {order.brand} {order.model}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div>
                          <div className="font-medium">R$ {order.totalValue.toFixed(2)}</div>
                          {order.remainingValue > 0 && (
                            <div className="text-sm text-red-600">
                              Pendente: R$ {order.remainingValue.toFixed(2)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          order.status === 'finalizada' ? 'bg-green-100 text-green-800' :
                          order.status === 'em-andamento' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                  {clientOrders.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                        Nenhuma ordem de serviço encontrada
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              setShowModal(false);
              setTimeout(() => {
                setModalType('client');
                setFormData(client);
                setShowModal(true);
              }, 100);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ClientViewModal;