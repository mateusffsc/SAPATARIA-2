import { useState, useEffect, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';

interface AutocompleteOptions {
  minLength?: number;
  maxResults?: number;
  debounceMs?: number;
}

export const useAutocomplete = (
  field: 'article' | 'brand' | 'color' | 'model' | 'size' | 'neighborhood' | 'city',
  input: string,
  options: AutocompleteOptions = {}
) => {
  const { orders, clients } = useAppContext();
  const { minLength = 1, maxResults = 10, debounceMs = 300 } = options;
  
  const [debouncedInput, setDebouncedInput] = useState(input);
  
  // Debounce input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedInput(input);
    }, debounceMs);
    
    return () => clearTimeout(timer);
  }, [input, debounceMs]);
  
  const suggestions = useMemo(() => {
    if (debouncedInput.length < minLength) return [];
    
    let data: string[] = [];
    
    switch (field) {
      case 'article':
        data = orders.map(o => o.article).filter(Boolean);
        break;
      case 'brand':
        data = orders.map(o => o.brand).filter(Boolean);
        break;
      case 'color':
        data = [
          'Preto', 'Branco', 'Marrom', 'Bege', 'Azul', 'Vermelho', 
          'Verde', 'Amarelo', 'Rosa', 'Roxo', 'Cinza', 'Dourado', 'Prata'
        ];
        const orderColors = orders.map(o => o.color).filter(Boolean);
        data = [...new Set([...data, ...orderColors])];
        break;
      case 'model':
        data = orders.map(o => o.model).filter(Boolean);
        break;
      case 'size':
        data = orders.map(o => o.size).filter(Boolean);
        break;
      case 'neighborhood':
        data = clients.map(c => c.neighborhood).filter(Boolean);
        break;
      case 'city':
        data = clients.map(c => c.city).filter(Boolean);
        break;
    }
    
    // Filter and sort by relevance
    const filtered = [...new Set(data)]
      .filter(item => item.toLowerCase().includes(debouncedInput.toLowerCase()))
      .sort((a, b) => {
        const aIndex = a.toLowerCase().indexOf(debouncedInput.toLowerCase());
        const bIndex = b.toLowerCase().indexOf(debouncedInput.toLowerCase());
        if (aIndex !== bIndex) return aIndex - bIndex;
        return a.localeCompare(b);
      })
      .slice(0, maxResults);
    
    return filtered;
  }, [debouncedInput, field, orders, clients, minLength, maxResults]);
  
  return suggestions;
};

// Hook for contextual suggestions based on selected values
export const useContextualSuggestions = (selectedBrand: string, selectedArticle: string) => {
  const { orders } = useAppContext();
  
  const modelSuggestions = useMemo(() => {
    if (!selectedBrand) return [];
    
    return [...new Set(
      orders
        .filter(o => o.brand.toLowerCase() === selectedBrand.toLowerCase())
        .map(o => o.model)
        .filter(Boolean)
    )].slice(0, 10);
  }, [selectedBrand, orders]);
  
  const sizeSuggestions = useMemo(() => {
    if (!selectedArticle) return [];
    
    return [...new Set(
      orders
        .filter(o => o.article.toLowerCase() === selectedArticle.toLowerCase())
        .map(o => o.size)
        .filter(Boolean)
    )].slice(0, 10);
  }, [selectedArticle, orders]);
  
  return { modelSuggestions, sizeSuggestions };
};