import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Building2, ArrowUpDown } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';
import { useAppContext } from '../../context/AppContext';
import { BankAccount } from '../../types';

const BanksView: React.FC = () => {
  const { banks, setBanks, bankAccounts, setBankAccounts } = useAppContext();
  const [showModal, setShowModal] = useState(false);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [editingBank, setEditingBank] = useState<any>(null);
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(null);
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    agency: '',
    account: '',
    fee: 0,
    settlementDays: 0
  });
  const [accountFormData, setAccountFormData] = useState({
    name: '',
    bankId: '',
    initialBalance: 0,
    isActive: true
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingBank) {
      setBanks(prev => prev.map(bank => 
        bank.id === editingBank.id 
          ? { ...bank, ...formData }
          : bank
      ));
    } else {
      const newBank = {
        id: banks.length + 1,
        ...formData,
        isActive: true,
        createdAt: new Date().toISOString()
      };
      setBanks(prev => [...prev, newBank]);
    }

    setShowModal(false);
    setEditingBank(null);
    setFormData({ code: '', name: '', agency: '', account: '', fee: 0, settlementDays: 0 });
  };

  const handleAccountSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingAccount) {
      setBankAccounts(prev => prev.map(account => 
        account.id === editingAccount.id 
          ? { 
              ...account, 
              name: accountFormData.name,
              bankId: accountFormData.bankId ? parseInt(accountFormData.bankId) : null,
              isActive: accountFormData.isActive
            }
          : account
      ));
    } else {
      const newAccount = {
        id: Date.now(),
        name: accountFormData.name,
        bankId: accountFormData.bankId ? parseInt(accountFormData.bankId) : null,
        balance: accountFormData.initialBalance,
        isActive: accountFormData.isActive,
        createdAt: new Date().toISOString()
      };
      setBankAccounts(prev => [...prev, newAccount]);
    }

    setShowAccountModal(false);
    setEditingAccount(null);
    setAccountFormData({ name: '', bankId: '', initialBalance: 0, isActive: true });
  };

  const handleEdit = (bank: any) => {
    setEditingBank(bank);
    setFormData({
      code: bank.code,
      name: bank.name,
      agency: bank.agency,
      account: bank.account,
      fee: bank.fee,
      settlementDays: bank.settlementDays
    });
    setShowModal(true);
  };

  const handleEditAccount = (account: BankAccount) => {
    setEditingAccount(account);
    setAccountFormData({
      name: account.name,
      bankId: account.bankId ? account.bankId.toString() : '',
      initialBalance: account.balance,
      isActive: account.isActive
    });
    setShowAccountModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir este banco?')) {
      setBanks(prev => prev.filter(bank => bank.id !== id));
    }
  };

  const handleDeleteAccount = (id: number) => {
    if (window.confirm('Tem certeza que deseja excluir esta conta?')) {
      setBankAccounts(prev => prev.filter(account => account.id !== id));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-gray-900">Bancos</h1>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />
          <span>Novo Banco</span>
        </button>
      </div>

      {/* Banks list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Agência</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conta</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {banks.map(bank => (
                <tr key={bank.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 font-medium">{bank.code}</td>
                  <td className="px-6 py-4">{bank.name}</td>
                  <td className="px-6 py-4">{bank.agency}</td>
                  <td className="px-6 py-4">{bank.account}</td>
                  <td className="px-6 py-4">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(bank)}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(bank.id)}
                        className="text-red-600 hover:text-red-800 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {banks.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-gray-500">
                    Nenhum banco cadastrado
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bank Accounts Section */}
      <div className="mt-10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">Contas Bancárias</h2>
          <button
            onClick={() => setShowAccountModal(true)}
            className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-green-700 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Conta</span>
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Banco</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Saldo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {bankAccounts.map(account => {
                  const bankName = account.bankId 
                    ? banks.find(b => b.id === account.bankId)?.name || 'Banco não encontrado'
                    : 'Sem banco';
                  
                  return (
                    <tr key={account.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 font-medium">{account.name}</td>
                      <td className="px-6 py-4">{bankName}</td>
                      <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(account.balance)}</td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          account.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {account.isActive ? 'Ativo' : 'Inativo'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEditAccount(account)}
                            className="text-blue-600 hover:text-blue-800 transition-colors"
                            title="Editar"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteAccount(account.id)}
                            className="text-red-600 hover:text-red-800 transition-colors"
                            title="Excluir"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
                {bankAccounts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                      Nenhuma conta bancária cadastrada
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Bank Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingBank ? 'Editar Banco' : 'Novo Banco'}
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Código do Banco</label>
                <input
                  type="text"
                  required
                  maxLength={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.code}
                  onChange={(e) => setFormData(prev => ({ ...prev, code: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Banco</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Agência</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.agency}
                  onChange={(e) => setFormData(prev => ({ ...prev, agency: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Conta</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={formData.account}
                  onChange={(e) => setFormData(prev => ({ ...prev, account: e.target.value }))}
                />
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingBank(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingBank ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bank Account Modal */}
      {showAccountModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h2 className="text-xl font-semibold mb-4">
              {editingAccount ? 'Editar Conta' : 'Nova Conta'}
            </h2>
            
            <form onSubmit={handleAccountSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Conta</label>
                <input
                  type="text"
                  required
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={accountFormData.name}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Ex: Caixa, Conta Corrente, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Banco (opcional)</label>
                <select
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  value={accountFormData.bankId}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, bankId: e.target.value }))}
                >
                  <option value="">Selecione um banco</option>
                  {banks.map(bank => (
                    <option key={bank.id} value={bank.id}>{bank.name}</option>
                  ))}
                </select>
              </div>

              {!editingAccount && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Saldo Inicial</label>
                  <input
                    type="number"
                    step="0.01"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={accountFormData.initialBalance}
                    onChange={(e) => setAccountFormData(prev => ({ 
                      ...prev, 
                      initialBalance: parseFloat(e.target.value) || 0 
                    }))}
                  />
                </div>
              )}

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isActive"
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  checked={accountFormData.isActive}
                  onChange={(e) => setAccountFormData(prev => ({ ...prev, isActive: e.target.checked }))}
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Conta ativa
                </label>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAccountModal(false);
                    setEditingAccount(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAccount ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default BanksView;