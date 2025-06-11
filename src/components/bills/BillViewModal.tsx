import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, Building2, Calendar, DollarSign, CreditCard, CheckCircle, FileText } from 'lucide-react';
import { formatCurrency } from '../../utils/currencyUtils';

const BillViewModal: React.FC = () => {
  const { formData: bill, setShowModal } = useAppContext();

  // Early return if bill data is not fully loaded
  if (!bill || !bill.id) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    if (status === 'paid') {
      return (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <CheckCircle className="w-3 h-3 mr-1" />
          Pago
        </span>
      );
    } else {
      const isOverdue = new Date(bill.dueDate) < new Date();
      return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
          isOverdue ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
        }`}>
          {isOverdue ? 'Vencida' : 'Pendente'}
        </span>
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <FileText className="w-6 h-6 text-blue-600" />
            <h2 className="text-xl font-semibold">Detalhes da Conta</h2>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Status Banner */}
          <div className={`p-4 rounded-lg ${
            bill.status === 'paid' ? 'bg-green-50 border border-green-200' : 
            new Date(bill.dueDate) < new Date() ? 'bg-red-50 border border-red-200' : 
            'bg-yellow-50 border border-yellow-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                {bill.status === 'paid' ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <Calendar className="w-5 h-5 text-yellow-600 mr-2" />
                )}
                <div>
                  <h3 className={`font-medium ${
                    bill.status === 'paid' ? 'text-green-800' : 
                    new Date(bill.dueDate) < new Date() ? 'text-red-800' : 
                    'text-yellow-800'
                  }`}>
                    {bill.status === 'paid' ? 'Conta Paga' : 
                     new Date(bill.dueDate) < new Date() ? 'Conta Vencida' : 
                     'Conta Pendente'}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {bill.status === 'paid' ? 
                      `Pago em ${bill.paidAt ? new Date(bill.paidAt).toLocaleDateString() : 'data não registrada'}` : 
                      `Vencimento: ${new Date(bill.dueDate).toLocaleDateString()}`
                    }
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-gray-600">Valor</p>
                <p className="text-xl font-bold text-gray-900">{formatCurrency(bill.amount)}</p>
              </div>
            </div>
          </div>

          {/* Bill Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Building2 className="w-4 h-4 mr-2" />
                Informações do Fornecedor
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Fornecedor:</span> {bill.supplier}</p>
                <p><span className="font-medium">Categoria:</span> {bill.category}</p>
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-3 flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                Datas
              </h3>
              <div className="space-y-2">
                <p><span className="font-medium">Criado em:</span> {new Date(bill.createdAt).toLocaleDateString()}</p>
                <p><span className="font-medium">Vencimento:</span> {new Date(bill.dueDate).toLocaleDateString()}</p>
                {bill.status === 'paid' && bill.paidAt && (
                  <p><span className="font-medium">Pago em:</span> {new Date(bill.paidAt).toLocaleDateString()}</p>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Descrição</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p>{bill.description}</p>
            </div>
          </div>

          {/* Payment Details */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3 flex items-center">
              <DollarSign className="w-4 h-4 mr-2" />
              Detalhes do Pagamento
            </h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Valor</p>
                  <p className="text-xl font-bold">{formatCurrency(bill.amount)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Status</p>
                  <div className="mt-1">{getStatusBadge(bill.status)}</div>
                </div>
                {bill.status === 'paid' && (
                  <>
                    <div>
                      <p className="text-sm text-gray-600">Forma de Pagamento</p>
                      <p className="font-medium flex items-center">
                        <CreditCard className="w-4 h-4 mr-1 text-gray-500" />
                        {bill.paymentMethod || 'Não informado'}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Pago por</p>
                      <p className="font-medium">{bill.paidBy || 'Não informado'}</p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Additional Information */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Informações Adicionais</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Criado por</p>
                  <p className="font-medium">{bill.createdBy}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">ID da Conta</p>
                  <p className="font-medium">#{bill.id}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default BillViewModal;