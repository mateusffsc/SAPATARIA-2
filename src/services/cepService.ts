export interface AddressData {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  erro?: boolean;
}

export class CEPService {
  static async fetchAddressByCEP(cep: string): Promise<AddressData | null> {
    try {
      // Remove formatting from CEP
      const cleanCEP = cep.replace(/\D/g, '');
      
      if (cleanCEP.length !== 8) {
        throw new Error('CEP deve ter 8 dígitos');
      }

      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      
      if (!response.ok) {
        throw new Error('Erro ao consultar CEP');
      }

      const data = await response.json();
      
      if (data.erro) {
        throw new Error('CEP não encontrado');
      }

      return data;
    } catch (error) {
      console.error('Error fetching CEP:', error);
      return null;
    }
  }

  static formatCEP(cep: string): string {
    const numbers = cep.replace(/\D/g, '');
    return numbers.replace(/(\d{5})(\d{3})/, '$1-$2');
  }

  static isValidCEP(cep: string): boolean {
    const cleanCEP = cep.replace(/\D/g, '');
    return cleanCEP.length === 8;
  }
}