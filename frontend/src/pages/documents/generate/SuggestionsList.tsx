import React, { useState } from "react";
import { Plus, X, CircleCheck, Loader2 } from "lucide-react";

interface SuggestionsListProps {
  suggestions: string[];
  selectedSuggestions: string[];
  toggleSuggestionSelection: (suggestion: string) => void;
  handleClearSelection: () => void;
  onGenerateMore: (count: number) => Promise<void>;
  originalRequestData?: {
    concept: string;
    style_guide?: string;
    suggestion_length: string;
    selected_document_ids: number[];
    num_suggestions: number;
  };
}

export default function SuggestionsList({
  suggestions = [],
  selectedSuggestions = [],
  toggleSuggestionSelection,
  handleClearSelection,
  onGenerateMore,
  originalRequestData,
}: SuggestionsListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreCount, setMoreCount] = useState(5);

  // Safe variables with fallbacks
  const safeSuggestions = suggestions || [];
  const safeSelectedSuggestions = selectedSuggestions || [];

  const handleGenerateMoreClick = async () => {
    if (!onGenerateMore) return;
    
    setIsLoadingMore(true);
    try {
      await onGenerateMore(moreCount);
    } catch (error) {
      console.error('Error generating more suggestions:', error);
    } finally {
      setIsLoadingMore(false);
    }
  };

  return (
    <div className="bg-primary-100 dark:bg-primary-100 border-4 border-primary-200 dark:border-primary-300 rounded-md p-6 mb-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-primary-500">
          AI Suggestions for Starting Your Document
        </h2>
        
        {/* Generate More Controls */}
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <label className="text-sm font-medium text-primary-600">Generate:</label>
            <select 
              value={moreCount} 
              onChange={(e) => setMoreCount(Number(e.target.value))}
              className="px-3 py-1 border border-primary-300 rounded bg-white text-primary-600 text-sm"
              disabled={isLoadingMore}
            >
              <option value={3}>3 more</option>
              <option value={5}>5 more</option>
              <option value={10}>10 more</option>
            </select>
          </div>
          
          <button
            type="button"
            className="btn-secondary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={handleGenerateMoreClick}
            disabled={isLoadingMore}
          >
            {isLoadingMore ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Plus className="h-4 w-4" />
                Generate More
              </>
            )}
          </button>
        </div>
      </div>

      <ul className="space-y-3">
        {safeSuggestions?.map((s, idx) => (
          <li
            key={`suggestion-${idx}-${s?.substring(0, 20) || 'empty'}`}
            className={`rounded border transition ${
              safeSelectedSuggestions.includes(s)
                ? "bg-secondary-200 dark:bg-secondary-50 border-secondary-500 text-primary-600"
                : "bg-primary-200 text-primary-600 border-primary-200 hover:bg-primary-50"
            }`}
          >
            <label className="flex items-start cursor-pointer p-3 select-none">
              <input
                type="checkbox"
                className="hidden"
                checked={safeSelectedSuggestions.includes(s)}
                onChange={() => toggleSuggestionSelection?.(s)}
                aria-label={`Select suggestion ${idx + 1}`}
              />
              <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 dark:bg-primary-200 hover:bg-primary-300 dark:hover:bg-primary-50 mt-1 flex-shrink-0">
                {safeSelectedSuggestions.includes(s) && (
                  <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                )}
              </span>
              <span className="ml-3 whitespace-pre-wrap break-words">{s || ''}</span>
            </label>
          </li>
        ))}
      </ul>

      {/* Total count indicator */}
      <div className="text-center mt-4 pt-4 border-t border-primary-300">
        <p className="text-sm text-primary-600 opacity-70">
          Showing {safeSuggestions.length} suggestions total
        </p>
      </div>
    </div>
  );
}
