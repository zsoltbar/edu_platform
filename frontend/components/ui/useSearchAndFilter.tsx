// Search and filter hooks for data management

import { useState, useEffect, useMemo, useCallback } from 'react';

// Debounced value hook
export const useDebounce = (value: any, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Search hook with debouncing
export interface UseSearchOptions {
  debounceMs?: number;
  minSearchLength?: number;
  caseSensitive?: boolean;
}

export interface UseSearchReturn {
  searchTerm: string;
  debouncedSearchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
}

export const useSearch = (options: UseSearchOptions = {}): UseSearchReturn => {
  const {
    debounceMs = 300,
    minSearchLength = 0
  } = options;

  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, debounceMs);

  const clearSearch = useCallback(() => {
    setSearchTerm('');
  }, []);

  const isSearching = searchTerm !== debouncedSearchTerm;

  return {
    searchTerm,
    debouncedSearchTerm: debouncedSearchTerm.length >= minSearchLength ? debouncedSearchTerm : '',
    setSearchTerm,
    clearSearch,
    isSearching
  };
};

// Filter hook for complex filtering logic
export interface FilterOption {
  key: string;
  label: string;
  type: 'text' | 'select' | 'boolean' | 'date' | 'number' | 'multiselect';
  options?: Array<{ value: any; label: string }>;
}

export interface FilterState {
  [key: string]: any;
}

export interface UseFilterReturn {
  filters: FilterState;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
}

export const useFilter = (initialFilters: FilterState = {}): UseFilterReturn => {
  const [filters, setFilters] = useState<FilterState>(initialFilters);

  const setFilter = useCallback((key: string, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }));
  }, []);

  const clearFilter = useCallback((key: string) => {
    setFilters(prev => {
      const newFilters = { ...prev };
      delete newFilters[key];
      return newFilters;
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    setFilters({});
  }, []);

  const activeFiltersCount = Object.values(filters).filter(value => {
    if (Array.isArray(value)) return value.length > 0;
    return value !== undefined && value !== null && value !== '';
  }).length;

  const hasActiveFilters = activeFiltersCount > 0;

  return {
    filters,
    setFilter,
    clearFilter,
    clearAllFilters,
    activeFiltersCount,
    hasActiveFilters
  };
};

// Combined search and filter hook
export interface UseSearchAndFilterOptions {
  data: any[];
  searchFields?: string[];
  searchOptions?: UseSearchOptions;
  filterOptions?: FilterOption[];
}

export interface UseSearchAndFilterReturn {
  // Search
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  clearSearch: () => void;
  isSearching: boolean;
  
  // Filter
  filters: FilterState;
  setFilter: (key: string, value: any) => void;
  clearFilter: (key: string) => void;
  clearAllFilters: () => void;
  activeFiltersCount: number;
  hasActiveFilters: boolean;
  
  // Results
  filteredData: any[];
  resultCount: number;
}

export const useSearchAndFilter = ({
  data,
  searchFields = [],
  searchOptions = {},
  filterOptions = []
}: UseSearchAndFilterOptions): UseSearchAndFilterReturn => {
  const search = useSearch(searchOptions);
  const filter = useFilter();

  // Apply search and filters to data
  const filteredData = useMemo(() => {
    let result = [...data];

    // Apply search
    if (search.debouncedSearchTerm) {
      const searchTerm = searchOptions.caseSensitive 
        ? search.debouncedSearchTerm 
        : search.debouncedSearchTerm.toLowerCase();

      result = result.filter(item => {
        return searchFields.some(field => {
          const fieldValue = item[field];
          if (fieldValue == null) return false;
          
          const stringValue = searchOptions.caseSensitive 
            ? String(fieldValue) 
            : String(fieldValue).toLowerCase();
          
          return stringValue.includes(searchTerm);
        });
      });
    }

    // Apply filters
    result = result.filter(item => {
      return Object.entries(filter.filters).every(([filterKey, filterValue]) => {
        if (!filterValue && filterValue !== false && filterValue !== 0) return true;
        
        const itemValue = item[filterKey];
        const filterOption = filterOptions.find(opt => opt.key === filterKey);
        
        if (!filterOption) return true;
        
        switch (filterOption.type) {
          case 'text':
            return String(itemValue).toLowerCase().includes(String(filterValue).toLowerCase());
          
          case 'select':
            return itemValue === filterValue;
          
          case 'multiselect':
            if (Array.isArray(filterValue)) {
              return filterValue.length === 0 || filterValue.includes(itemValue);
            }
            return true;
          
          case 'boolean':
            return itemValue === filterValue;
          
          case 'number':
            return Number(itemValue) === Number(filterValue);
          
          case 'date':
            // Simple date comparison - you might want to enhance this
            const itemDate = new Date(itemValue).toDateString();
            const filterDate = new Date(filterValue).toDateString();
            return itemDate === filterDate;
          
          default:
            return true;
        }
      });
    });

    return result;
  }, [data, search.debouncedSearchTerm, filter.filters, searchFields, searchOptions.caseSensitive, filterOptions]);

  return {
    // Search
    searchTerm: search.searchTerm,
    setSearchTerm: search.setSearchTerm,
    clearSearch: search.clearSearch,
    isSearching: search.isSearching,
    
    // Filter
    filters: filter.filters,
    setFilter: filter.setFilter,
    clearFilter: filter.clearFilter,
    clearAllFilters: filter.clearAllFilters,
    activeFiltersCount: filter.activeFiltersCount,
    hasActiveFilters: filter.hasActiveFilters,
    
    // Results
    filteredData,
    resultCount: filteredData.length
  };
};

// Search input component
import React from 'react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  placeholder?: string;
  isSearching?: boolean;
  className?: string;
}

export const SearchInput: React.FC<SearchInputProps> = ({
  value,
  onChange,
  onClear,
  placeholder = 'Search...',
  isSearching = false,
  className = ''
}) => {
  return (
    <div className={`relative ${className}`}>
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
        <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="block w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
      />
      
      <div className="absolute inset-y-0 right-0 flex items-center">
        {isSearching && (
          <div className="pr-3">
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-blue-600"></div>
          </div>
        )}
        
        {value && (
          <button
            onClick={onClear}
            className="pr-3 text-gray-400 hover:text-gray-600"
            type="button"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};