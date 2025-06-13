import React, { useState, useEffect } from 'react';
import { DollarSign, Lock, Unlock, AlertCircle, Clock } from 'lucide-react';
import { CashRegisterService, CashRegisterSession } from './CashRegisterService';
import { formatCurrency } from '../../../utils/currencyUtils';
import CashRegisterModal from './CashRegisterModal';
import { FinancialService } from '../../../services/financialService';
import { useAuth } from '../../../context/AuthContext';
import { useAppContext } from '../../../context/AppContext';

const CashRegisterWidget: React.FC = () => {
  const [currentSession, setCurrentSession] = useState<CashRegisterSession | null>(null);
  const [cashBalance, setCashBalance] = useState(0);
  const [todayIncome, setTodayIncome] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'open' | 'close'>('open');
  const [loading, setLoading] = useState(true);
  const { hasPermission } = useAuth();
  const { bankAccounts } = useAppContext();

  useEffect(() => {
    loadCashRegisterStatus();
  }, []);

  const loadCashRegisterStatus = async () => {
    try {
      setLoading(true);
      const session = await CashRegisterService.getCurrentSession();
      setCurrentSession(session);
      
      if (session) {
        // Get cash balance from Caixa Loja account
        const caixaLojaAccount = bankAccounts.find(a => a.name === 'Caixa Loja');
        if (caixaLojaAccount) {
          setCashBalance(caixaLojaAccount.balance);
        } else {
          const balance = await CashRegisterService.getCashBalance();
          setCashBalance(balance);
        }
        
        // Get today's income
        const today = new Date().toISOString().split('T')[0];
        const todayTransactions = await FinancialService.getTransactionsByDateRange(today, today);
        const income = todayTransactions
          .filter(t => t.type === 'income')
          .reduce((sum, t) => sum + Math.abs(t.amount), 0);
        
        setTodayIncome(income);
      }
    } catch (error) {
      console.error('Error loading cash register status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCash = () => {
    if (!hasPermission('cash_register.manage')) {
      alert('Você não tem permissão para abrir o caixa.');
      return;
    }
    setModalType('open');
    setShowModal(true);
  };

  const handleCloseCash = () => {
    if (!hasPermission('cash_register.manage')) {
      alert('Você não tem permissão para fechar o caixa.');
      return;
    }
    setModalType('close');
    setShowModal(true);
  };

  const handleModalSuccess = () => {
    setShowModal(false);
    loadCashRegisterStatus();
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-lg shadow animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
        <div className="h-8 bg-gray-200 rounded w-3/4"></div>
      </div>
    );
  }

  const isOpen = currentSession?.status === 'open';

  return (
    <>
      <div className={`bg-white p-6 rounded-lg shadow border-l-4 ${
        isOpen ? 'border-green-500' : 'border-red-500'
      }`}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center">
            <div className={`p-2 rounded-lg ${
              isOpen ? 'bg-green-100' : 'bg-red-100'
            }`}>
              {isOpen ? (
                <Unlock className={`w-6 h-6 ${isOpen ? 'text-green-600' : 'text-red-600'}`} />
              ) : (
                <Lock className={`w-6 h-6 ${isOpen ? 'text-green-600' : 'text-red-600'}`} />
              )}
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-semibold text-gray-900">Caixa</h3>
              <p className={`text-sm ${isOpen ? 'text-green-600' : 'text-red-600'}`}>
                {isOpen ? 'Aberto' : 'Fechado'}
              </p>
            </div>
          </div>
          
          <div className="text-right">
            <p className="text-sm text-gray-600">Receita Hoje</p>
            <p className="text-xl font-bold text-gray-900">
              {formatCurrency(todayIncome)}
            </p>
          </div>
        </div>

        {/* Session Info */}
        {currentSession && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center text-sm text-gray-600 mb-1">
              <Clock className="w-4 h-4 mr-1" />
              <span>
                Aberto em: {new Date(currentSession.opened_at).toLocaleString('pt-BR')}
              </span>
            </div>
            <div className="text-sm text-gray-600">
              Por: {currentSession.opened_by}
            </div>
            <div className="text-sm text-gray-600">
              Valor inicial: {formatCurrency(currentSession.opening_amount)}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex space-x-3">
          {!isOpen ? (
            <button
              onClick={handleOpenCash}
              className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasPermission('cash_register.manage')}
            >
              <Unlock className="w-4 h-4" />
              <span>Abrir Caixa</span>
            </button>
          ) : (
            <button
              onClick={handleCloseCash}
              className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!hasPermission('cash_register.manage')}
            >
              <Lock className="w-4 h-4" />
              <span>Fechar Caixa</span>
            </button>
          )}
        </div>

        {/* Warning for closed cash */}
        {!isOpen && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 mr-2" />
              <div className="text-sm text-yellow-700">
                <p className="font-medium">Caixa fechado</p>
                <p>Abra o caixa para registrar movimentações financeiras.</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Cash Register Modal */}
      {showModal && (
        <CashRegisterModal
          type={modalType}
          currentSession={currentSession}
          onSuccess={handleModalSuccess}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
};

export default CashRegisterWidget;