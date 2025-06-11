import React, { useState, useEffect } from 'react';
import { 
  Home, FileText, Users, Wrench, DollarSign, Settings, Menu, X,
  ChevronDown, ChevronRight, Package, ShoppingBag, Building2, 
  CreditCard, Truck, User, Clock, ShoppingCart, Calendar,
  ChevronsLeft, ChevronsRight
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';

interface MenuItem {
  id: string;
  name: string;
  icon: any;
  section?: 'main' | 'cadastros';
  submenu?: MenuItem[];
  permission?: string;
}

const Sidebar: React.FC = () => {
  const { currentView, setCurrentView } = useAppContext();
  const { hasPermission, currentUser } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['cadastros']);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Close menu when screen is resized to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) { // lg breakpoint
        setIsMobileMenuOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  // Save sidebar state to localStorage
  useEffect(() => {
    const savedCollapsedState = localStorage.getItem('sidebarCollapsed');
    if (savedCollapsedState !== null) {
      setIsCollapsed(JSON.parse(savedCollapsedState));
    }
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem('sidebarCollapsed', JSON.stringify(newState));
  };

  const menuItems: MenuItem[] = [
    // Main Section
    { id: 'dashboard', name: 'Dashboard', icon: Home, section: 'main' as const, permission: 'dashboard.view' },
    { id: 'clients', name: 'Clientes', icon: Users, section: 'main' as const, permission: 'clients.view' },
    { id: 'technicians', name: 'Técnicos', icon: Wrench, section: 'main' as const, permission: 'technicians.view' },
    { id: 'orders', name: 'Ordens de Serviço', icon: FileText, section: 'main' as const, permission: 'orders.view' },
    { id: 'product-sales', name: 'Vendas de Produtos', icon: ShoppingCart, section: 'main' as const },
    { id: 'credit', name: 'Crediário', icon: Clock, section: 'main' as const }, // No permission required for credit
    
    // Financial section based on role
    ...(currentUser?.role === 'financial_low' 
      ? [{ id: 'financial-low', name: 'Financeiro', icon: DollarSign, section: 'main' as const, permission: 'financial.daily' }]
      : [{ id: 'financial', name: 'Financeiro', icon: DollarSign, section: 'main' as const, permission: 'financial.view' }]
    ),
    
    // Cadastros Section
    { 
      id: 'cadastros', 
      name: 'Cadastros', 
      icon: Package,
      section: 'cadastros' as const,
      submenu: [
        { id: 'services', name: 'Serviços', icon: Wrench, permission: 'services.view' },
        { id: 'employees', name: 'Funcionários', icon: User, permission: 'employees.view' },
        { id: 'products', name: 'Produtos', icon: ShoppingBag, permission: 'products.view' },
        { id: 'banks', name: 'Bancos', icon: Building2, permission: 'banks.view' },
        { id: 'payment-methods', name: 'Formas de Pagamento', icon: CreditCard, permission: 'payment-methods.view' },
        { id: 'suppliers', name: 'Fornecedores', icon: Truck, permission: 'suppliers.view' }
      ]
    }
  ];

  const handleMenuClick = (viewId: string) => {
    setCurrentView(viewId);
    setIsMobileMenuOpen(false);
    setIsTransitioning(true);
    setTimeout(() => setIsTransitioning(false), 300);
  };

  const toggleSubmenu = (menuId: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      setExpandedMenus([menuId]);
    } else {
      setExpandedMenus(prev => 
        prev.includes(menuId) 
          ? prev.filter(id => id !== menuId)
          : [...prev, menuId]
      );
    }
  };

  const renderMenuItem = (item: MenuItem) => {
    // Check if user has permission to see this menu item
    if (item.permission && !hasPermission(item.permission)) {
      return null;
    }

    // For submenu items, check if any child has permission
    if (item.submenu) {
      const hasAnyPermission = item.submenu.some(subItem => 
        !subItem.permission || hasPermission(subItem.permission)
      );
      
      if (!hasAnyPermission) {
        return null;
      }
    }

    const isSubmenuExpanded = expandedMenus.includes(item.id);
    const isActive = currentView === item.id || 
      (item.submenu?.some(subItem => currentView === subItem.id));

    return (
      <div key={item.id}>
        <button
          onClick={() => item.submenu ? toggleSubmenu(item.id) : handleMenuClick(item.id)}
          className={`
            w-full flex items-center justify-between
            px-3 py-3 rounded-lg text-left
            transition-all duration-200
            min-h-[48px] lg:min-h-[44px]
            group
            ${isActive 
              ? 'bg-blue-600 text-white shadow-md' 
              : 'text-gray-300 hover:bg-gray-700 hover:text-white'
            }
          `}
          title={isCollapsed ? item.name : undefined}
        >
          <div className="flex items-center space-x-3 min-w-0">
            <item.icon className="w-5 h-5 flex-shrink-0" />
            <span className={`text-sm font-medium transition-all duration-200 ${
              isCollapsed ? 'opacity-0 w-0' : 'opacity-100 w-auto'
            }`}>
              {item.name}
            </span>
          </div>
          {item.submenu && !isCollapsed && (
            <div className="flex-shrink-0">
              {isSubmenuExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </div>
          )}
        </button>

        {item.submenu && isSubmenuExpanded && !isCollapsed && (
          <div className="ml-3 mt-1 space-y-1 border-l border-gray-700 pl-3">
            {item.submenu.map(subItem => {
              // Skip submenu items user doesn't have permission for
              if (subItem.permission && !hasPermission(subItem.permission)) {
                return null;
              }
              
              return (
                <button
                  key={subItem.id}
                  onClick={() => handleMenuClick(subItem.id)}
                  className={`
                    w-full flex items-center space-x-3
                    px-3 py-2 rounded-lg text-left
                    transition-all duration-200
                    min-h-[40px]
                    ${currentView === subItem.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                    }
                  `}
                >
                  <subItem.icon className="w-4 h-4 flex-shrink-0" />
                  <span className="text-sm">{subItem.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <>
      {/* Mobile menu button - always visible on mobile */}
      <button
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        aria-label={isMobileMenuOpen ? "Fechar menu" : "Abrir menu"}
      >
        {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
      </button>

      {/* Sidebar */}
      <aside
        className={`
          fixed lg:sticky top-0 left-0 h-screen
          ${isCollapsed ? 'w-[72px]' : 'w-[280px] lg:w-64'}
          bg-gray-800 text-white
          transform transition-all duration-300 ease-in-out
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          ${isTransitioning ? 'transition-transform' : ''}
          lg:translate-x-0
          z-40 lg:z-0
          overflow-hidden
          flex flex-col
        `}
      >
        <div className={`flex-none p-4 border-b border-gray-700 flex items-center justify-between ${
          isCollapsed ? 'px-2' : ''
        }`}>
          <h1 className={`text-xl font-bold text-center transition-all duration-200 ${
            isCollapsed ? 'opacity-0 w-0' : 'opacity-100'
          }`}>
            Sapataria Guimarães
          </h1>
          <button
            onClick={toggleCollapse}
            className="p-2 rounded-lg text-gray-300 hover:text-white hover:bg-gray-700 transition-colors hidden lg:block"
            aria-label={isCollapsed ? "Expandir menu" : "Recolher menu"}
          >
            {isCollapsed ? (
              <ChevronsRight className="w-5 h-5" />
            ) : (
              <ChevronsLeft className="w-5 h-5" />
            )}
          </button>
        </div>
        
        <nav className={`flex-1 overflow-y-auto py-4 ${isCollapsed ? 'px-2' : 'px-2'} space-y-1`}>
          {/* Main Section */}
          <div className="space-y-1">
            {menuItems
              .filter(item => item.section === 'main')
              .map(renderMenuItem)}
          </div>

          {/* Visual Separator */}
          <div className="my-4 border-t border-gray-700 opacity-50" />

          {/* Cadastros Section */}
          <div className="space-y-1">
            {menuItems
              .filter(item => item.section === 'cadastros')
              .map(renderMenuItem)}
          </div>
        </nav>
      </aside>

      {/* Overlay for mobile */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-30 lg:hidden backdrop-blur-sm"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-hidden="true"
        />
      )}
    </>
  );
};

export default Sidebar;