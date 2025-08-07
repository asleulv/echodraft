import React, { useState } from "react";
import { Plus, X, CircleCheck, Loader2, CreditCard } from "lucide-react";

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
  // NEW: Credit-related prop
  hasCredits: boolean;
}

export default function SuggestionsList({
  suggestions = [],
  selectedSuggestions = [],
  toggleSuggestionSelection,
  handleClearSelection,
  onGenerateMore,
  originalRequestData,
  hasCredits, // NEW: Credit prop
}: SuggestionsListProps) {
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [moreCount, setMoreCount] = useState(5);

  // Safe variables with fallbacks
  const safeSuggestions = suggestions || [];
  const safeSelectedSuggestions = selectedSuggestions || [];

  const handleGenerateMoreClick = async () => {
    if (!onGenerateMore || !hasCredits) return;
    
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
      <div className="flex flex-col space-y-3 mb-4 md:flex-row md:justify-between md:items-center md:space-y-0">
  <h2 className="text-xl font-semibold text-primary-500 text-center md:text-left">
    AI Suggestions for Starting Your Document
  </h2>
  
  {/* Generate More Controls */}
  <div className="flex flex-col space-y-2 sm:flex-row sm:items-center sm:justify-center md:justify-end sm:space-y-0 sm:space-x-3">
    <div className="flex items-center space-x-2 justify-center sm:justify-start">
      <label className="text-sm font-medium text-primary-600">Generate:</label>
      <select 
        value={moreCount} 
        onChange={(e) => setMoreCount(Number(e.target.value))}
        className={`px-3 py-1 border border-primary-300 rounded text-sm min-w-0 ${
          hasCredits 
            ? 'bg-primary-200 text-primary-600' 
            : 'bg-primary-100 text-primary-600 cursor-not-allowed'
        }`}
        disabled={isLoadingMore || !hasCredits}
      >
        <option value={3}>3 more</option>
        <option value={5}>5 more</option>
        <option value={10}>10 more</option>
      </select>
    </div>
    
    <button
      type="button"
      className={`flex items-center justify-center gap-2 px-4 py-2 rounded font-medium transition-all duration-200 w-full sm:w-auto ${
        hasCredits
          ? 'btn-secondary hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:scale-100'
          : 'bg-primary-300 text-primary-600 cursor-not-allowed'
      }`}
      onClick={handleGenerateMoreClick}
      disabled={isLoadingMore || !hasCredits}
      title={!hasCredits ? "No credits available - purchase credits to generate more suggestions" : ""}
    >
      {isLoadingMore ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin" />
          Generating...
        </>
      ) : !hasCredits ? (
        <>
          <CreditCard className="h-4 w-4" />
          No Credits
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


      {/* NEW: Credit warning when no credits available */}
      {!hasCredits && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-danger-100 border border-danger-200 rounded-lg">
          <div className="flex items-center text-red-700 dark:text-primary-700">
            <CreditCard className="h-5 w-5 mr-2" />
            <span className="text-sm font-medium">
              No credits available for generating more suggestions. 
              <button 
                onClick={() => window.location.href = '/subscription'}
                className="ml-1 underline hover:text-red-900 font-semibold"
              >
                Purchase credits
              </button>
              {" "}to continue.
            </span>
          </div>
        </div>
      )}

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
          {!hasCredits && (
            <span className="ml-2 text-red-600 font-medium">
              • Purchase credits to generate more
            </span>
          )}
        </p>
      </div>
    </div>
  );
}
