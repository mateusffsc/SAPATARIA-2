import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { Package, ShoppingBag, Building2, CreditCard, Truck, User } from 'lucide-react';

const CadastrosView: React.FC = () => {
  const { 
    setCurrentView, 
    services, 
    products, 
    employees,
    suppliers,
    paymentMethods,
    banks
  } = useAppContext();
  
  const { hasPermission } = useAuth();

  const menuItems = [
    {
      id: 'services',
      name: 'Serviços',
      icon: Package,
      description: 'Gerenciar serviços oferecidos pela sapataria',
      count: services.length,
      countLabel: 'serviços cadastrados',
      permission: 'services.view'
    },
    {
      id: 'products',
      name: 'Produtos',
      icon: ShoppingBag,
      description: 'Gerenciar estoque de produtos',
      count: products.length,
      countLabel: 'produtos em estoque',
      permission: 'products.view'
    },
    {
      id: 'employees',
      name: 'Funcionários',
      icon: User,
      description: 'Gerenciar equipe e permissões',
      count: employees.length,
      countLabel: 'funcionários ativos',
      permission: 'employees.view'
    },
    {
      id: 'banks',
      name: 'Bancos',
      icon: Building2,
      description: 'Gerenciar contas bancárias',
      count: banks?.length || 0,
      countLabel: 'contas cadastradas',
      permission: 'banks.view'
    },
    {
      id: 'payment-methods',
      name: 'Formas de Pagamento',
      icon: CreditCard,
      description: 'Gerenciar formas de pagamento e taxas',
      count: paymentMethods.length,
      countLabel: 'formas cadastradas',
      permission: 'payment-methods.view'
    },
    {
      id: 'suppliers',
      name: 'Fornecedores',
      icon: Truck,
      description: 'Gerenciar fornecedores',
      count: suppliers.length,
      countLabel: 'fornecedores cadastrados',
      permission: 'suppliers.view'
    }
  ];

  // Filter menu items based on user permissions
  const filteredMenuItems = menuItems.filter(item => 
    !item.permission || hasPermission(item.permission)
  );

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Cadastros</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredMenuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setCurrentView(item.id)}
            className="bg-white p-6 rounded-lg shadow hover:shadow-md transition-all transform hover:-translate-y-1 text-left"
          >
            <div className="flex items-start space-x-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <item.icon className="w-6 h-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">{item.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{item.description}</p>
                <div className="flex items-center space-x-2">
                  <span className="text-2xl font-bold text-blue-600">{item.count}</span>
                  <span className="text-sm text-gray-500">{item.countLabel}</span>
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>
      
      {filteredMenuItems.length === 0 && (
        <div className="bg-white p-8 rounded-lg shadow text-center">
          <p className="text-gray-500">Você não tem permissão para acessar nenhum dos cadastros.</p>
        </div>
      )}
    </div>
  );
};

export default CadastrosView;