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

const formatCPF = (cpf: string): string => {
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

const formatPhone = (phone: string): string => {
  const numbers = phone.replace(/\D/g, '');
  
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  
  return numbers.slice(0, 11)
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

const formatDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleDateString('pt-BR');
};

export const formatRelativeDate = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffInMs = now.getTime() - dateObj.getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  
  if (diffInDays === 0) return 'Hoje';
  if (diffInDays === 1) return 'Ontem';
  if (diffInDays === -1) return 'Amanhã';
  if (diffInDays > 0) return `Há ${diffInDays} dias`;
  return `Em ${Math.abs(diffInDays)} dias`;
};

const formatDateTime = (date: string | Date): string => {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  return dateObj.toLocaleString('pt-BR');
};

export const highlightSearchTerm = (text: string, searchTerm: string): string => {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark class="bg-yellow-200">$1</mark>');
};