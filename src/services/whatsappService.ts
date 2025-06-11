import { Order } from '../types';

export const formatWhatsAppMessage = (order: Order): string => {
  const formatCurrency = (value: number) => value.toFixed(2);
  
  return `
🔧 *Sapataria Guimarães*

Olá! Aqui está o status da sua ordem de serviço:

📋 *OS:* ${order.number || ''}
👟 *Artigo:* ${(order.article || '')} ${(order.color || '')} ${(order.size || '')}
🏷️ *Marca:* ${(order.brand || '')}

*Serviços:*
${(order.services || []).map(service => `- ${(service.name || '')}: R$ ${formatCurrency(service.price || 0)}`).join('\n')}

💰 *Valor Total:* R$ ${formatCurrency(order.totalValue || 0)}
${(order.remainingValue || 0) > 0 ? `💳 *Valor Pendente:* R$ ${formatCurrency(order.remainingValue)}` : '✅ *Pagamento:* Quitado'}
📅 *Entrega:* ${new Date(order.deliveryDate).toLocaleDateString()}

*Status:* ${(order.status || '').toUpperCase()}

Agradecemos a preferência! 😊
`.trim();
};

export const sendToWhatsApp = (phone: string, message: string): void => {
  const formattedPhone = (phone || '').replace(/\D/g, '');
  const encodedMessage = encodeURIComponent(message);
  window.open(`https://wa.me/55${formattedPhone}?text=${encodedMessage}`, '_blank');
};