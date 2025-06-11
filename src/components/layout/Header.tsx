import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { LogOut, Menu } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

const Header: React.FC = () => {
  const { currentUser, logout } = useAuth();
  const { setCurrentView } = useAppContext();

  const formatRole = (role: string) => {
    switch (role) {
      case 'admin': return 'Administrador';
      case 'manager': return 'Gerente';
      case 'attendant': return 'Atendente';
      case 'technician': return 'Técnico';
      case 'financial_low': return 'Financeiro';
      default: return role;
    }
  };

  return (
    <header className="bg-white shadow-sm border-b px-4 lg:px-6 py-4 flex-none">
      <div className="flex items-center justify-between max-w-[1920px] mx-auto">
        <div className="flex-1 min-w-0 lg:ml-16">
          <h1 className="text-lg lg:text-xl font-semibold text-gray-900 truncate">
            Sapataria Guimarães
          </h1>
          <p className="text-xs lg:text-sm text-gray-600 hidden sm:block truncate">
            {new Date().toLocaleDateString('pt-BR', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        
        <div className="flex items-center space-x-4 ml-4">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-medium text-gray-900 truncate max-w-[200px]">
              {currentUser?.name}
            </p>
            <p className="text-xs text-gray-600 capitalize truncate">
              {formatRole(currentUser?.role || '')}
            </p>
          </div>
          <button
            onClick={logout}
            className="text-red-600 hover:text-red-800 p-2 rounded-lg flex items-center space-x-2 transition-colors"
            aria-label="Sair do sistema"
          >
            <LogOut className="w-5 h-5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};

export default Header;