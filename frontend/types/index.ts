// Centralized type definitions for better type safety

export interface User {
  id: number;
  name: string;
  email: string; // Can be email address or login name
  role: UserRole;
}

export interface Task {
  id: number;
  title: string;
  description: string;
  subject: Subject;
  class_grade: Grade;
  difficulty: Difficulty;
}

export interface Result {
  id: number;
  user_id: number;
  task_id: number;
  score: number;
  timestamp: string;
}

// Enum-like types
export type UserRole = 'admin' | 'teacher' | 'student';
export type Subject = 'Magyar' | 'Matematika' | 'Történelem';
export type Grade = 4 | 6 | 8;
export type Difficulty = 'Könnyű' | 'Közepes' | 'Nehéz';

// Form state interfaces
export interface TaskFormData {
  title: string;
  description: string;
  subject: Subject;
  class_grade: Grade;
  difficulty: Difficulty;
}

export interface UserFormData {
  name: string;
  email: string;
  password?: string;
  role: UserRole;
}

// API response types
export interface ApiResponse<T> {
  data: T;
  message?: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}

// Form validation types
export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => string | null;
}

export interface FormErrors {
  [key: string]: string;
}

// Select option type
export interface SelectOption {
  value: string | number;
  label: string;
}