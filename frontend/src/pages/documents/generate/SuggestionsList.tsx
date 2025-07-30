import React from "react";
import { RefreshCw, X } from "lucide-react";

interface SuggestionsListProps {
  suggestions: string[];
  selectedSuggestions: string[];
  toggleSuggestionSelection: (suggestion: string) => void;
  handleClearSelection: () => void;
  handleGenerateNew: () => void;
}

export default function SuggestionsList({
  suggestions,
  selectedSuggestions,
  toggleSuggestionSelection,
  handleClearSelection,
  handleGenerateNew,
}: SuggestionsListProps) {
  return (
    <div className="bg-primary-100 dark:bg-primary-100 border-4 border-primary-200 dark:border-primary-300 rounded-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary-500">
          AI Suggestions for Starting Your Document
        </h2>
        <button type="button" className="btn-secondary flex items-center gap-2" onClick={handleGenerateNew}>
          <RefreshCw className="h-4 w-4" />
          Generate New Suggestions
        </button>
      </div>

      <ul className="space-y-3">
        {suggestions.map((s, idx) => (
          <li
            key={idx}
            className={`rounded border transition ${
              selectedSuggestions.includes(s)
                ? "bg-success-100 dark:bg-success-900/30 border-success-400 dark:border-success-800 text-success-700 dark:text-success-400"
                : "bg-white dark:bg-primary-100 text-primary-600 border-primary-200 dark:border-primary-300 hover:bg-primary-50 dark:hover:bg-primary-200"
            }`}
          >
            <label className="flex items-start cursor-pointer p-3 select-none">
              <input
                type="checkbox"
                checked={selectedSuggestions.includes(s)}
                onChange={() => toggleSuggestionSelection(s)}
                className="mt-1"
                aria-label={`Select suggestion ${idx + 1}`}
              />
              <span className="ml-3 whitespace-pre-wrap break-words">{s}</span>
            </label>
          </li>
        ))}
      </ul>

      
    </div>
  );
}
