import { useRouter } from "next/router";

interface CreditErrorHandlerProps {
  error: any;
  onClearError: () => void;
}

export default function CreditErrorHandler({ error, onClearError }: CreditErrorHandlerProps) {
  const router = useRouter();

  if (!error) return null;

  // Check if it's a credit-related error
  const isCreditError = typeof error === 'object' || 
    (typeof error === 'string' && error.toLowerCase().includes('credit'));

  if (isCreditError && typeof error === 'object') {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3 flex-1">
            {error}
            <div className="mt-3">
              <button
                onClick={onClearError}
                className="text-sm text-red-600 underline hover:text-red-500 mr-4"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Regular error display (existing functionality)
  return (
    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      <p className="font-bold">Error</p>
      <p>{typeof error === 'string' ? error : 'An error occurred'}</p>
      <button
        onClick={onClearError}
        className="text-sm text-red-600 underline hover:text-red-500 mt-2"
      >
        Dismiss
      </button>
    </div>
  );
}
