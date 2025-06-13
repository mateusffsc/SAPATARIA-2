import React, { useEffect, useState } from 'react';
import InteractiveDashboard from './InteractiveDashboard';
import CashRegisterWidget from '../finance/cashregister/CashRegisterWidget';
import DailyTransactions from './DailyTransactions';
import { useAuth } from '../../context/AuthContext';
import { getCurrentDate } from '../../utils/formatters';

const Dashboard: React.FC = () => {
  const { hasPermission } = useAuth();
  const [currentDate, setCurrentDate] = useState('');
  
  useEffect(() => {
    // Set current date when component mounts
    setCurrentDate(new Date().toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Sao_Paulo'
    }));
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Current Date Display */}
      <div className="bg-white p-4 rounded-lg shadow">
        <p className="text-gray-600">
          Data atual do sistema: <span className="font-medium">{currentDate}</span>
        </p>
      </div>
      
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