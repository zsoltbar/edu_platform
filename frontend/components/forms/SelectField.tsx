// Reusable select field component

import React from 'react';
import { SelectOption } from '../../types';

interface SelectFieldProps {
  label: string;
  name: string;
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  required?: boolean;
  error?: string;
  disabled?: boolean;
  className?: string;
  placeholder?: string;
}

export const SelectField: React.FC<SelectFieldProps> = ({
  label,
  name,
  value,
  onChange,
  onBlur,
  options,
  required = false,
  error,
  disabled = false,
  className = '',
  placeholder
}) => {
  const baseClasses = `w-full p-3 border rounded-lg focus:outline-none focus:ring-2 transition duration-200 ${
    error 
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500' 
      : 'border-gray-300 focus:ring-blue-500 focus:border-transparent'
  } ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`;

  const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onChange(e.target.value);
  };

  return (
    <div className={`flex flex-col ${className}`}>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <select
        name={name}
        value={value}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        className={baseClasses}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      
      {error && (
        <span className="text-red-500 text-sm mt-1">{error}</span>
      )}
    </div>
  );
};