// Custom hook for form state management

import { useReducer, useCallback } from 'react';
import { FormErrors, ValidationRule } from '../types';
import { validateField, validateForm } from '../utils/validation';

interface FormState<T> {
  values: T;
  errors: FormErrors;
  isSubmitting: boolean;
  touched: Record<keyof T, boolean>;
}

type FormAction<T> = 
  | { type: 'SET_FIELD'; payload: { name: keyof T; value: any } }
  | { type: 'SET_ERROR'; payload: { name: keyof T; error: string } }
  | { type: 'SET_ERRORS'; payload: FormErrors }
  | { type: 'SET_SUBMITTING'; payload: boolean }
  | { type: 'SET_TOUCHED'; payload: { name: keyof T; touched: boolean } }
  | { type: 'RESET'; payload: T };

function formReducer<T>(state: FormState<T>, action: FormAction<T>): FormState<T> {
  switch (action.type) {
    case 'SET_FIELD':
      return {
        ...state,
        values: { ...state.values, [action.payload.name]: action.payload.value },
        errors: { ...state.errors, [action.payload.name as string]: '' }
      };
    case 'SET_ERROR':
      return {
        ...state,
        errors: { ...state.errors, [action.payload.name as string]: action.payload.error }
      };
    case 'SET_ERRORS':
      return { ...state, errors: action.payload };
    case 'SET_SUBMITTING':
      return { ...state, isSubmitting: action.payload };
    case 'SET_TOUCHED':
      return {
        ...state,
        touched: { ...state.touched, [action.payload.name]: action.payload.touched }
      };
    case 'RESET':
      return {
        values: action.payload,
        errors: {},
        isSubmitting: false,
        touched: {} as Record<keyof T, boolean>
      };
    default:
      return state;
  }
}

interface UseFormStateOptions<T> {
  initialValues: T;
  validationRules?: Record<keyof T, ValidationRule>;
  onSubmit?: (values: T) => Promise<void> | void;
}

export function useFormState<T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit
}: UseFormStateOptions<T>) {
  const [state, dispatch] = useReducer(formReducer<T>, {
    values: initialValues,
    errors: {},
    isSubmitting: false,
    touched: {} as Record<keyof T, boolean>
  });

  const setField = useCallback((name: keyof T, value: any) => {
    dispatch({ type: 'SET_FIELD', payload: { name, value } });
    
    // Validate field if rules exist and field is touched
    if (validationRules && validationRules[name] && state.touched[name]) {
      const error = validateField(value, validationRules[name]);
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: { name, error } });
      }
    }
  }, [validationRules, state.touched]);

  const setTouched = useCallback((name: keyof T) => {
    dispatch({ type: 'SET_TOUCHED', payload: { name, touched: true } });
    
    // Validate field when touched
    if (validationRules && validationRules[name]) {
      const error = validateField(state.values[name], validationRules[name]);
      if (error) {
        dispatch({ type: 'SET_ERROR', payload: { name, error } });
      }
    }
  }, [validationRules, state.values]);

  const validate = useCallback((): boolean => {
    if (!validationRules) return true;
    
    const errors = validateForm(state.values, validationRules);
    dispatch({ type: 'SET_ERRORS', payload: errors });
    
    return Object.keys(errors).length === 0;
  }, [state.values, validationRules]);

  const handleSubmit = useCallback(async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }

    if (!validate()) {
      return;
    }

    if (!onSubmit) {
      return;
    }

    dispatch({ type: 'SET_SUBMITTING', payload: true });
    
    try {
      await onSubmit(state.values);
    } catch (error) {
      console.error('Form submission error:', error);
    } finally {
      dispatch({ type: 'SET_SUBMITTING', payload: false });
    }
  }, [validate, onSubmit, state.values]);

  const reset = useCallback((newValues?: T) => {
    dispatch({ type: 'RESET', payload: newValues || initialValues });
  }, [initialValues]);

  const hasErrors = Object.values(state.errors).some(error => error);

  return {
    values: state.values,
    errors: state.errors,
    isSubmitting: state.isSubmitting,
    touched: state.touched,
    hasErrors,
    setField,
    setTouched,
    validate,
    handleSubmit,
    reset
  };
}