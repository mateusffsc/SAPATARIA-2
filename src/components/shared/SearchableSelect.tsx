import React, { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Check } from 'lucide-react';

interface Option {
  value: string | number;
  label: string;
  subtitle?: string;
}

interface SearchableSelectProps {
  options: Option[];
  value: string | number;
  onChange: (value: string | number) => void;
  placeholder?: string;
  label?: string;
  required?: boolean;
  error?: string;
  disabled?: boolean;
  noResultsText?: string;
  className?: string;
}

const SearchableSelect: React.FC<SearchableSelectProps> = ({
  options,
  value,
  onChange,
  placeholder = 'Selecione uma opção',
  label,
  required = false,
  error,
  disabled = false,
  noResultsText = 'Nenhum resultado encontrado',
  className = ''
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredOptions, setFilteredOptions] = useState<Option[]>(options);
  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedOption = options.find(option => option.value === value);

  // Filter options based on search term
  useEffect(() => {
    if (searchTerm) {
      const filtered = options.filter(option =>
        option.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
        option.subtitle?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  }, [searchTerm, options]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
      setSearchTerm('');
    }
  };

  const handleOptionSelect = (option: Option) => {
    onChange(option.value);
    setIsOpen(false);
    setSearchTerm('');
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}

      {/* Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        className={`
          w-full px-4 py-3 text-left bg-white border rounded-lg
          min-h-[44px] flex items-center justify-between
          transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500
          ${error ? 'border-red-500' : 'border-gray-300'}
          ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'}
          ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
        `}
      >
        <span className={selectedOption ? 'text-gray-900' : 'text-gray-500'}>
          {selectedOption ? selectedOption.label : placeholder}
        </span>
        <ChevronDown 
          className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                ref={searchInputRef}
                type="text"
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length > 0 ? (
              filteredOptions.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => handleOptionSelect(option)}
                  className={`
                    w-full px-4 py-3 text-left hover:bg-blue-50 focus:bg-blue-50 
                    focus:outline-none min-h-[44px] flex items-center justify-between
                    transition-colors
                    ${option.value === value ? 'bg-blue-50 text-blue-600' : 'text-gray-900'}
                  `}
                >
                  <div className="flex-1 min-w-0">
                    <div className="font-medium truncate">{option.label}</div>
                    {option.subtitle && (
                      <div className="text-sm text-gray-500 truncate">{option.subtitle}</div>
                    )}
                  </div>
                  {option.value === value && (
                    <Check className="w-4 h-4 text-blue-600 flex-shrink-0 ml-2" />
                  )}
                </button>
              ))
            ) : (
              <div className="px-4 py-8 text-center text-gray-500">
                {noResultsText}
              </div>
            )}
          </div>
        </div>
      )}

      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default SearchableSelect;