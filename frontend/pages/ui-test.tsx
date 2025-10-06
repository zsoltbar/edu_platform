import { useToast } from '../components/ui/ToastProvider';
import { useConfirmationDialog } from '../components/ui/useConfirmation';

export default function UITest() {
  const { showToast } = useToast();
  const { confirm } = useConfirmationDialog();

  const testToast = () => {
    showToast('Test toast notification!', 'success');
  };

  const testConfirm = async () => {
    const result = await confirm({
      title: 'Test',
      message: 'This is a test confirmation',
      confirmText: 'OK'
    });
    
    if (result) {
      showToast('Confirmed!', 'success');
    } else {
      showToast('Cancelled!', 'info');
    }
  };

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">UI Component Test</h1>
      <div className="space-x-4">
        <button 
          onClick={testToast}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Test Toast
        </button>
        <button 
          onClick={testConfirm}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Test Confirmation
        </button>
      </div>
    </div>
  );
}