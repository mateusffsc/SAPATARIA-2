// Input formatting utilities for mobile-friendly forms
export const formatCPF = (value: string): string => {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, '');
  
  // Apply CPF mask: 000.000.000-00
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d{1,2})/, '$1-$2');
  }
  
  return numbers.slice(0, 11)
    .replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
};

export const formatPhone = (value: string): string => {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, '');
  
  // Apply phone mask: (00) 00000-0000
  if (numbers.length <= 11) {
    return numbers
      .replace(/(\d{2})(\d)/, '($1) $2')
      .replace(/(\d{5})(\d)/, '$1-$2');
  }
  
  return numbers.slice(0, 11)
    .replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
};

export const formatZipCode = (value: string): string => {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, '');
  
  // Apply ZIP code mask: 00000-000
  if (numbers.length <= 8) {
    return numbers.replace(/(\d{5})(\d)/, '$1-$2');
  }
  
  return numbers.slice(0, 8).replace(/(\d{5})(\d{3})/, '$1-$2');
};

export const formatCNPJ = (value: string): string => {
  // Remove all non-digits
  const numbers = value.replace(/\D/g, '');
  
  // Apply CNPJ mask: 00.000.000/0000-00
  if (numbers.length <= 14) {
    return numbers
      .replace(/(\d{2})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1.$2')
      .replace(/(\d{3})(\d)/, '$1/$2')
      .replace(/(\d{4})(\d)/, '$1-$2');
  }
  
  return numbers.slice(0, 14)
    .replace(/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/, '$1.$2.$3/$4-$5');
};

// Remove formatting to get clean numbers
export const cleanNumericValue = (value: string): string => {
  return value.replace(/\D/g, '');
};

// Validate formatted inputs
const isValidCPF = (cpf: string): boolean => {
  const numbers = cleanNumericValue(cpf);
  return numbers.length === 11;
};

const isValidPhone = (phone: string): boolean => {
  const numbers = cleanNumericValue(phone);
  return numbers.length === 10 || numbers.length === 11;
};

const isValidZipCode = (zipCode: string): boolean => {
  const numbers = cleanNumericValue(zipCode);
  return numbers.length === 8;
};

const isValidCNPJ = (cnpj: string): boolean => {
  const numbers = cleanNumericValue(cnpj);
  return numbers.length === 14;
};