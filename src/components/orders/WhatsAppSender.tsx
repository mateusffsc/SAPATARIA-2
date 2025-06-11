import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { Order } from '../../types';
import { formatWhatsAppMessage, sendToWhatsApp } from '../../services/whatsappService';

interface WhatsAppSenderProps {
  order: Order;
  onClose: () => void;
  phone?: string;
}

const WhatsAppSender: React.FC<WhatsAppSenderProps> = ({ order, onClose, phone = '' }) => {
  const [whatsappNumber, setWhatsappNumber] = useState(phone);
  const [message, setMessage] = useState(formatWhatsAppMessage(order));

  const handleSend = () => {
    if (!whatsappNumber) {
      alert('Por favor, insira um número de telefone');
      return;
    }
    sendToWhatsApp(whatsappNumber, message);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <MessageCircle className="w-5 h-5 text-green-600" />
            <h2 className="text-xl font-semibold">Enviar OS por WhatsApp</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número do WhatsApp
            </label>
            <input
              type="tel"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
              placeholder="(31) 99999-9999"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Mensagem
            </label>
            <textarea
              rows={12}
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 font-mono text-sm"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-2">Informações da OS</h3>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>
                <span className="font-medium">Número:</span> {order.number}
              </div>
              <div>
                <span className="font-medium">Cliente:</span> {order.client}
              </div>
              <div>
                <span className="font-medium">Valor:</span> R$ {order.totalValue.toFixed(2)}
              </div>
              <div>
                <span className="font-medium">Status:</span> {order.status}
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleSend}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppSender;