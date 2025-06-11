import React, { useState, useRef, useEffect } from 'react';
import { Search, Clock, X } from 'lucide-react';
import { useAutocomplete } from '../../hooks/useAutocomplete';

interface AutocompleteInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  field: 'article' | 'brand' | 'color' | 'model' | 'size' | 'neighborhood' | 'city';
  placeholder?: string;
  required?: boolean;
  error?: string;
  className?: string;
  disabled?: boolean;
}

const AutocompleteInput: React.FC<AutocompleteInputProps> = ({
  label,
  value,
  onChange,
  field,
  placeholder,
  required = false,
  error,
  className = '',
  disabled = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const suggestions = useAutocomplete(field, value);
  
  // Load search history from localStorage
  useEffect(() => {
    const history = localStorage.getItem(`search_history_${field}`);
    if (history) {
      setSearchHistory(JSON.parse(history));
    }
  }, [field]);
  
  // Save to search history
  const saveToHistory = (searchValue: string) => {
    if (!searchValue.trim()) return;
    
    const newHistory = [searchValue, ...searchHistory.filter(h => h !== searchValue)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem(`search_history_${field}`, JSON.stringify(newHistory));
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
  };
  
  const handleSuggestionSelect = (suggestion: string) => {
    onChange(suggestion);
    saveToHistory(suggestion);
    setIsOpen(false);
    inputRef.current?.focus();
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && value.trim()) {
      saveToHistory(value);
      setIsOpen(false);
    }
  };
  
  const clearInput = () => {
    onChange('');
    inputRef.current?.focus();
  };
  
  const showDropdown = isOpen && (suggestions.length > 0 || searchHistory.length > 0);
  
  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          className={`
            w-full px-4 py-3 pr-20 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            text-base min-h-[44px] transition-colors
            ${error ? 'border-red-500 focus:ring-red-500 focus:border-red-500' : 'border-gray-300'}
            ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
          `}
          value={value}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
        />
        
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-1">
          {value && (
            <button
              type="button"
              onClick={clearInput}
              className="p-1 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <Search className="w-4 h-4 text-gray-400" />
        </div>
        
        {/* Suggestions Dropdown */}
        {showDropdown && (
          <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
            {/* Recent searches */}
            {searchHistory.length > 0 && !value && (
              <div className="p-2 border-b border-gray-100">
                <div className="flex items-center text-xs text-gray-500 mb-2">
                  <Clock className="w-3 h-3 mr-1" />
                  Pesquisas recentes
                </div>
                {searchHistory.map((item, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 focus:bg-gray-50 focus:outline-none text-sm transition-colors"
                    onClick={() => handleSuggestionSelect(item)}
                  >
                    {item}
                  </button>
                ))}
              </div>
            )}
            
            {/* Suggestions */}
            {suggestions.length > 0 && (
              <div className="p-2">
                {!value && suggestions.length > 0 && (
                  <div className="text-xs text-gray-500 mb-2">Sugestões</div>
                )}
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    className="w-full text-left px-3 py-2 hover:bg-blue-50 focus:bg-blue-50 focus:outline-none transition-colors"
                    onClick={() => handleSuggestionSelect(suggestion)}
                  >
                    <span className="font-medium">
                      {suggestion.substring(0, suggestion.toLowerCase().indexOf(value.toLowerCase()))}
                      <mark className="bg-yellow-200">
                        {suggestion.substring(
                          suggestion.toLowerCase().indexOf(value.toLowerCase()),
                          suggestion.toLowerCase().indexOf(value.toLowerCase()) + value.length
                        )}
                      </mark>
                      {suggestion.substring(suggestion.toLowerCase().indexOf(value.toLowerCase()) + value.length)}
                    </span>
                  </button>
                ))}
              </div>
            )}
            
            {suggestions.length === 0 && searchHistory.length === 0 && (
              <div className="p-4 text-center text-gray-500 text-sm">
                Nenhuma sugestão encontrada
              </div>
            )}
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-red-500 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default AutocompleteInput;