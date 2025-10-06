// Table cell component with inline editing

import React, { useState, useEffect, useRef } from 'react';
import { Column } from './DataTable';

interface TableCellProps<T = any> {
  row: T;
  column: Column<T>;
  index: number;
  isEditing: boolean;
  editable: boolean;
  onEdit: (newValue: any) => void;
  onStartEdit: () => void;
  onCancelEdit: () => void;
}

export const TableCell = <T extends Record<string, any>>({
  row,
  column,
  index,
  isEditing,
  editable,
  onEdit,
  onStartEdit,
  onCancelEdit
}: TableCellProps<T>) => {
  const [editValue, setEditValue] = useState<any>('');
  const inputRef = useRef<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>(null);
  
  const cellValue = row[column.key];

  useEffect(() => {
    if (isEditing) {
      setEditValue(cellValue);
      // Focus input when editing starts
      setTimeout(() => {
        if (inputRef.current) {
          inputRef.current.focus();
          if (inputRef.current instanceof HTMLInputElement || inputRef.current instanceof HTMLTextAreaElement) {
            inputRef.current.select();
          }
        }
      }, 0);
    }
  }, [isEditing, cellValue]);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSave();
    } else if (event.key === 'Escape') {
      handleCancel();
    }
  };

  const handleSave = () => {
    onEdit(editValue);
  };

  const handleCancel = () => {
    setEditValue(cellValue);
    onCancelEdit();
  };

  const renderEditingCell = () => {
    const commonProps = {
      ref: inputRef as any,
      value: editValue || '',
      onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => 
        setEditValue(e.target.value),
      onKeyDown: handleKeyDown,
      onBlur: handleSave,
      className: 'w-full px-2 py-1 border border-blue-500 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500'
    };

    switch (column.type) {
      case 'select':
        return (
          <select {...commonProps}>
            {column.selectOptions?.map(option => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );
      
      case 'number':
        return (
          <input
            {...commonProps}
            type="number"
          />
        );
      
      case 'date':
        return (
          <input
            {...commonProps}
            type="date"
          />
        );
      
      case 'boolean':
        return (
          <select {...commonProps}>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        );
      
      default:
        return (
          <input
            {...commonProps}
            type="text"
          />
        );
    }
  };

  const renderDisplayCell = () => {
    if (column.render) {
      return column.render(cellValue, row, index);
    }

    // Handle different data types for display
    switch (column.type) {
      case 'boolean':
        return (
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
            cellValue ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
          }`}>
            {cellValue ? 'Yes' : 'No'}
          </span>
        );
      
      case 'date':
        if (cellValue) {
          try {
            return new Date(cellValue).toLocaleDateString();
          } catch {
            return cellValue;
          }
        }
        return '';
      
      case 'select':
        const option = column.selectOptions?.find(opt => opt.value === cellValue);
        return option ? option.label : cellValue;
      
      default:
        return cellValue != null ? String(cellValue) : '';
    }
  };

  return (
    <td className="px-4 py-3 text-sm text-gray-900">
      {isEditing ? (
        <div className="relative">
          {renderEditingCell()}
          <div className="absolute -top-1 -right-1 flex space-x-1">
            <button
              onClick={handleSave}
              className="w-4 h-4 bg-green-600 text-white rounded-full flex items-center justify-center hover:bg-green-700"
              title="Save"
            >
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            <button
              onClick={handleCancel}
              className="w-4 h-4 bg-red-600 text-white rounded-full flex items-center justify-center hover:bg-red-700"
              title="Cancel"
            >
              <svg className="w-2 h-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      ) : (
        <div
          className={editable ? 'cursor-pointer hover:bg-gray-100 rounded px-2 py-1 -mx-2 -my-1' : ''}
          onClick={editable ? onStartEdit : undefined}
          title={editable ? 'Click to edit' : undefined}
        >
          {renderDisplayCell()}
        </div>
      )}
    </td>
  );
};