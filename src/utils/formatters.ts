// Enhanced formatting utilities
export const formatCurrency = (value: number | string): string => {
  const numValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^\d.,]/g, '').replace(',', '.')) || 0 : 
    value;

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(numValue);
};

export const formatCPF = (cpf: string): string => {
  const numbers = cpf.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  
  return numbers.slice(0, 11)
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  
  return numbers.slice(0, 11)
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export const formatRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Ensure both dates are in the same timezone for comparison
  const dateStr = dateObj.toISOString().split('T')[0];
  const nowStr = now.toISOString().split('T')[0];
  
  const dateInBrazil = new Date(dateStr + 'T12:00:00-03:00');
  const nowInBrazil = new Date(nowStr + 'T12:00:00-03:00');
  
  const diffInMs = nowInBrazil.getTime() - dateInBrazil.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays === -1) return 'Amanhã';
  if (diffInDays > 0) return `Há ${diffInDays} dias`;
  return `Em ${Math.abs(diffInDays)} dias`;
};

export const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('pt-BR', { timeZone: 'America/Sao_Paulo' });
};

export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm || !text) return text || '';
  
  const regex = new RegExp(`(${searchTerm.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};

// Get current date in ISO format (YYYY-MM-DD) with Brazil timezone (UTC-3)
export const getCurrentDate = (): string => {
  const now = new Date();

  // Adjust to UTC and then apply Brazil offset (UTC-3)
  const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
  const saoPauloOffset = -3 * 60; // minutes
  const saoPauloTime = new Date(utc + (saoPauloOffset * 60000));

  const year = saoPauloTime.getFullYear();
  const month = String(saoPauloTime.getMonth() + 1).padStart(2, '0');
  const day = String(saoPauloTime.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const formatLocalDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};