import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Calendar, DollarSign, AlertTriangle, Check, Edit, Trash2, CreditCard, Eye } from 'lucide-react';
import { Bill } from '../../types';
import { supabase } from '../../lib/supabase';
import { FinancialService } from '../../services/financialService';
import { useToast } from '../../components/shared/ToastContainer';
import { BillService } from '../../services/billService';

const BillsView: React.FC = () => {
  const { currentUser, paymentMethods, bills, setBills, setModalType, setFormData, setShowModal, suppliers } = useAppContext();
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [showModal, setShowBillModal] = useState(false);
  const [editingBill, setEditingBill] = useState<Bill | null>(null);
  const [billFormData, setBillFormData] = useState({
    supplier: '',
    description: '',
    category: '',
    amount: '',
    dueDate: '',
    status: 'pending' as const,
    paymentMethod: ''
  });

  // Get categories from suppliers
  const supplierCategories = suppliers.map(s => s.category || 'Fornecedor').filter(Boolean);
  
  // Combine with standard categories
  const categories = [
    ...new Set([
      ...supplierCategories,
      'Materiais e Insumos',
      'Aluguel',
      'Energia Elétrica',
      'Telefone/Internet',
      'Equipamentos',
      'Marketing',
      'Impostos',
      'Salários',
      'Manutenção',
      'Outros'
    ])
  ].sort();

  const loadBills = async () => {
    try {
      setLoading(true);
      const data = await BillService.getAll();
      setBills(data);
    } catch (error) {
      console.error('Error loading bills:', error);
      showError('Erro ao carregar contas', 'Não foi possível carregar as contas a pagar.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBills();
  }, []);

  const handleSave = async () => {
    try {
      const billData = {
        supplier: billFormData.supplier,
        description: billFormData.description,
        category: billFormData.category,
        amount: parseFloat(billFormData.amount),
        dueDate: billFormData.dueDate,
        status: billFormData.status,
        paymentMethod: billFormData.paymentMethod,
        createdBy: currentUser?.name || 'Sistema'
      };

      if (editingBill) {
        const updatedBill = await BillService.update(editingBill.id, billData);
        setBills(prev => prev.map(b => b.id === editingBill.id ? updatedBill : b));
        showSuccess('Conta atualizada com sucesso!');
      } else {
        const newBill = await BillService.create(billData as any);
        setBills(prev => [newBill, ...prev]);
        showSuccess('Conta cadastrada com sucesso!');
      }

      resetForm();
    } catch (error) {
      console.error('Error saving bill:', error);
      showError('Erro ao salvar conta', 'Não foi possível salvar a conta. Tente novamente.');
    }
  };

  const resetForm = () => {
    setBillFormData({
      supplier: '',
      description: '',
      category: '',
      amount: '',
      dueDate: '',
      status: 'pending',
      paymentMethod: ''
    });
    setEditingBill(null);
    setShowBillModal(false);
  };

  const handleEdit = (bill: Bill) => {
    setBillFormData({
      supplier: bill.supplier,
      description: bill.description,
      category: bill.category,
      amount: bill.amount.toString(),
      dueDate: bill.dueDate,
      status: bill.status,
      paymentMethod: bill.paymentMethod || ''
    });
    setEditingBill(bill);
    setShowBillModal(true);
  };

  const handleView = (bill: Bill) => {
    setModalType('view-bill');
    setFormData(bill);
    setShowModal(true);
  };

  const markAsPaid = async (billId: number) => {
    // Open payment modal instead of directly marking as paid
    const bill = bills.find(b => b.id === billId);
    if (bill) {
      setBillFormData({
        ...bill,
        amount: bill.amount.toString(),
        status: 'paid',
        paymentMethod: bill.paymentMethod || ''
      });
      setEditingBill(bill);
      setShowBillModal(true);
    }
  };

  const confirmPayment = async () => {
    if (!editingBill) return;
    if (!billFormData.paymentMethod) {
      showError('Forma de pagamento obrigatória', 'Selecione uma forma de pagamento para continuar.');
      return;
    }

    try {
      const updatedBill = await BillService.markAsPaid(
        editingBill.id,
        billFormData.paymentMethod,
        currentUser?.name || 'Sistema'
      );
      
      setBills(prev => prev.map(b => b.id === editingBill.id ? updatedBill : b));
      showSuccess('Conta marcada como paga com sucesso!');
      resetForm();
    } catch (error) {
      console.error('Error marking bill as paid:', error);
      showError('Erro ao marcar conta como paga', 'Não foi possível processar o pagamento. Tente novamente.');
    }
  };

  const deleteBill = async (billId: number) => {
    if (window.confirm('Deseja excluir esta conta?')) {
      try {
        await BillService.delete(billId);
        setBills(prev => prev.filter(b => b.id !== billId));
        showSuccess('Conta excluída com sucesso!');
      } catch (error) {
        console.error('Error deleting bill:', error);
        showError('Erro ao excluir conta', 'Não foi possível excluir a conta. Tente novamente.');
      }
    }
  };

  const pendingBills = bills.filter(bill => bill.status === 'pending');
  const overdueBills = pendingBills.filter(bill => new Date(bill.dueDate) < new Date());
  const totalPending = pendingBills.reduce((sum, bill) => sum + bill.amount, 0);
  const totalOverdue = overdueBills.reduce((sum, bill) => sum + bill.amount, 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Contas a Pagar</h1>
        <button
          onClick={() => setShowBillModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Nova Conta</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <DollarSign className="w-6 h-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Pendente</p>
              <p className="text-2xl font-bold text-gray-900">R$ {totalPending.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <AlertTriangle className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Em Atraso</p>
              <p className="text-2xl font-bold text-red-600">R$ {totalOverdue.toFixed(2)}</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calendar className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Contas Pendentes</p>
              <p className="text-2xl font-bold text-gray-900">{pendingBills.length}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fornecedor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descrição</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Categoria</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Valor</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vencimento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Forma de Pagamento</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {bills.map(bill => {
                const isOverdue = new Date(bill.dueDate) < new Date() && bill.status === 'pending';
                return (
                  <tr key={bill.id} className={isOverdue ? 'bg-red-50' : ''}>
                    <td className="px-6 py-4">{bill.supplier}</td>
                    <td className="px-6 py-4">{bill.description}</td>
                    <td className="px-6 py-4">{bill.category}</td>
                    <td className="px-6 py-4 font-bold">R$ {bill.amount.toFixed(2)}</td>
                    <td className="px-6 py-4">
                      {new Date(bill.dueDate).toLocaleDateString('pt-BR')}
                      {isOverdue && <span className="text-red-600 text-xs block">VENCIDA</span>}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        bill.status === 'paid' ? 'bg-green-100 text-green-800' :
                        isOverdue ? 'bg-red-100 text-red-800' :
                        'bg-orange-100 text-orange-800'
                      }`}>
                        {bill.status === 'paid' ? 'Pago' : isOverdue ? 'Vencida' : 'Pendente'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {bill.paymentMethod || '-'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleView(bill)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Ver detalhes"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {bill.status === 'pending' && (
                          <button
                            onClick={() => markAsPaid(bill.id)}
                            className="text-green-600 hover:text-green-800"
                            title="Marcar como pago"
                          >
                            <Check className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => handleEdit(bill)}
                          className="text-blue-600 hover:text-blue-800"
                          title="Editar"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => deleteBill(bill.id)}
                          className="text-red-600 hover:text-red-800"
                          title="Excluir"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-gray-500">
                    Nenhuma conta encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bill Form Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold mb-4">
                {editingBill ? (editingBill.status === 'paid' ? 'Detalhes da Conta' : 'Editar Conta') : 'Nova Conta a Pagar'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fornecedor
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={billFormData.supplier}
                    onChange={(e) => setBillFormData(prev => ({ ...prev, supplier: e.target.value }))}
                    placeholder="Nome do fornecedor"
                    disabled={editingBill?.status === 'paid'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descrição
                  </label>
                  <input
                    type="text"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={billFormData.description}
                    onChange={(e) => setBillFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Descrição da conta"
                    disabled={editingBill?.status === 'paid'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoria
                  </label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={billFormData.category}
                    onChange={(e) => setBillFormData(prev => ({ ...prev, category: e.target.value }))}
                    disabled={editingBill?.status === 'paid'}
                  >
                    <option value="">Selecione a categoria</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Valor
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={billFormData.amount}
                    onChange={(e) => setBillFormData(prev => ({ ...prev, amount: e.target.value }))}
                    placeholder="0,00"
                    disabled={editingBill?.status === 'paid'}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Data de Vencimento
                  </label>
                  <input
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    value={billFormData.dueDate}
                    onChange={(e) => setBillFormData(prev => ({ ...prev, dueDate: e.target.value }))}
                    disabled={editingBill?.status === 'paid'}
                  />
                </div>

                {/* Payment Method Field */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Forma de Pagamento {billFormData.status === 'paid' && <span className="text-red-500">*</span>}
                  </label>
                  <div className="relative">
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                      value={billFormData.paymentMethod}
                      onChange={(e) => setBillFormData(prev => ({ ...prev, paymentMethod: e.target.value }))}
                      required={billFormData.status === 'paid'}
                      disabled={editingBill?.status === 'paid'}
                    >
                      <option value="">Selecione a forma de pagamento</option>
                      {paymentMethods.map(method => (
                        <option key={method.id} value={method.name}>{method.name}</option>
                      ))}
                    </select>
                    <CreditCard className="absolute right-3 top-2.5 text-gray-400 pointer-events-none" />
                  </div>
                  {billFormData.status === 'paid' && !billFormData.paymentMethod && (
                    <p className="text-red-500 text-sm mt-1">Forma de pagamento é obrigatória para contas pagas</p>
                  )}
                </div>

                {/* Status Field - Only show for editing */}
                {editingBill && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      value={billFormData.status}
                      onChange={(e) => setBillFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'paid' }))}
                      disabled={editingBill.status === 'paid'}
                    >
                      <option value="pending">Pendente</option>
                      <option value="paid">Pago</option>
                    </select>
                  </div>
                )}

                {/* Payment Details - Show when paying a bill */}
                {editingBill && billFormData.status === 'paid' && editingBill.status === 'pending' && (
                  <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                    <h4 className="font-medium text-green-800 mb-2 flex items-center">
                      <Check className="w-4 h-4 mr-2" />
                      Confirmar Pagamento
                    </h4>
                    <p className="text-sm text-green-700 mb-2">
                      Você está marcando esta conta como paga. Confirme os detalhes abaixo:
                    </p>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-green-700">Valor:</span>
                        <span className="font-medium ml-1">R$ {parseFloat(billFormData.amount).toFixed(2)}</span>
                      </div>
                      <div>
                        <span className="text-green-700">Data:</span>
                        <span className="font-medium ml-1">{new Date().toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={resetForm}
                  className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
                >
                  {editingBill?.status === 'paid' ? 'Fechar' : 'Cancelar'}
                </button>
                
                {editingBill?.status !== 'paid' && (
                  <>
                    {editingBill && billFormData.status === 'paid' && editingBill.status === 'pending' ? (
                      <button
                        onClick={confirmPayment}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center"
                      >
                        <Check className="w-4 h-4 mr-2" />
                        Confirmar Pagamento
                      </button>
                    ) : (
                      <button
                        onClick={handleSave}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        {editingBill ? 'Atualizar' : 'Salvar'}
                      </button>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BillsView;