import React from 'react';
import { ShieldAlert, Home } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface AccessDeniedViewProps {
  requiredPermission?: string;
}

const AccessDeniedView: React.FC<AccessDeniedViewProps> = ({ requiredPermission }) => {
  const { setCurrentView } = useAppContext();

  const getPermissionName = (permission: string): string => {
    const permissionMap: Record<string, string> = {
      'dashboard.view': 'visualizar o dashboard',
      'clients.view': 'visualizar clientes',
      'clients.create': 'criar clientes',
      'clients.edit': 'editar clientes',
      'clients.delete': 'excluir clientes',
      'orders.view': 'visualizar ordens de serviço',
      'orders.create': 'criar ordens de serviço',
      'orders.edit': 'editar ordens de serviço',
      'orders.delete': 'excluir ordens de serviço',
      'orders.finish': 'finalizar ordens de serviço',
      'orders.cancel': 'cancelar ordens de serviço',
      'technicians.view': 'visualizar técnicos',
      'technicians.manage': 'gerenciar técnicos',
      'financial.view': 'visualizar financeiro',
      'financial.reports': 'visualizar relatórios financeiros',
      'financial.bills': 'gerenciar contas a pagar',
      'financial.payments': 'gerenciar pagamentos',
      'products.view': 'visualizar produtos',
      'products.manage': 'gerenciar produtos',
      'services.view': 'visualizar serviços',
      'services.manage': 'gerenciar serviços',
      'employees.view': 'visualizar funcionários',
      'employees.manage': 'gerenciar funcionários',
      'settings.view': 'visualizar configurações',
      'settings.manage': 'gerenciar configurações',
      'banks.view': 'visualizar bancos',
      'banks.manage': 'gerenciar bancos',
      'payment-methods.view': 'visualizar formas de pagamento',
      'payment-methods.manage': 'gerenciar formas de pagamento',
      'suppliers.view': 'visualizar fornecedores',
      'suppliers.manage': 'gerenciar fornecedores'
    };

    // For view sections, map them to their permission
    const viewMap: Record<string, string> = {
      'dashboard': 'dashboard.view',
      'clients': 'clients.view',
      'orders': 'orders.view',
      'technicians': 'technicians.view',
      'financial': 'financial.view',
      'products': 'products.view',
      'services': 'services.view',
      'employees': 'employees.view',
      'banks': 'banks.view',
      'payment-methods': 'payment-methods.view',
      'suppliers': 'suppliers.view',
      'settings': 'settings.view',
      'product-sales': 'products.view',
      'credit': 'financial.view',
      'bills': 'financial.bills',
      'stock': 'products.view'
    };

    // If it's a view section, get the permission name
    if (viewMap[permission]) {
      return permissionMap[viewMap[permission]] || `acessar ${permission}`;
    }

    return permissionMap[permission] || `acessar ${permission}`;
  };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center">
      <div className="text-center max-w-md p-8 bg-white rounded-lg shadow-lg">
        <div className="w-20 h-20 mx-auto bg-red-100 rounded-full flex items-center justify-center mb-6">
          <ShieldAlert className="w-10 h-10 text-red-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Acesso Negado</h1>
        
        <p className="text-gray-600 mb-6">
          Você não tem permissão para {requiredPermission ? getPermissionName(requiredPermission) : 'acessar esta área'}.
          Entre em contato com um administrador para solicitar acesso.
        </p>
        
        <button
          onClick={() => setCurrentView('dashboard')}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Home className="w-4 h-4 mr-2" />
          Voltar para o Dashboard
        </button>
      </div>
    </div>
  );
};

export default AccessDeniedView;