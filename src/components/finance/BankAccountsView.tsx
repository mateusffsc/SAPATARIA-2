import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, DollarSign, ArrowRight, RefreshCw } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/currencyUtils';
import { BankService } from '../../services/bankService';
import { supabase } from '../../lib/supabase';
import { useToast } from '../shared/ToastContainer';
import BankAccountModal from './BankAccountModal';
import TransferModal from './TransferModal';

interface BankAccount {
  id: number;
  name: string;
  balance: number;
  bankId?: number;
  bankName?: string;
}

const BankAccountsView: React.FC = () => {
  const { banks } = useAppContext();
  const { showSuccess, showError } = useToast();
  
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  
  const loadAccounts = async () => {
    try {
      setLoading(true);
      const accounts = await BankService.getAccounts();
      
      // Add bank names to accounts
      const accountsWithBankNames = accounts.map(account => {
        const bank = banks.find(b => b.id === account.bankId);
        return {
          ...account,
          bankName: bank?.name
        };
      });
      
      setAccounts(accountsWithBankNames);
    } catch (error) {
      console.error('Error loading bank accounts:', error);
      showError('Erro ao carregar contas', 'Não foi possível carregar as contas bancárias.');
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    loadAccounts();
  }, [banks]);

  // Check if "Caixa Loja" account exists, if not create it
  useEffect(() => {
    const createCaixaLojaAccount = async () => {
      try {
        const caixaLoja = accounts.find(a => a.name === 'Caixa Loja');
        if (!caixaLoja) {
          await BankService.createAccount({
            name: 'Caixa Loja',
            bankId: null,
            balance: 0,
            isActive: true
          });
          showSuccess('Conta "Caixa Loja" criada automaticamente');
          loadAccounts();
        }
      } catch (error) {
        console.error('Error creating Caixa Loja account:', error);
      }
    };
    
    if (!loading && accounts.length > 0) {
      createCaixaLojaAccount();
    }
  }, [accounts, loading]);
  
  const handleDelete = async (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
      try {
        // Check if account has balance
        const account = accounts.find(a => a.id === id);
        if (account && account.balance !== 0) {
          showError(
            'Conta com saldo', 
            'Não é possível excluir uma conta com saldo. Transfira o saldo para outra conta primeiro.'
          );
          return;
        }
        
        // Don't allow deletion of special accounts
        if (account && (account.name === 'Caixa Loja' || account.name === 'Caixa' || account.name === 'Cofre')) {
          showError(
            'Conta especial', 
            'Não é possível excluir esta conta especial do sistema.'
          );
          return;
        }
        
        // Soft delete by setting is_active to false
        const { error } = await supabase
          .from('bank_accounts')
          .update({ is_active: false })
          .eq('id', id);
          
        if (error) throw error;
        
        showSuccess('Conta excluída com sucesso!');
        loadAccounts();
      } catch (error) {
        console.error('Error deleting account:', error);
        showError('Erro ao excluir conta', 'Não foi possível excluir a conta bancária.');
      }
    }
  };
  
  const handleSave = async (accountData: any) => {
    try {
      if (editingAccount) {
        // Update existing account
        const { error } = await supabase
          .from('bank_accounts')
          .update({
            name: accountData.name,
            bank_id: accountData.bankId || null
          })
          .eq('id', editingAccount.id);
          
        if (error) throw error;
        
        showSuccess('Conta atualizada com sucesso!');
      } else {
        // Create new account with initial balance
        const { data, error } = await supabase
          .from('bank_accounts')
          .insert({
            name: accountData.name,
            bank_id: accountData.bankId || null,
            balance: accountData.initialBalance || 0,
            is_active: true
          })
          .select()
          .single();
          
        if (error) throw error;
        
        // If initial balance is greater than 0, create a financial transaction
        if (accountData.initialBalance > 0) {
          const { error: transactionError } = await supabase
            .from('financial_transactions')
            .insert({
              type: 'income',
              amount: accountData.initialBalance,
              description: `Saldo inicial - ${accountData.name}`,
              category: 'Saldo Inicial',
              reference_type: 'initial_balance',
              destination_account_id: data.id,
              payment_method: 'Manual',
              date: new Date().toISOString().split('T')[0],
              created_by: 'Admin'
            });
            
          if (transactionError) {
            console.error('Error creating initial balance transaction:', transactionError);
          }
        }
        
        showSuccess('Conta criada com sucesso!');
      }
      
      setShowAccountModal(false);
      setEditingAccount(null);
      loadAccounts();
    } catch (error) {
      console.error('Error saving account:', error);
      showError('Erro ao salvar conta', 'Não foi possível salvar a conta bancária.');
    }
  };
  
  // Calculate total balance
  const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
  
  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contas Bancárias</h1>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowTransferModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
          >
            <ArrowRight className="w-4 h-4" />
            <span>Nova Transferência</span>
          </button>
          <button
            onClick={() => setShowAccountModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
          <button
            onClick={loadAccounts}
            className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-gray-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Atualizar</span>
          </button>
        </div>
      </div>
      
      {/* Total Balance Card */}
      <div className="bg-white p-6 rounded-lg shadow border-l-4 border-blue-500">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">Saldo Total</h2>
            <p className="text-3xl font-bold text-blue-600 mt-2">{formatCurrency(totalBalance)}</p>
          </div>
          <div className="p-4 bg-blue-100 rounded-full">
            <DollarSign className="w-8 h-8 text-blue-600" />
          </div>
        </div>
      </div>
      
      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map(account => (
          <div 
            key={account.id} 
            className={`bg-white rounded-lg shadow p-6 hover:shadow-md transition-shadow ${
              account.name === 'Caixa Loja' ? 'border-l-4 border-green-500' : ''
            }`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Building2 className="w-6 h-6 text-blue-600" />
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-semibold">{account.name}</h3>
                  {account.bankName && (
                    <p className="text-sm text-gray-600">{account.bankName}</p>
                  )}
                </div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => {
                    setEditingAccount(account);
                    setShowAccountModal(true);
                  }}
                  className="text-blue-600 hover:text-blue-800 transition-colors"
                  title="Editar"
                >
                  <Edit className="w-4 h-4" />
                </button>
                {/* Only allow deletion if not a special account */}
                {account.name !== 'Caixa Loja' && account.name !== 'Caixa' && account.name !== 'Cofre' && (
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 hover:text-red-800 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
            
            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-600">Saldo Atual</p>
                <p className={`text-xl font-bold ${account.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatCurrency(account.balance)}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Account Modal */}
      {showAccountModal && (
        <BankAccountModal
          account={editingAccount}
          banks={banks}
          onSave={handleSave}
          onClose={() => {
            setShowAccountModal(false);
            setEditingAccount(null);
          }}
        />
      )}
      
      {/* Transfer Modal */}
      {showTransferModal && (
        <TransferModal
          accounts={accounts}
          onClose={() => setShowTransferModal(false)}
          onSuccess={loadAccounts}
        />
      )}
    </div>
  );
};

export default BankAccountsView;