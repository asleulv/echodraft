import React from "react";
import { RefreshCw, X, CircleCheck } from "lucide-react";

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
        <button
          type="button"
          className="btn-secondary flex items-center gap-2"
          onClick={handleGenerateNew}
        >
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
                ? "bg-secondary-200 dark:bg-secondary-50 border-secondary-500 text-primary-600"
                : "bg-primary-200 text-primary-600 border-primary-200 hover:bg-primary-50"
            }`}
          >
            <label className="flex items-start cursor-pointer p-3 select-none">
              <input
                type="checkbox"
                className="hidden"
                checked={selectedSuggestions.includes(s)}
                onChange={() => toggleSuggestionSelection(s)}
                aria-label={`Select suggestion ${idx + 1}`}
              />
              <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50 mt-1 flex-shrink-0">
                {selectedSuggestions.includes(s) && (
                  <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                )}
              </span>
              <span className="ml-3 whitespace-pre-wrap break-words">{s}</span>
            </label>
          </li>
        ))}
      </ul>
    </div>
  );
}
