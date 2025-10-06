import '../app/globals.css';
import { ToastProvider } from '../components/ui/ToastProvider';
import { ConfirmationProvider } from '../components/ui/useConfirmation';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

export default function App({ Component, pageProps }) {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <ConfirmationProvider>
          <Component {...pageProps} />
        </ConfirmationProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
