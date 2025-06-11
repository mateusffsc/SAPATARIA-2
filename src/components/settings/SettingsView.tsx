import React from 'react';
import { Settings } from 'lucide-react';

const SettingsView: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Configurações</h1>
      </div>
      
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center mb-4">
          <Settings className="h-6 w-6 text-blue-600 mr-2" />
          <h2 className="text-xl font-semibold">Configurações do Sistema</h2>
        </div>
        <p className="text-gray-600">
          Esta seção está em desenvolvimento. Em breve você poderá personalizar as configurações da sua sapataria.
        </p>
        
        <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <h3 className="text-blue-700 font-medium mb-2">Funcionalidades planejadas:</h3>
          <ul className="list-disc pl-5 text-blue-600 space-y-1">
            <li>Personalização de informações da empresa</li>
            <li>Configuração de e-mails e notificações</li>
            <li>Gestão de usuários e permissões</li>
            <li>Backup de dados</li>
            <li>Configurações de impressão</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default SettingsView;