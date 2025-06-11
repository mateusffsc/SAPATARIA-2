export const formatCurrency = (value: number | string): string => {
  // Convert string input to number if needed
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

export const parseCurrency = (value: string): number => {
  // Remove currency symbol, spaces and convert comma to dot
  const cleanValue = value
    .replace(/[R$\s.]/g, '')
    .replace(',', '.');
  
  // Parse to float and ensure it's a valid number
  const parsed = parseFloat(cleanValue || '0');
  if (isNaN(parsed)) return 0;
  
  return parsed;
};

// Format input while typing
export const formatCurrencyInput = (value: string): string => {
  // Remove all non-digits
  let numbers = value.replace(/\D/g, '');
  
  // Handle empty or invalid input
  if (!numbers) return '0,00';
  
  // Convert to number and format
  const amount = parseInt(numbers, 10);
  
  // Format as Brazilian currency (divide by 100 and use comma)
  const decimal = (amount / 100).toFixed(2);
  return decimal.replace('.', ',');
};