// Example of how to refactor AdminUsers - showing the new user form section

import React from 'react';
import api from '../../lib/api';
import { FormField, SelectField, PasswordField } from '../../components/forms';
import { useFormState } from '../../hooks/useFormState';
import { UserFormData } from '../../types';
import { USER_OPTIONS, DEFAULT_VALUES, API_ENDPOINTS } from '../../constants';
import { getValidationRules } from '../../utils/validation';

interface NewUserFormProps {
  onUserCreated: () => void;
  getAuthHeader: () => any;
}

export const NewUserForm: React.FC<NewUserFormProps> = ({ onUserCreated, getAuthHeader }) => {
  const validationRules = {
    name: getValidationRules().name,
    email: getValidationRules().email,
    password: getValidationRules().password,
    role: { required: false }
  };

  const handleCreateUser = async (values: UserFormData) => {
    try {
      await api.post(
        API_ENDPOINTS.users.create,
        {
          name: values.name.trim(),
          email: values.email.trim(),
          password: values.password
        },
        getAuthHeader()
      );
      
      onUserCreated();
      newUserForm.reset();
      alert('Új felhasználó sikeresen létrehozva!');
    } catch (error) {
      console.error('Error creating user:', error);
      alert('Hiba a felhasználó létrehozása során');
    }
  };

  const newUserForm = useFormState<UserFormData>({
    initialValues: DEFAULT_VALUES.user,
    validationRules,
    onSubmit: handleCreateUser
  });

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h2 className="text-xl font-bold mb-4 text-green-700">Új felhasználó létrehozása</h2>
      <form onSubmit={newUserForm.handleSubmit}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            label="Név"
            name="name"
            value={newUserForm.values.name}
            onChange={(value) => newUserForm.setField('name', value)}
            onBlur={() => newUserForm.setTouched('name')}
            placeholder="Teljes név"
            required
            error={newUserForm.errors.name}
          />
          
          <FormField
            label="Email/Bejelentkezési név"
            name="email"
            value={newUserForm.values.email}
            onChange={(value) => newUserForm.setField('email', value)}
            onBlur={() => newUserForm.setTouched('email')}
            placeholder="email@example.com vagy felhasználónév"
            required
            error={newUserForm.errors.email}
          />
          
          <PasswordField
            label="Jelszó"
            name="password"
            value={newUserForm.values.password || ''}
            onChange={(value) => newUserForm.setField('password', value)}
            onBlur={() => newUserForm.setTouched('password')}
            placeholder="Legalább 4 karakter"
            required
            error={newUserForm.errors.password}
          />
          
          <SelectField
            label="Szerepkör"
            name="role"
            value={newUserForm.values.role}
            onChange={(value) => newUserForm.setField('role', value)}
            options={USER_OPTIONS.roles}
          />
        </div>
        
        <div className="flex justify-end space-x-3 mt-6">
          <button
            type="button"
            onClick={() => newUserForm.reset()}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium transition duration-200"
          >
            Mégse
          </button>
          <button
            type="submit"
            disabled={newUserForm.isSubmitting || newUserForm.hasErrors}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-bold py-2 px-6 rounded-lg transition duration-200"
          >
            {newUserForm.isSubmitting ? 'Létrehozás...' : 'Létrehozás'}
          </button>
        </div>
      </form>
    </div>
  );
};