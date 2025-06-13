// utils/dateUtils.ts

/**
 * Converte uma data (string ou Date) para o horário de São Paulo (UTC-3)
 */
export const toSaoPauloDate = (input: string | Date): Date => {
  const dateObj = typeof input === 'string' ? new Date(input) : input;
  const utc = dateObj.getTime() + (dateObj.getTimezoneOffset() * 60000);
  return new Date(utc + (-3 * 60 * 60000));
};

/**
 * Retorna a data atual em São Paulo como YYYY-MM-DD
 */
export const getCurrentSaoPauloDateString = (): string => {
  const spDate = toSaoPauloDate(new Date());
  const year = spDate.getFullYear();
  const month = String(spDate.getMonth() + 1).padStart(2, '0');
  const day = String(spDate.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Retorna um Date representando o início do dia (00:00:00) em São Paulo
 */
export const getSaoPauloStartOfDay = (input: string | Date): Date => {
  const date = toSaoPauloDate(input);
  date.setHours(0, 0, 0, 0);
  return date;
};

/**
 * Retorna um Date representando o final do dia (23:59:59.999) em São Paulo
 */
export const getSaoPauloEndOfDay = (input: string | Date): Date => {
  const date = toSaoPauloDate(input);
  date.setHours(23, 59, 59, 999);
  return date;
};

/**
 * Formata uma data em São Paulo como DD/MM/YYYY
 */
export const formatSaoPauloDate = (input: string | Date): string => {
  const spDate = toSaoPauloDate(input);
  return spDate.toLocaleDateString('pt-BR', { 
    timeZone: 'America/Sao_Paulo',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};