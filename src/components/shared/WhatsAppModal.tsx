import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MessageCircle, X } from 'lucide-react';

const WhatsAppModal: React.FC = () => {
  const { formData: order, clients, setShowModal } = useAppContext();
  const client = clients.find(c => c.id === order.clientId);
  const [whatsappNumber, setWhatsappNumber] = useState(client?.phone || '');
  const [message, setMessage] = useState(`
🔧 *Sapataria Guimarães*

Olá ${order.client}!

Temos um valor pendente referente ao serviço:
📋 *OS:* ${order.number}
👟 *Artigo:* ${order.article} ${order.color} ${order.size}
💰 *Valor restante:* R$ ${order.remainingValue.toFixed(2)}
📅 *Vencimento:* ${new Date(order.deliveryDate).toLocaleDateString()}

Para sua comodidade, aceitamos:
💳 PIX, Cartão, Dinheiro

Entre em contato conosco para regularizar.
Obrigado! 😊
  `.trim());

  const sendWhatsApp = () => {
    const phoneNumber = whatsappNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    window.open(`https://wa.me/55${phoneNumber}?text=${encodedMessage}`, '_blank');
    setShowModal(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full">
        <div className="p-6 border-b flex items-center justify-between">
          <h2 className="text-xl font-semibold flex items-center">
            <MessageCircle className="w-5 h-5 text-green-600 mr-2" />
            Enviar Cobrança - {order.number}
          </h2>
          <button
            onClick={() => setShowModal(false)}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Número WhatsApp
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

          <div className="bg-blue-50 p-3 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>Informações:</strong> Cliente: {order.client} | 
              Valor: R$ {order.remainingValue.toFixed(2)} | 
              Vencimento: {new Date(order.deliveryDate).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="p-6 border-t flex justify-end space-x-3">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={sendWhatsApp}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar Cobrança</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default WhatsAppModal;