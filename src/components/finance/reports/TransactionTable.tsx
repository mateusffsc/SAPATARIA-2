import React, { useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, Edit, Trash2, ExternalLink, ArrowRight } from 'lucide-react';
import { FinancialTransaction } from '../../../services/financialService';
import { formatCurrency } from '../../../utils/currencyUtils';
import { useAppContext } from '../../../context/AppContext';

interface TransactionTableProps {
  transactions: FinancialTransaction[];
  onRefresh: () => void;
  onDelete: (id: number) => void;
  onEdit: (transaction: FinancialTransaction) => void;
}

const TransactionTable: React.FC<TransactionTableProps> = ({ 
  transactions, 
  onRefresh,
  onDelete,
  onEdit
}) => {
  const { setCurrentView, setModalType, setFormData, setShowModal } = useAppContext();
  const [expandedRow, setExpandedRow] = useState<number | null>(null);

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('pt-BR');
  };
  
  const getTypeIndicator = (type: string) => {
    if (type === 'income') {
      return (
        <div className="flex items-center text-green-600">
          <ArrowUpCircle className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">RECEITA</span>
        </div>
      );
    } else if (type === 'expense') {
      return (
        <div className="flex items-center text-red-600">
          <ArrowDownCircle className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">DESPESA</span>
        </div>
      );
    } else {
      return (
        <div className="flex items-center text-blue-600">
          <ArrowRight className="w-4 h-4 mr-1" />
          <span className="text-xs font-medium">TRANSFERÊNCIA</span>
        </div>
      );
    }
  };

  const handleReferenceClick = (transaction: FinancialTransaction) => {
    // Handle order references
    if (transaction.reference_type === 'order') {
      // If we have a reference_number (OS-XXX), use that
      if (transaction.reference_number) {
        setModalType('view-order');
        setFormData({ id: transaction.reference_number });
        setShowModal(true);
      } 
      // Otherwise fall back to reference_id
      else if (transaction.reference_id) {
        setModalType('view-order');
        setFormData({ id: transaction.reference_id });
        setShowModal(true);
      }
    } 
    // Handle bill references
    else if (transaction.reference_type === 'bill' && transaction.reference_id) {
      // Navigate to bills view and open bill modal
      setModalType('view-bill');
      setFormData({ id: transaction.reference_id });
      setShowModal(true);
    } 
    // Handle product sale references
    else if (transaction.reference_type === 'sale') {
      // If we have a reference_number (VD-XXX), use that
      if (transaction.reference_number) {
        setModalType('view-sale');
        setFormData({ id: transaction.reference_number });
        setShowModal(true);
      }
      // Otherwise fall back to reference_id
      else if (transaction.reference_id) {
        setModalType('view-sale');
        setFormData({ id: transaction.reference_id });
        setShowModal(true);
      }
    }
  };

  const getReferenceLink = (transaction: FinancialTransaction) => {
    // Order reference
    if (transaction.reference_type === 'order') {
      const orderNumber = transaction.reference_number || `OS-${transaction.reference_id}`;
      
      return (
        <button 
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          onClick={() => handleReferenceClick(transaction)}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          {orderNumber}
        </button>
      );
    }
    
    // Bill reference
    if (transaction.reference_type === 'bill' && transaction.reference_id) {
      return (
        <button 
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          onClick={() => handleReferenceClick(transaction)}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          Conta-{transaction.reference_id}
        </button>
      );
    }
    
    // Product sale reference
    if (transaction.reference_type === 'sale') {
      const saleNumber = transaction.reference_number || `VD-${transaction.reference_id}`;
      
      return (
        <button 
          className="text-blue-600 hover:text-blue-800 flex items-center text-sm"
          onClick={() => handleReferenceClick(transaction)}
        >
          <ExternalLink className="w-3 h-3 mr-1" />
          {saleNumber}
        </button>
      );
    }
    
    // Transfer reference
    if (transaction.reference_type === 'transfer') {
      return (
        <span className="text-blue-600 text-sm flex items-center">
          <ArrowRight className="w-3 h-3 mr-1" />
          Transferência
        </span>
      );
    }
    
    return <span className="text-gray-500 text-sm">Manual</span>;
  };

  const toggleRowExpand = (id: number) => {
    setExpandedRow(expandedRow === id ? null : id);
  };

  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="p-6 border-b">
        <h2 className="text-lg font-semibold">Movimentações Financeiras</h2>
        <p className="text-sm text-gray-600 mt-1">
          {transactions.length} transações encontradas
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Data/Hora
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tipo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Descrição
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Categoria
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Forma Pagamento
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Valor
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Saldo
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Referência
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ações
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {transactions.map((transaction: any) => (
              <tr 
                key={transaction.id} 
                className={`hover:bg-gray-50 cursor-pointer ${expandedRow === transaction.id ? 'bg-blue-50' : ''}`}
                onClick={() => toggleRowExpand(transaction.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <div>
                    <div>{new Date(transaction.date).toLocaleDateString('pt-BR')}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleTimeString('pt-BR')}
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {getTypeIndicator(transaction.type)}
                </td>
                <td className="px-6 py-4 text-sm text-gray-900 max-w-xs">
                  <div className="truncate" title={transaction.description}>
                    {transaction.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  <span className="px-2 py-1 bg-gray-100 rounded-full text-xs">
                    {transaction.category}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                  {transaction.payment_method || '-'}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <span className={
                    transaction.type === 'income' ? 'text-green-600' : 
                    transaction.type === 'expense' ? 'text-red-600' : 
                    'text-blue-600'
                  }>
                    {transaction.type === 'income' ? '+' : 
                     transaction.type === 'expense' ? '-' : 
                     '↔'} {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-gray-900">
                  {formatCurrency(transaction.runningBalance || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  {getReferenceLink(transaction)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500" onClick={(e) => e.stopPropagation()}>
                  {transaction.reference_type === 'manual' && (
                    <div className="flex space-x-2">
                      <button
                        onClick={() => onEdit(transaction)}
                        className="text-blue-600 hover:text-blue-800"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => onDelete(transaction.id)}
                        className="text-red-600 hover:text-red-800"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={9} className="px-6 py-4 text-center text-gray-500">
                  Nenhuma transação encontrada para os filtros selecionados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default TransactionTable;