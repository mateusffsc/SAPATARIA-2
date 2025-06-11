import React, { useState, useRef, useEffect } from 'react';
import { formatCPF, formatPhone, formatZipCode, formatCNPJ, cleanNumericValue } from '../../utils/inputFormatters';

interface FormInputProps {
  type?: 'text' | 'email' | 'tel' | 'cpf' | 'phone' | 'zipcode' | 'cnpj' | 'number' | 'password';
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
  autoComplete?: string;
  suggestions?: string[];
  onSuggestionSelect?: (suggestion: string) => void;
  min?: string | number;
  max?: string | number;
  step?: string | number;
}

const FormInput: React.FC<FormInputProps> = ({
  type = 'text',
  label,
  value,
  onChange,
  placeholder,
  required = false,
  error,
  className = '',
  disabled = false,
  autoComplete,
  suggestions = [],
  onSuggestionSelect,
  min,
  max,
  step
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Filter suggestions based on input value
  useEffect(() => {
    if (suggestions.length > 0 && value) {
      const filtered = suggestions.filter(suggestion =>
        suggestion.toLowerCase().includes(value.toLowerCase())
      ).slice(0, 10);
      setFilteredSuggestions(filtered);
    } else {
      setFilteredSuggestions([]);
    }
  }, [value, suggestions]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let inputValue = e.target.value;

    // Apply formatting based on type
    switch (type) {
      case 'cpf':
        inputValue = formatCPF(inputValue);
        break;
      case 'phone':
        inputValue = formatPhone(inputValue);
        break;
      case 'zipcode':
        inputValue = formatZipCode(inputValue);
        break;
      case 'cnpj':
        inputValue = formatCNPJ(inputValue);
        break;
      default:
        break;
    }

    onChange(inputValue);
  };

  const handleFocus = () => {
    if (filteredSuggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setShowSuggestions(false);
      }
    }, 150);
  };

  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    onSuggestionSelect?.(suggestion);
    inputRef.current?.focus();
  };

  const getInputType = () => {
    switch (type) {
      case 'cpf':
      case 'phone':
      case 'zipcode':
      case 'cnpj':
        return 'tel'; // Use tel for numeric inputs on mobile
      case 'number':
        return 'number';
      case 'password':
        return 'password';
      default:
        return type;
    }
  };

  const getInputMode = () => {
    switch (type) {
      case 'cpf':
      case 'phone':
      case 'zipcode':
      case 'cnpj':
      case 'number':
        return 'numeric';
      case 'email':
        return 'email';
      default:
        return 'text';
    }
  };

  return (
    <div className={`relative ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type={getInputType()}
          inputMode={getInputMode()}
          className={`
            w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-base min-h-[44px] transition-colors
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          value={value}
          onChange={handleInputChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          autoComplete={autoComplete}
          min={min}
          max={max}
          step={step}
        />

        {/* Suggestions Dropdown */}
        {showSuggestions && filteredSuggestions.length > 0 && (
          <div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto"
          >
            {filteredSuggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full text-left px-4 py-3 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none min-h-[44px] transition-colors"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <span className="block truncate">{suggestion}</span>
              </button>
            ))}
          </div>
        )}

        {/* Visual feedback for selection */}
        {suggestions.includes(value) && value && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <div className="w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </div>
        )}
      </div>

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default FormInput;