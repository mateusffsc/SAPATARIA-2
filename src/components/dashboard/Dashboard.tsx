import React from 'react';
import InteractiveDashboard from './InteractiveDashboard';
import CashRegisterWidget from '../finance/cashregister/CashRegisterWidget';
import DailyTransactions from './DailyTransactions';
import { useAuth } from '../../context/AuthContext';

const Dashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  
  return (
    <div className="space-y-6">
      {/* Cash Register Widget - Only show if user has cash register permissions */}
      {hasPermission('cash_register.manage') && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <CashRegisterWidget />
          </div>
          <div className="lg:col-span-2">
            {/* Daily Transactions Widget */}
            {hasPermission('financial.daily') && (
              <DailyTransactions />
            )}
          </div>
        </div>
      )}
      
      {/* Main Dashboard */}
      <InteractiveDashboard />
    </div>
  );
};

export default Dashboard;