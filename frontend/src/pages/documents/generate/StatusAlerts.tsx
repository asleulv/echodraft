import React from "react";
import { AlertCircle, Check, X } from "lucide-react";

interface StatusAlertsProps {
  error: string | React.ReactNode | undefined;
  success: string | undefined;
  debugData: any;
  clearDebugData: () => void;
}

export default function StatusAlerts({ error, success, debugData, clearDebugData }: StatusAlertsProps) {
  if (error) {
    return (
      <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6 flex items-start">
        <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>{error}</div>
      </div>
    );
  } else if (success) {
    return (
      <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6 flex items-start">
        <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
        <div>{success}</div>
      </div>
    );
  } else if (debugData) {
    return (
      <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
        <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(debugData, null, 2)}</pre>
        <div className="flex space-x-4 mt-4">
          <button type="button" className="btn-primary" onClick={clearDebugData}>
            Back to Form
          </button>
        </div>
      </div>
    );
  }
  return null;
}
