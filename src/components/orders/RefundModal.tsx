import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { X, AlertTriangle, Save } from 'lucide-react';
import { Order } from '../../types';
import { formatCurrency } from '../../utils/currencyUtils';

interface RefundData {
  amount: number;
  method: string;
  reason: string;
  observations: string;
}

interface RefundModalProps {
  order: Order;
  onClose: () => void;
  onConfirm: (data: RefundData) => void;
}

const RefundModal: React.FC<RefundModalProps> = ({ order, onClose, onConfirm }) => {
  const { paymentMethods } = useAppContext();
  const [formData, setFormData] = useState<RefundData>({
    amount: order.totalValue - order.remainingValue, // Total paid amount
    method: '',
    reason: '',
    observations: ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.method || !formData.reason) {
      alert('Por favor, preencha todos os campos obrigatórios');
      return;
    }

    onConfirm(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-lg w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-xl font-semibold">Estorno Necessário - OS Cancelada</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-600">
              Esta OS possui pagamentos registrados e precisa ser estornada antes do cancelamento.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                OS
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                value={order.number}
                readOnly
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cliente
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                value={order.client}
                readOnly
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valor do Estorno *
            </label>
            <input
              type="text"
              className="w-full px-3 py-2 border rounded-lg"
              value={formatCurrency(formData.amount)}
              onChange={(e) => {
                const value = e.target.value.replace(/\D/g, '');
                setFormData(prev => ({ ...prev, amount: Number(value) / 100 }));
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Forma de Estorno *
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.method}
              onChange={(e) => setFormData(prev => ({ ...prev, method: e.target.value }))}
              required
            >
              <option value="">Selecione a forma de estorno</option>
              {paymentMethods.map(method => (
                <option key={method.id} value={method.name}>{method.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo do Cancelamento *
            </label>
            <select
              className="w-full px-3 py-2 border rounded-lg"
              value={formData.reason}
              onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
              required
            >
              <option value="">Selecione o motivo</option>
              <option value="Desistência do cliente">Desistência do cliente</option>
              <option value="Erro na OS">Erro na OS</option>
              <option value="Serviço não pode ser realizado">Serviço não pode ser realizado</option>
              <option value="Produto indisponível">Produto indisponível</option>
              <option value="Outros">Outros</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Observações *
            </label>
            <textarea
              className="w-full px-3 py-2 border rounded-lg"
              rows={3}
              value={formData.observations}
              onChange={(e) => setFormData(prev => ({ ...prev, observations: e.target.value }))}
              required
              placeholder="Descreva o motivo do cancelamento e estorno..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center space-x-2"
            >
              <Save className="w-4 h-4" />
              <span>Registrar Estorno e Cancelar OS</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RefundModal;