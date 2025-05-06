import { useState, useEffect } from 'react';
import { SystemMessage, systemMessagesAPI } from '@/utils/systemMessagesApi';

/**
 * Hook to fetch and manage system messages for a specific location
 * @param location The location to get the message for (dashboard, subscription, register)
 * @returns An object containing the message, loading state, error state, and a function to dismiss the message
 */
export function useSystemMessage(location: string) {
  const [message, setMessage] = useState<SystemMessage | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [dismissed, setDismissed] = useState<boolean>(false);

  useEffect(() => {
    let isMounted = true;

    const fetchMessage = async () => {
      try {
        setLoading(true);
        const data = await systemMessagesAPI.getActiveMessage(location);
        
        if (isMounted) {
          setMessage(data);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err instanceof Error ? err : new Error('Failed to fetch system message'));
          setLoading(false);
        }
      }
    };

    if (!dismissed) {
      fetchMessage();
    }

    return () => {
      isMounted = false;
    };
  }, [location, dismissed]);

  const dismissMessage = () => {
    setDismissed(true);
    setMessage(null);
  };

  return {
    message,
    loading,
    error,
    dismissMessage
  };
}
