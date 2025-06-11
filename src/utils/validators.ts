// Validation utilities for forms
export const validateCPF = (cpf: string): boolean => {
  // Remove formatting
  const cleanCPF = cpf.replace(/[^\d]/g, '');
  
  // Check length and repeated numbers
  if (cleanCPF.length !== 11 || /^(\d)\1+$/.test(cleanCPF)) {
    return false;
  }
  
  // CPF validation algorithm
  let sum = 0;
  let remainder;
  
  // Validate first check digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Validate second check digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
};

export const validatePhone = (phone: string): boolean => {
  const cleanPhone = phone.replace(/[^\d]/g, '');
  return cleanPhone.length >= 10 && cleanPhone.length <= 11;
};

export const validateEmail = (email: string): boolean => {
  if (!email) return true; // Email is optional
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validateName = (name: string): boolean => {
  return name.trim().length >= 2;
};

export const validateFutureDate = (date: string): boolean => {
  const inputDate = new Date(date);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return inputDate >= today;
};

export const validatePositiveNumber = (value: number): boolean => {
  return value > 0;
};

export const validateEntryValue = (entryValue: number, totalValue: number): boolean => {
  return entryValue >= 0 && entryValue <= totalValue;
};

// Error messages
export const ERROR_MESSAGES = {
  CPF_INVALID: 'CPF inválido. Verifique os números digitados.',
  CPF_DUPLICATE: 'Este CPF já está cadastrado.',
  PHONE_INVALID: 'Telefone deve ter pelo menos 10 dígitos.',
  EMAIL_INVALID: 'E-mail inválido.',
  NAME_REQUIRED: 'Nome deve ter pelo menos 2 caracteres.',
  FUTURE_DATE_REQUIRED: 'Data de entrega deve ser no futuro.',
  POSITIVE_VALUE_REQUIRED: 'Valor deve ser maior que zero.',
  ENTRY_VALUE_INVALID: 'Valor da entrada não pode ser maior que o valor total.',
  REQUIRED_FIELD: 'Este campo é obrigatório.'
};

// Success messages
export const SUCCESS_MESSAGES = {
  CLIENT_CREATED: 'Cliente cadastrado com sucesso!',
  CLIENT_UPDATED: 'Cliente atualizado com sucesso!',
  ORDER_CREATED: (orderNumber: string) => `Ordem de serviço ${orderNumber} criada com sucesso!`,
  ORDER_UPDATED: 'Ordem de serviço atualizada com sucesso!',
  DATA_SAVED: 'Dados salvos com sucesso!'
};