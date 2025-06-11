import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { useAuth } from '../../context/AuthContext';
import { X, Download, Edit, MessageCircle, DollarSign, CheckCircle } from 'lucide-react';
import { getStatusColor, getStatusIcon } from '../../utils/statusUtils';
import OrderQRCode from './OrderQRCode';
import WhatsAppSender from './WhatsAppSender';
import { formatCurrency } from '../../utils/currencyUtils';
import PaymentModal from '../payments/PaymentModal';

interface Service {
  name: string;
  price: number;
  details?: string;
  technicianId: string | number;
}

interface Payment {
  date: string;
  value: number;
  method: string;
  type: string;
}

const OrderViewModal: React.FC = () => {
  const { formData: order, clients, technicians, setShowModal, setModalType, setFormData } = useAppContext();
  const { hasPermission } = useAuth();
  const [showWhatsApp, setShowWhatsApp] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  
  // Early return if order data is not fully loaded
  if (!order || !order.number || !order.status) {
    return null;
  }
  
  const client = clients.find(c => c.id === order.clientId);

  // Get payment option details
  const getPaymentOptionDetails = () => {
    if (!order.paymentOption || order.paymentOption === 'normal') {
      return null;
    }
    
    if (order.paymentOption === 'cash') {
      const discount = order.cashDiscount || 0;
      const originalValue = order.originalTotalValue || order.totalValue;
      const discountAmount = originalValue * (discount / 100);
      
      return (
        <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-4">
          <h4 className="font-medium text-green-700 mb-2">Desconto à Vista ({discount}%)</h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">Valor Original:</p>
              <p className="font-medium line-through">{formatCurrency(originalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Desconto:</p>
              <p className="font-medium text-green-600">- {formatCurrency(discountAmount)}</p>
            </div>
          </div>
        </div>
      );
    }
    
    if (order.paymentOption === 'installment') {
      const installments = order.installments || 2;
      const fee = order.installmentFee || 0;
      const originalValue = order.originalTotalValue || order.totalValue;
      const feeAmount = originalValue * (fee / 100) * installments;
      const installmentValue = order.totalValue / installments;
      
      return (
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-4">
          <h4 className="font-medium text-blue-700 mb-2">
            Parcelado em {installments}x de {formatCurrency(installmentValue)}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <p className="text-sm text-gray-600">Valor Original:</p>
              <p className="font-medium">{formatCurrency(originalValue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Juros ({fee}% por parcela):</p>
              <p className="font-medium text-blue-600">+ {formatCurrency(feeAmount)}</p>
            </div>
          </div>
        </div>
      );
    }
    
    return null;
  };

  const openPaymentModal = (order: any, isFullPayment = false) => {
    console.log('Abrindo modal de pagamento:', { order, isFullPayment }); // Debug
    setFormData({
      ...order,
      paymentType: isFullPayment ? 'total' : 'partial',
      paymentValue: isFullPayment ? order.remainingValue : 0,
      paymentMethod: ''
    });
    setModalType('payment');
    setShowModal(true);
    setShowPayment(false);
  };

  const openWhatsAppModal = (order: any) => {
    setShowWhatsApp(true);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-screen overflow-y-auto">
        <div className="p-6 border-b flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center space-x-3">
            <h2 className="text-xl font-semibold">Ordem de Serviço - {order.number}</h2>
            {order.status && (
              <span className={`inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'aberta')}`}>
                {getStatusIcon(order.status || 'aberta')}
                <span className="capitalize">{(order.status || 'aberta').replace('-', ' ')}</span>
              </span>
            )}
          </div>
          <div className="flex items-center space-x-3">
            <button
              onClick={() => setShowWhatsApp(true)}
              className="px-3 py-1 bg-green-600 text-white rounded text-sm flex items-center space-x-1 hover:bg-green-700 transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-1 bg-gray-600 text-white rounded text-sm flex items-center space-x-1 hover:bg-gray-700 transition-colors"
            >
              <Download className="w-4 h-4" />
              <span>Imprimir</span>
            </button>
            <button
              onClick={() => setShowModal(false)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Header with basic info */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-3">
              <h3 className="font-medium text-gray-900 mb-2">Informações da OS</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Número:</span> {order.number}</p>
                <p><span className="font-medium">Data:</span> {order.date ? new Date(order.date).toLocaleDateString() : 'Não informado'}</p>
                <p><span className="font-medium">Entrega:</span> {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'Não informado'}</p>
                <p>
                  <span className="font-medium">Status:</span>
                  <span className={`ml-2 inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status || 'aberta')}`}>
                    {getStatusIcon(order.status || 'aberta')}
                    <span className="capitalize">{(order.status || 'aberta').replace('-', ' ')}</span>
                  </span>
                </p>
              </div>
            </div>

            <div className="flex flex-col items-center justify-center">
              <OrderQRCode 
                orderId={order.id} 
                orderNumber={order.number}
                showDownload={true}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Cliente</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Nome:</span> {order.client || 'Não informado'}</p>
                {client && (
                  <>
                    <p><span className="font-medium">CPF:</span> {client.cpf || 'Não informado'}</p>
                    <p><span className="font-medium">Telefone:</span> {client.phone || 'Não informado'}</p>
                    <p><span className="font-medium">E-mail:</span> {client.email || 'Não informado'}</p>
                    <p><span className="font-medium">Endereço:</span></p>
                    <p className="ml-4">
                      {client.street || ''}, {client.number || ''}
                      {client.complement && <span> - {client.complement}</span>}<br />
                      {client.neighborhood || ''}<br />
                      {client.city || ''} - {client.state || ''}<br />
                      CEP: {client.zipCode || 'Não informado'}
                    </p>
                  </>
                )}
              </div>
            </div>

            <div>
              <h3 className="font-medium text-gray-900 mb-2">Artigo</h3>
              <div className="space-y-1 text-sm">
                <p><span className="font-medium">Tipo:</span> {order.article || 'Não informado'}</p>
                <p><span className="font-medium">Marca:</span> {order.brand || 'Não informado'}</p>
                <p><span className="font-medium">Modelo:</span> {order.model || 'Não informado'}</p>
                <p><span className="font-medium">Cor:</span> {order.color || 'Não informado'}</p>
                <p><span className="font-medium">Tamanho:</span> {order.size || 'Não informado'}</p>
                <p><span className="font-medium">Número de Série:</span> {order.serialNumber || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Item description */}
          {order.description && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Descrição do Artigo</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{order.description}</p>
            </div>
          )}

          {/* Services */}
          <div>
            <h3 className="font-medium text-gray-900 mb-3">Serviços</h3>
            <div className="space-y-3">
              {(order.services || []).map((service: Service, index: number) => {
                const technician = technicians.find(t => t.id === Number(service.technicianId));
                return (
                  <div key={index} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-medium">{service.name || 'Serviço não especificado'}</h4>
                      <span className="font-bold text-green-600">{formatCurrency(service.price || 0)}</span>
                    </div>
                    {service.details && (
                      <p className="text-sm text-gray-600 mb-2">{service.details}</p>
                    )}
                    {technician && (
                      <p className="text-sm text-blue-600">
                        <span className="font-medium">Técnico:</span> {technician.name}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Payment Option Details */}
          {getPaymentOptionDetails()}

          {/* Values */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-medium text-gray-900 mb-3">Valores e Pagamento</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><span className="font-medium">Valor Total:</span> {formatCurrency(order.totalValue || 0)}</p>
                <p><span className="font-medium">Valor de Entrada:</span> {formatCurrency(order.entryValue || 0)}</p>
                <p><span className="font-medium">Forma Pag. Entrada:</span> {order.paymentMethodEntry || 'Não informado'}</p>
              </div>
              <div>
                <p className={(order.remainingValue || 0) > 0 ? 'text-red-600 font-medium' : 'text-green-600'}>
                  <span className="font-medium">Valor Restante:</span> {formatCurrency(order.remainingValue || 0)}
                </p>
                {(order.remainingValue || 0) > 0 && order.paymentMethodRemaining && (
                  <p><span className="font-medium">Forma Pag. Restante:</span> {order.paymentMethodRemaining}</p>
                )}
                {order.paymentOption === 'installment' && (
                  <p><span className="font-medium">Parcelamento:</span> {order.installments}x de {formatCurrency((order.remainingValue || 0) / (order.installments || 1))}</p>
                )}
              </div>
            </div>

            {/* Payment Actions */}
            {(order.remainingValue || 0) > 0 && (
              <div className="mt-4 flex gap-2">
                <button
                  onClick={() => openPaymentModal(order, false)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <DollarSign className="w-4 h-4" />
                  Pagamento Parcial
                </button>
                <button
                  onClick={() => openPaymentModal(order, true)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  Quitar Total
                </button>
                <button
                  onClick={() => openWhatsAppModal(order)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-green-600 bg-green-50 rounded-lg hover:bg-green-100 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Cobrar por WhatsApp
                </button>
              </div>
            )}
          </div>

          {/* Payment History */}
          <div className="mt-4">
            <h3 className="font-medium text-gray-900 mb-3">Histórico de Pagamentos</h3>
            {(order.payments || []).length > 0 ? (
              <div className="space-y-2">
                {order.payments.map((payment: Payment, index: number) => (
                  <div key={index} className="bg-white p-3 rounded-lg border flex justify-between items-center">
                    <div>
                      <p className="font-medium">{payment.type === 'quitação' ? 'Quitação' : 'Pagamento Parcial'}</p>
                      <p className="text-sm text-gray-600">
                        {new Date(payment.date).toLocaleDateString()} - {payment.method}
                      </p>
                    </div>
                    <span className="font-bold text-green-600">{formatCurrency(payment.value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-sm">Nenhum pagamento registrado</p>
            )}
          </div>

          {/* Observations */}
          {order.observations && (
            <div>
              <h3 className="font-medium text-gray-900 mb-2">Observações</h3>
              <p className="text-sm text-gray-700 bg-gray-50 p-3 rounded-lg">{order.observations}</p>
            </div>
          )}
        </div>

        <div className="p-6 border-t flex justify-end space-x-3 sticky bottom-0 bg-white">
          <button
            onClick={() => setShowModal(false)}
            className="px-4 py-2 text-gray-700 border rounded-lg hover:bg-gray-50 transition-colors"
          >
            Fechar
          </button>
          <button
            onClick={() => {
              setShowModal(false);
              setTimeout(() => {
                setModalType('order');
                setFormData(order);
                setShowModal(true);
              }, 100);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Edit className="w-4 h-4" />
            <span>Editar</span>
          </button>
        </div>

        {showWhatsApp && (
          <WhatsAppSender
            order={order}
            onClose={() => setShowWhatsApp(false)}
            phone={client?.phone}
          />
        )}

        {showPayment && (
          <PaymentModal />
        )}
      </div>
    </div>
  );
};

export default OrderViewModal;