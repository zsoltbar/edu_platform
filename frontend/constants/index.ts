// Constants and configuration values

import { SelectOption, UserRole, Subject, Grade, Difficulty } from '../types';

export const TASK_OPTIONS = {
  subjects: [
    { value: 'Angol nyelv', label: 'Angol nyelv' },
    { value: 'Biológia', label: 'Biológia' },
    { value: 'Egyéb', label: 'Egyéb' },
    { value: 'Fizika', label: 'Fizika' },
    { value: 'Földrajz', label: 'Földrajz' },
    { value: 'Francia nyelv', label: 'Francia nyelv' },
    { value: 'Informatika', label: 'Informatika' },
    { value: 'Kémia', label: 'Kémia' },
    { value: 'Magyar irodalom', label: 'Magyar irodalom' },
    { value: 'Magyar nyelvtan', label: 'Magyar nyelvtan' },
    { value: 'Matematika', label: 'Matematika' },
    { value: 'Német nyelv', label: 'Német nyelv' },
    { value: 'Történelem', label: 'Történelem' }
  ] as SelectOption[],
  
  grades: [
    { value: 5, label: '5. osztály' },
    { value: 6, label: '6. osztály' },
    { value: 7, label: '7. osztály' },
    { value: 8, label: '8. osztály' }
  ] as SelectOption[],
  
  difficulties: [
    { value: 'Könnyű', label: 'Könnyű' },
    { value: 'Közepes', label: 'Közepes' },
    { value: 'Nehéz', label: 'Nehéz' }
  ] as SelectOption[]
};

export const USER_OPTIONS = {
  roles: [
    { value: 'student', label: 'Diák' },
    { value: 'teacher', label: 'Tanár' },
    { value: 'admin', label: 'Adminisztrátor' }
  ] as SelectOption[]
};

export const USER_ROLES: Record<string, UserRole> = {
  ADMIN: 'admin',
  TEACHER: 'teacher',
  STUDENT: 'student'
};

export const DEFAULT_VALUES = {
  task: {
    title: '',
    description: '',
    subject: 'Magyar' as Subject,
    class_grade: 8 as Grade,
    difficulty: 'Közepes' as Difficulty
  },
  user: {
    name: '',
    email: '',
    password: '',
    role: 'student' as UserRole
  }
};

export const VALIDATION_RULES = {
  name: {
    minLength: 2,
    maxLength: 100
  },
  email: {
    minLength: 3,
    maxLength: 255
  },
  password: {
    minLength: 4,
    maxLength: 10
  },
  title: {
    minLength: 1,
    maxLength: 200
  },
  description: {
    minLength: 1,
    maxLength: 1000
  }
};

export const API_ENDPOINTS = {
  auth: {
    login: '/users/login',
    register: '/users/register',
    me: '/users/me'
  },
  users: {
    list: '/users',
    create: '/users/register',
    update: (id: number) => `/users/${id}`,
    delete: (id: number) => `/users/${id}`
  },
  tasks: {
    list: '/tasks',
    create: '/tasks',
    update: (id: number) => `/tasks/${id}`,
    delete: (id: number) => `/tasks/${id}`
  },
  scores: {
    save: '/scores/save',
    leaderboard: '/scores/leaderboard',
    myTotal: '/scores/my-total'
  }
};