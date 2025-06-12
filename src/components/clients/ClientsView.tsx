import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Search, Users, Trash2, Phone, Mail, MapPin, Plus, X } from 'lucide-react';

const ClientsView: React.FC = () => {
  const { clients, setClients, orders, setOrders, setModalType, setFormData, setShowModal } = useAppContext();
  const [searchTerm, setSearchTerm] = useState('');

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.cpf.includes(searchTerm) ||
    client.phone.includes(searchTerm)
  );

  const deleteClient = (clientId: number) => {
    if (window.confirm('Tem certeza que deseja excluir este cliente? Todas as ordens de serviço associadas serão removidas.')) {
      // Remove all orders associated with this client
      setOrders(prevOrders => prevOrders.filter(order => order.clientId !== clientId));
      
      // Remove the client
      setClients(prevClients => prevClients.filter(client => client.id !== clientId));
    }
  };

  const openClientDetails = (client: any) => {
    setModalType('view-client');
    setFormData(client);
    setShowModal(true);
  };

  const openNewOrderModal = () => {
    setModalType('order');
    setFormData({
      isNewClient: true,
      newClient: {
        name: '',
        cpf: '',
        phone: '',
        email: '',
        street: '',
        number: '',
        complement: '',
        neighborhood: '',
        city: '',
        state: '',
        zipCode: ''
      }
    });
    setShowModal(true);
  };

  const clearSearch = () => {
    setSearchTerm('');
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <h1 className="text-2xl font-bold text-gray-900">Clientes</h1>
        <button
          onClick={openNewOrderModal}
          className="w-full sm:w-auto bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center justify-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Cliente</span>
        </button>
      </div>

      {/* Search */}
      <div className="bg-white p-4 rounded-lg shadow">
        <div className="relative">
          <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar por nome, CPF ou telefone..."
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
        
        {/* Search Results Summary */}
        <div className="mt-2 text-sm text-gray-600">
          {searchTerm && (
            <span>
              {filteredClients.length} resultado(s) para "{searchTerm}"
            </span>
          )}
          {!searchTerm && (
            <span>{filteredClients.length} clientes</span>
          )}
        </div>
      </div>

      {/* Client cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map(client => (
          <div 
            key={client.id} 
            className="bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => openClientDetails(client)}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">
                    {searchTerm ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(client.name, searchTerm) 
                      }} />
                    ) : (
                      client.name
                    )}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {searchTerm && client.cpf.includes(searchTerm) ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: highlightSearchTerm(client.cpf, searchTerm) 
                      }} />
                    ) : (
                      client.cpf
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  deleteClient(client.id);
                }}
                className="text-red-600 hover:text-red-800 transition-colors"
                title="Excluir cliente"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-sm">
              <div className="flex items-center text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <span>
                  {searchTerm && client.phone.includes(searchTerm) ? (
                    <span dangerouslySetInnerHTML={{ 
                      __html: highlightSearchTerm(client.phone, searchTerm) 
                    }} />
                  ) : (
                    client.phone
                  )}
                </span>
              </div>
              <div className="flex items-center text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <span>{client.email}</span>
              </div>
              <div className="flex items-start text-gray-600">
                <MapPin className="w-4 h-4 mr-2 mt-1" />
                <div>
                  <p>{client.street}, {client.number}</p>
                  {client.complement && <p>{client.complement}</p>}
                  <p>{client.neighborhood}</p>
                  <p>{client.city} - {client.state}</p>
                  <p>{client.zipCode}</p>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-gray-600">
                {orders.filter(order => order.clientId === client.id).length} ordens de serviço
              </div>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-full text-center py-8 bg-white rounded-lg shadow">
            {searchTerm ? (
              <div>
                <p>Nenhum cliente encontrado para "{searchTerm}"</p>
                <button
                  onClick={clearSearch}
                  className="mt-2 text-blue-600 hover:text-blue-800"
                >
                  Limpar busca
                </button>
              </div>
            ) : (
              <p className="text-gray-500">Nenhum cliente encontrado</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default ClientsView;