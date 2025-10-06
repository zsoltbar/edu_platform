import { useState } from 'react';
import { useRouter } from 'next/router';
import Navbar from '../../components/Navbar';
import { useToast } from '../../components/ui/ToastProvider';
import { useConfirmationDialog } from '../../components/ui/useConfirmation';
import { DataTable, Column } from '../../components/ui/DataTable';
import { Modal } from '../../components/ui/Modal';
import { useModal } from '../../components/ui/useModal';
import { useNavigationShortcuts } from '../../components/ui/useKeyboard';

// Sample data for demonstration
const sampleUsers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin', active: true },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'student', active: true },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'student', active: false },
  { id: 4, name: 'Alice Brown', email: 'alice@example.com', role: 'teacher', active: true },
  { id: 5, name: 'Charlie Wilson', email: 'charlie@example.com', role: 'student', active: true },
];

export default function AdvancedUIDemo() {
  const [users, setUsers] = useState(sampleUsers);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const router = useRouter();
  const { showToast } = useToast();
  const { confirm } = useConfirmationDialog();
  const modal = useModal();

  // Navigation shortcuts
  useNavigationShortcuts({
    goToDashboard: () => router.push('/dashboard'),
    goToUsers: () => router.push('/admin/users'),
    goToTasks: () => router.push('/admin/tasks'),
  });

  // Define columns for the DataTable
  const columns: Column[] = [
    {
      key: 'name',
      label: 'Name',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'text'
    },
    {
      key: 'email',
      label: 'Email',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'text'
    },
    {
      key: 'role',
      label: 'Role',
      sortable: true,
      filterable: true,
      editable: true,
      type: 'select',
      selectOptions: [
        { value: 'admin', label: 'Admin' },
        { value: 'teacher', label: 'Tanár' },
        { value: 'student', label: 'Diák' }
      ]
    },
    {
      key: 'active',
      label: 'Active',
      sortable: true,
      editable: true,
      type: 'boolean'
    }
  ];

  // Handle row editing
  const handleRowEdit = (rowKey: any, field: string, newValue: any) => {
    setUsers(prev => prev.map(user => 
      user.id === rowKey ? { ...user, [field]: newValue } : user
    ));
    showToast(`User ${field} updated successfully!`, 'success');
  };

  // Handle row deletion with confirmation
  const handleRowDelete = async (rowKey: any) => {
    const user = users.find(u => u.id === rowKey);
    const confirmed = await confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user?.name}? This action cannot be undone.`,
      confirmText: 'Delete',
      variant: 'danger'
    });

    if (confirmed) {
      setUsers(prev => prev.filter(user => user.id !== rowKey));
      showToast('User deleted successfully!', 'success');
    }
  };

  // Handle selection change
  const handleSelectionChange = (selectedKeys: any[]) => {
    setSelectedUsers(selectedKeys);
    showToast(`${selectedKeys.length} users selected`, 'info');
  };

  // Demo actions
  const showSuccessToast = () => {
    showToast('This is a success message!', 'success');
  };

  const showErrorToast = () => {
    showToast('This is an error message!', 'error');
  };

  const showWarningToast = () => {
    showToast('This is a warning message!', 'warning');
  };

  const showInfoToast = () => {
    showToast('This is an info message!', 'info');
  };

  const testConfirmation = async () => {
    const confirmed = await confirm({
      title: 'Test Confirmation',
      message: 'Do you want to proceed with this action?',
      confirmText: 'Yes, proceed',
      cancelText: 'Cancel'
    });

    if (confirmed) {
      showToast('Action confirmed!', 'success');
    } else {
      showToast('Action cancelled', 'info');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-2xl font-bold mb-4">Advanced UI Components Demo</h1>
          <p className="text-gray-600 mb-6">
            This page demonstrates the new advanced UI components. Try the features below:
          </p>

          {/* Toast Notifications Demo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Toast Notifications</h2>
            <div className="flex space-x-2 flex-wrap gap-2">
              <button
                onClick={showSuccessToast}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
              >
                Success Toast
              </button>
              <button
                onClick={showErrorToast}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Error Toast
              </button>
              <button
                onClick={showWarningToast}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Warning Toast
              </button>
              <button
                onClick={showInfoToast}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Info Toast
              </button>
            </div>
          </div>

          {/* Modal Demo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Modal Dialog</h2>
            <button
              onClick={modal.open}
              className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700"
            >
              Open Modal
            </button>
          </div>

          {/* Confirmation Dialog Demo */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4">Confirmation Dialog</h2>
            <button
              onClick={testConfirmation}
              className="px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700"
            >
              Test Confirmation
            </button>
          </div>
        </div>

        {/* Advanced Data Table */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold mb-4">Advanced Data Table</h2>
          <p className="text-gray-600 mb-4">
            Features: Sorting, filtering, inline editing, selection, pagination. 
            Click on cells to edit them. Use keyboard shortcuts: Ctrl+D (Dashboard), Ctrl+U (Users), Ctrl+T (Tasks)
          </p>
          
          <DataTable
            data={users}
            columns={columns}
            keyField="id"
            sortable
            filterable
            editable
            pagination
            pageSize={5}
            onRowEdit={handleRowEdit}
            onRowDelete={handleRowDelete}
            selectable
            onSelectionChange={handleSelectionChange}
            emptyMessage="No users found"
          />

          {selectedUsers.length > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-blue-800">
                {selectedUsers.length} users selected: {selectedUsers.join(', ')}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Modal content */}
      <Modal
        isOpen={modal.isOpen}
        onClose={modal.close}
        title="Demo Modal"
        size="medium"
      >
        <div className="space-y-4">
          <p>This is a demo modal with proper focus management and animations.</p>
          <p>You can close it by:</p>
          <ul className="list-disc list-inside space-y-1 text-gray-600">
            <li>Clicking the X button</li>
            <li>Pressing the Escape key</li>
            <li>Clicking outside the modal</li>
            <li>Using the button below</li>
          </ul>
          <div className="flex justify-end space-x-2">
            <button
              onClick={modal.close}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Close Modal
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}