import React from 'react';
import { X, Package, User, Calendar, DollarSign, CreditCard } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatCurrency } from '../../utils/formatters';
import { formatSaoPauloDate } from '../../utils/dateUtils';

const ProductSaleViewModal: React.FC = () => {
  const { formData: sale, setShowModal } = useAppContext();

  if (!sale || !sale.id) {
    return null;
  }

  // Calculate payment details
  const getPaymentDetails = () => {
    if (!sale.paymentOption || sale.paymentOption === 'normal') {
      return {
        label: 'Preço Normal',
        details: null
      };
    }
    
    if (sale.paymentOption === 'cash') {
      const discount = sale.cashDiscount || 0;
      const originalAmount = sale.originalAmount || sale.totalAmount;
      const discountAmount = originalAmount * (discount / 100);
      
      return {
        label: `Desconto à Vista (${discount}%)`,
        details: (
          <div className="text-sm text-green-600">
            <p>Valor original: {formatCurrency(originalAmount)}</p>
            <p>Desconto: {formatCurrency(discountAmount)}</p>
          </div>
        )
      };
    }
    
    if (sale.paymentOption === 'installment') {
      const installments = sale.installments || 2;
      const fee = sale.installmentFee || 0;
      const originalAmount = sale.originalAmount || sale.totalAmount;
      const installmentValue = sale.totalAmount / installments;
      
      return {
        label: `Parcelado em ${installments}x de ${formatCurrency(installmentValue)}`,
        details: (
          <div className="text-sm text-blue-600">
            <p>Valor original: {formatCurrency(originalAmount)}</p>
            <p>Taxa: {fee}% por parcela</p>
          </div>
        )
      };
    }
    
    return {
      label: 'Pagamento',
      details: null
    };
  };

  const paymentDetails = getPaymentDetails();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <Package className="w-6 h-6 text-green-600" />
            <h2 className="text-xl font-semibold">Venda de Produtos - {sale.saleNumber}</h2>
          </div>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Sale Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Package className="w-5 h-5 text-green-600" />
                <span className="text-2xl font-bold text-green-600">{sale.items?.length || 0}</span>
              </div>
              <p className="text-sm text-green-600 mt-1">Produtos</p>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <DollarSign className="w-5 h-5 text-blue-600" />
                <span className="text-2xl font-bold text-blue-600">
                  {formatCurrency(sale.totalAmount || 0)}
                </span>
              </div>
              <p className="text-sm text-blue-600 mt-1">Total da Venda</p>
            </div>

            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <Calendar className="w-5 h-5 text-purple-600" />
                <span className="text-lg font-bold text-purple-600">
                  {formatSaoPauloDate(sale.createdAt)}
                </span>
              </div>
              <p className="text-sm text-purple-600 mt-1">Data da Venda</p>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <CreditCard className="w-5 h-5 text-orange-600" />
                <span className="text-sm font-bold text-orange-600">{sale.paymentMethod}</span>
              </div>
              <p className="text-sm text-orange-600 mt-1">Forma de Pagamento</p>
            </div>
          </div>

          {/* Payment Option Details */}
          {sale.paymentOption && sale.paymentOption !== 'normal' && (
            <div className={`p-4 rounded-lg ${
              sale.paymentOption === 'cash' ? 'bg-green-50 border border-green-200' : 
              'bg-blue-50 border border-blue-200'
            }`}>
              <h3 className={`font-medium ${
                sale.paymentOption === 'cash' ? 'text-green-700' : 'text-blue-700'
              }`}>
                {paymentDetails.label}
              </h3>
              {paymentDetails.details}
            </div>
          )}

          {/* Client Information */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <User className="w-5 h-5 mr-2" />
              Informações do Cliente
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nome</p>
                <p className="font-medium">{sale.clientName}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">ID do Cliente</p>
                <p className="font-medium">#{sale.clientId}</p>
              </div>
            </div>
          </div>

          {/* Products List */}
          <div>
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Package className="w-5 h-5 mr-2" />
              Produtos Vendidos
            </h3>
            <div className="bg-white rounded-lg overflow-hidden border">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Produto</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Quantidade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Preço Unit.</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {sale.items?.map((item: any, index: number) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <div className="font-medium">{item.productName}</div>
                        <div className="text-sm text-gray-500">ID: {item.productId}</div>
                      </td>
                      <td className="px-6 py-4 font-medium">{item.quantity}</td>
                      <td className="px-6 py-4">{formatCurrency(item.unitPrice)}</td>
                      <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                  )) || (
                    <tr>
                      <td colSpan={4} className="px-6 py-4 text-center text-gray-500">
                        Nenhum produto encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sale Details */}
          <div className="bg-gray-50 rounded-lg p-6">
            <h3 className="text-lg font-semibold mb-4">Detalhes da Venda</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600">Número da Venda:</span>
                <p className="font-medium">{sale.saleNumber}</p>
              </div>
              <div>
                <span className="text-gray-600">Status:</span>
                <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  sale.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {sale.status === 'completed' ? 'Concluída' : 'Cancelada'}
                </span>
              </div>
              <div>
                <span className="text-gray-600">Criado por:</span>
                <p className="font-medium">{sale.createdBy}</p>
              </div>
              <div>
                <span className="text-gray-600">Data de Criação:</span>
                <p className="font-medium">
                  {formatSaoPauloDate(sale.createdAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Total Summary */}
          <div className="bg-green-50 rounded-lg p-6 border-l-4 border-green-500">
            <div className="flex justify-between items-center">
              <div>
                <h4 className="text-lg font-semibold text-green-800">Total da Venda</h4>
                <p className="text-sm text-green-600">
                  {sale.items?.reduce((sum: number, item: any) => sum + item.quantity, 0) || 0} produtos vendidos
                </p>
              </div>
              <div className="text-right">
                {sale.originalAmount && sale.originalAmount !== sale.totalAmount && (
                  <p className="text-sm text-gray-500 line-through">
                    {formatCurrency(sale.originalAmount)}
                  </p>
                )}
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(sale.totalAmount || 0)}
                </p>
                <p className="text-sm text-green-600">Pago via {sale.paymentMethod}</p>
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

export default ProductSaleViewModal;