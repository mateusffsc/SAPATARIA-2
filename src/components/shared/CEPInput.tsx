import React, { useState } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { CEPService, AddressData } from '../../services/cepService';
import FormInput from './FormInput';

interface CEPInputProps {
  value: string;
  onChange: (value: string) => void;
  onAddressFound?: (address: AddressData) => void;
  error?: string;
  disabled?: boolean;
  className?: string;
}

const CEPInput: React.FC<CEPInputProps> = ({
  value,
  onChange,
  onAddressFound,
  error,
  disabled = false,
  className = ''
}) => {
  const [loading, setLoading] = useState(false);
  const [addressError, setAddressError] = useState<string | null>(null);

  const handleCEPChange = async (newValue: string) => {
    onChange(newValue);
    setAddressError(null);

    // Auto-fetch address when CEP is complete
    const cleanCEP = newValue.replace(/\D/g, '');
    if (cleanCEP.length === 8) {
      setLoading(true);
      
      try {
        const address = await CEPService.fetchAddressByCEP(cleanCEP);
        
        if (address) {
          onAddressFound?.(address);
        } else {
          setAddressError('CEP não encontrado');
        }
      } catch (error) {
        setAddressError('Erro ao buscar CEP');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleManualSearch = async () => {
    if (!CEPService.isValidCEP(value)) {
      setAddressError('CEP inválido');
      return;
    }

    setLoading(true);
    setAddressError(null);

    try {
      const address = await CEPService.fetchAddressByCEP(value);
      
      if (address) {
        onAddressFound?.(address);
      } else {
        setAddressError('CEP não encontrado');
      }
    } catch (error) {
      setAddressError('Erro ao buscar CEP');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={className}>
      <div className="relative">
        <FormInput
          type="zipcode"
          label="CEP"
          value={value}
          onChange={handleCEPChange}
          error={error || addressError || undefined}
          disabled={disabled}
          placeholder="00000-000"
        />
        
        {/* Search button */}
        <button
          type="button"
          onClick={handleManualSearch}
          disabled={loading || disabled || !CEPService.isValidCEP(value)}
          className="absolute right-3 top-8 p-1 text-gray-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          title="Buscar endereço"
        >
          {loading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <MapPin className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Address preview */}
      {loading && (
        <div className="mt-2 p-2 bg-blue-50 rounded text-sm text-blue-700">
          Buscando endereço...
        </div>
      )}
    </div>
  );
};

export default CEPInput;