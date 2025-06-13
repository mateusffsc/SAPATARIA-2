import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { X } from 'lucide-react';
import { formatCurrency, formatCurrencyInput, parseCurrency } from '../../utils/currencyUtils';
import { OrderService } from '../../services/orderService';
import { validatePositiveNumber, validateEntryValue, ERROR_MESSAGES } from '../../utils/validators';
import { useToast } from '../shared/ToastContainer';
import { Order } from '../../types';
import { FinancialService } from '../../services/financialService';

interface PaymentData {
  value: number;
  method: string;
}

interface FormData extends Partial<Order> {
  paymentType?: 'total' | 'partial';
  paymentValue?: number;
}

const PaymentModal: React.FC = () => {
  const { 
    formData, 
    setShowModal, 
    paymentMethods, 
    orders, 
    setOrders,
    setModalType,
    setFormData
  } = useAppContext();
  
  const { showSuccess, showError } = useToast();

  // Garantir que os valores iniciais são números válidos
  const initialValue = (formData as FormData).paymentType === 'total' 
    ? Number((formData as Order)?.remainingValue || 0) 
    : 0;
  
  const [paymentData, setPaymentData] = useState<PaymentData>({
    value: initialValue,
    method: ''
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Atualiza o valor quando formData muda, garantindo que seja um número válido
    const newValue = (formData as FormData).paymentType === 'total'
      ? Number((formData as Order)?.remainingValue || 0)
      : 0;

    setPaymentData(prev => ({
      ...prev,
      value: newValue
    }));
  }, [formData]);

  const handleCurrencyInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    const value = parseCurrency(formatted);
    
    if (!isNaN(value)) {
      setPaymentData(prev => ({
        ...prev,
        value
      }));
    }
  };

  const formatInitialValue = (value: number): string => {
    if (isNaN(value)) return '0,00';
    return formatCurrencyInput((value * 100).toString());
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!validatePositiveNumber(paymentData.value)) {
      newErrors.value = ERROR_MESSAGES.POSITIVE_VALUE_REQUIRED;
    }

    const currentOrder = formData as Order;
    const remainingValue = Number(currentOrder?.remainingValue || 0);
    
    if (!validateEntryValue(paymentData.value, remainingValue)) {
      newErrors.value = 'O valor não pode ser maior que o restante';
    }

    if (!paymentData.method) {
      newErrors.method = 'Selecione uma forma de pagamento';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleClose = () => {
    if (saving) return;
    
    // Limpa os estados em ordem
    setPaymentData({ value: 0, method: '' });
    setErrors({});
    setModalType('');
    setFormData({});
    setShowModal(false);
  };

  const handleSubmit = async () => {
    if (!validateForm() || saving) return;

    setSaving(true);

    try {
      const payment = {
        date: new Date().toISOString().split('T')[0],
        value: paymentData.value,
        method: paymentData.method,
        type: (formData as FormData).paymentType === 'total' ? 'quitação' : 'parcial'
      };

      const currentOrder = formData as Order;
      const remainingValue = Number(currentOrder?.remainingValue || 0);
      
      const updatedOrder: Partial<Order> = {
        id: currentOrder.id,
        remainingValue: Math.max(0, remainingValue - payment.value),
        payments: [...(currentOrder.payments || []), payment],
        status: remainingValue - payment.value <= 0 ? 'finalizada' : currentOrder.status,
        lastModifiedBy: 'Sistema',
        lastModifiedAt: new Date().toISOString()
      };

      // First, create a financial transaction for this payment
      await FinancialService.createTransaction({
        type: 'income',
        amount: payment.value,
        description: `Pagamento ${payment.type} OS ${currentOrder.number} - ${currentOrder.client}`,
        category: 'Serviços',
        reference_type: 'order',
        reference_id: currentOrder.id,
        reference_number: currentOrder.number,
        payment_method: payment.method,
        date: payment.date,
        created_by: 'Sistema'
      });

      // Then update the order
      await OrderService.update(currentOrder.id, updatedOrder);
      setOrders(orders.map(o => o.id === currentOrder.id ? { ...o, ...updatedOrder } : o));
      
      showSuccess('Pagamento registrado com sucesso!');
      handleClose();
      
      // Aguarda um momento para garantir que o modal seja fechado corretamente
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Failed to register payment:', error);
      showError('Erro ao registrar pagamento', error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  // Garantir que os valores são números válidos
  const totalValue = Number(formData?.totalValue || 0);
  const remainingValue = Number((formData as Order)?.remainingValue || 0);
  const paidValue = totalValue - remainingValue;

  // Se não houver dados do formulário, não renderiza o modal
  if (!formData || !formData.number) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-md w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {formData.number} - {formData.client}
          </h2>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
            disabled={saving}
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Valor Total</p>
              <p className="text-lg font-semibold">
                {formatCurrency(totalValue)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Valor Já Pago</p>
              <p className="text-lg font-semibold">
                {formatCurrency(paidValue)}
              </p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600">Valor Restante</p>
            <p className="text-xl font-bold text-red-600">
              {formatCurrency(remainingValue)}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor a Receber *
            </label>
            <input
              type="text"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.value ? 'border-red-500' : ''
              }`}
              value={formatInitialValue(paymentData.value)}
              onChange={handleCurrencyInput}
              placeholder="0,00"
              disabled={saving}
            />
            {errors.value && (
              <p className="text-sm text-red-600 mt-1">{errors.value}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Pagamento *
            </label>
            <select
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                errors.method ? 'border-red-500' : ''
              }`}
              value={paymentData.method}
              onChange={(e) => setPaymentData(prev => ({
                ...prev,
                method: e.target.value
              }))}
              disabled={saving}
            >
              <option value="">Selecione</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.name}>{method.name}</option>
              ))}
            </select>
            {errors.method && (
              <p className="text-sm text-red-600 mt-1">{errors.method}</p>
            )}
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={handleClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
            disabled={saving}
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
          >
            {saving ? 'Processando...' : 'Confirmar Pagamento'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;