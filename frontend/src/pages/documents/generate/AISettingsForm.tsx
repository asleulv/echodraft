import React from "react";
import DocumentPreviewList from "@/components/DocumentPreviewList";
import {
  Heart,
  TextSearch,
  Sparkles,
  Lightbulb,
  ArrowRight,
  Edit3,
  FileText,
} from "lucide-react";

interface AISettingsFormProps {
  stage: "concept" | "sources" | "ready";
  onConceptComplete: () => void;
  onSkipStyleSources: () => void;
  onEditConcept: () => void;
  concept: string;
  setConcept: (val: string) => void;
  suggestionLength: string;
  setSuggestionLength: (val: string) => void;
  selectedTags: string[];
  setSelectedTags: (tags: string[]) => void;
  tagInput: string;
  setTagInput: (val: string) => void;
  handleTagInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleTagInputKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  addTag: () => void;
  removeTag: (tag: string) => void;
  selectedCategoryFilter?: string;
  setSelectedCategoryFilter: (val: string | undefined) => void;
  selectedStatus?: string;
  setSelectedStatus: (val: string | undefined) => void;
  categories: any[];
  isLoadingCategories: boolean;
  selectedDocumentIds: number[];
  onSelectedDocumentsChange: (ids: number[]) => void;
  isSubmitting: boolean;
  handleSubmit: (e: React.FormEvent) => void;
  aiGenerationsRemaining: number | null;
  isLoadingGenerationLimit: boolean;
  debugMode: boolean;
  setDebugMode: (val: boolean) => void;
}

export default function AISettingsForm({
  stage,
  onConceptComplete,
  onSkipStyleSources,
  concept = '',
  setConcept,
  suggestionLength = 'medium',
  setSuggestionLength,
  onEditConcept,
  selectedTags = [],
  setSelectedTags,
  tagInput = '',
  setTagInput,
  handleTagInputChange,
  handleTagInputKeyDown,
  addTag,
  removeTag,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedStatus,
  setSelectedStatus,
  categories = [],
  isLoadingCategories = false,
  selectedDocumentIds = [],
  onSelectedDocumentsChange,
  isSubmitting = false,
  handleSubmit,
  aiGenerationsRemaining,
  isLoadingGenerationLimit = false,
  debugMode = false,
  setDebugMode,
}: AISettingsFormProps) {
  // Safe variables with fallbacks
  const safeConcept = concept || '';
  const safeCategories = categories || [];
  const safeSelectedTags = selectedTags || [];
  const safeSelectedDocumentIds = selectedDocumentIds || [];
  
  const conceptFilled = safeConcept.trim().length > 0;
  const hasStyleSources = safeSelectedDocumentIds.length > 0;
  const conceptLength = safeConcept.length || 0;

  return (
    <div className="bg-white dark:bg-neutral-900 border-2 border-primary-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300">
      {/* Progress indicator at top */}
      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-t-xl h-2">
        <div
          className={`bg-gradient-to-r from-secondary-500 to-secondary-600 h-2 rounded-tl-xl transition-all duration-700 ease-out ${
            stage === "concept" ? "w-1/2" : "w-full"
          }`}
        ></div>
      </div>

      {/* Stage 1: Concept Input */}
      {stage === "concept" && (
        <div className="p-8 space-y-8">
          <div className="text-center mb-8">
            <div className="mb-4">
              <Sparkles className="h-16 w-16 text-secondary-500 mx-auto animate-pulse" />
            </div>
            <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
              What do you want to write about?
            </h2>
          </div>

          <div className="space-y-4">
            <div className="relative">
              <div className="relative">
                <div className="absolute top-3 left-3 pointer-events-none">
                  <Sparkles className="h-5 w-5 text-secondary-800" />
                </div>
                <textarea
                  id="concept"
                  value={safeConcept}
                  onChange={(e) => setConcept?.(e.target.value)}
                  className="form-input h-48 text-lg shadow-md hover:shadow-lg focus:shadow-xl transition-all duration-300 border-2 focus:border-secondary-400 dark:focus:border-secondary-500 rounded-lg resize-none pl-10"
                  placeholder="e.g., 'A comprehensive guide to remote work productivity for distributed teams' or 'An engaging email series introducing our innovative sustainability platform'"
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="flex justify-between items-center">
              <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">
                {conceptLength} characters
              </p>
              {/* Aligned thresholds: both button and message activate at 50 characters */}
              {conceptLength >= 50 && (
                <div className="flex items-center text-sm text-secondary-600 font-semibold animate-fade-in">
                  <Heart className="h-4 w-4 mr-1" />
                  Perfect! Concept ready
                </div>
              )}
              {/* Show encouraging message for shorter concepts */}
              {conceptLength > 0 && conceptLength < 50 && (
                <div className="flex items-center text-sm text-secondary-600 dark:text-secondary-400 font-semibold">
                  <Sparkles className="h-4 w-4 mr-1" />
                  Keep going...
                </div>
              )}
            </div>

            {/* Tip with consistent styling - Updated with Lucide lightbulb */}
            {conceptLength > 0 && conceptLength < 50 && (
              <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 rounded-lg p-4 animate-fade-in">
                <p className="text-secondary-600 text-sm flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Tip:</span>
                  <span className="ml-1">
                    Try adding more detail for better AI suggestions!
                  </span>
                </p>
              </div>
            )}
          </div>

          <div className="space-y-4">
            {/* Simplified heading without icon */}
            <h2 className="text-2xl font-bold bg-gradient-to-r text-center from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
              How long should the suggestions be?
            </h2>
            <div className="relative">
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                <FileText className="h-5 w-5 text-secondary-400" />
              </div>
              <select
                id="suggestionLength"
                value={suggestionLength}
                onChange={(e) => setSuggestionLength?.(e.target.value)}
                className="form-input text-lg shadow-md hover:shadow-lg focus:shadow-xl transition-all duration-300 border-2 focus:border-secondary-400 dark:focus:border-secondary-500 rounded-lg pl-10"
              >
                <option value="short">Short paragraphs (50-75 words)</option>
                <option value="medium">Medium paragraphs (75-125 words)</option>
                <option value="long">Long paragraphs (125-200 words)</option>
                <option value="detailed">
                  Detailed paragraphs (200-300 words)
                </option>
              </select>
            </div>

            {/* Made the second tip consistent with the first one - Updated with Lucide lightbulb */}
            <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-4">
              <p className="text-secondary-600 text-sm flex items-center">
                <Lightbulb className="h-4 w-4 mr-2" />
                <span className="font-semibold">Tip:</span>
                <span className="ml-1">
                  This determines how much detail each AI suggestion will
                  contain. Medium works great for most content!
                </span>
              </p>
            </div>
          </div>

          {/* Aligned button threshold with message threshold */}
          <button
            type="button"
            onClick={onConceptComplete}
            disabled={conceptLength < 50}
            className={`btn-primary w-full py-6 text-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center ${
              conceptLength < 50
                ? "opacity-50 cursor-not-allowed scale-95"
                : "bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-400 hover:to-secondary-600"
            }`}
          >
            {conceptLength >= 50 ? (
              <>
                Continue to Style Sources
                <ArrowRight className="h-6 w-6 ml-3" />
              </>
            ) : (
              <>
                <Sparkles className="h-6 w-6 mr-3 opacity-50" />
                Enter your concept to continue
              </>
            )}
          </button>
        </div>
      )}

      {/* Stage 2: Style Sources */}
      {stage === "sources" && (
        <form onSubmit={handleSubmit}>
          <div className="p-8 space-y-8">
            {/* Show condensed concept with cleaner styling */}
            <div className="bg-gradient-to-r from-primary-50 to-primary-200 p-5 rounded-xl border-2 border-primary-200 shadow-md">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-sm font-bold text-primary-600 uppercase tracking-wider flex items-center">
                    <Sparkles className="h-4 w-4 mr-2" />
                    Your Concept:
                  </span>
                  <p className="text-primary-600 mt-2 font-medium text-lg leading-relaxed">
                    {conceptLength > 150
                      ? safeConcept.substring(0, 150) + "..."
                      : safeConcept}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={onEditConcept}
                  className="text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 text-sm font-semibold ml-4 flex items-center hover:bg-white dark:hover:bg-gray-700 px-3 py-2 rounded-lg transition-all duration-200"
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </button>
              </div>
            </div>

            {/* Centered header section matching Stage 1 */}
            <div className="text-center mb-8">
              <div className="mb-4">
                <TextSearch className="h-16 w-16 text-secondary-500 mx-auto animate-pulse" />
              </div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-primary-600 to-secondary-600 bg-clip-text text-transparent mb-3">
                Choose Your Writing Style
              </h2>
              <p className="text-xl text-primary-500">
                Select documents that match the style you want AI to emulate
              </p>

              {/* Updated optional notice with consistent styling - Updated with Lucide lightbulb */}
              <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 rounded-lg p-4">
                <p className="text-secondary-700 dark:text-secondary-300 text-sm flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Tip:</span>
                  <span className="ml-1">
                    You can skip this step for generic AI suggestions
                  </span>
                </p>
              </div>
            </div>

            {/* Simplified filters section */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label
                    htmlFor="categoryFilter"
                    className="form-label font-semibold text-primary-700 dark:text-primary-300"
                  >
                    Category
                  </label>
                  <select
                    id="categoryFilter"
                    value={selectedCategoryFilter || ""}
                    onChange={(e) =>
                      setSelectedCategoryFilter?.(e.target.value || undefined)
                    }
                    className="form-input text-lg shadow-md hover:shadow-lg focus:shadow-xl transition-all duration-300 border-2 focus:border-secondary-400 dark:focus:border-secondary-500 rounded-lg"
                    disabled={isLoadingCategories}
                  >
                    <option value="">All Categories</option>
                    {safeCategories?.map((category) => (
                      <option key={category?.id || Math.random()} value={category?.id}>
                        {category?.name || 'Unknown Category'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="status"
                    className="form-label font-semibold text-primary-700 dark:text-primary-300"
                  >
                    Status
                  </label>
                  <select
                    id="status"
                    value={selectedStatus || ""}
                    onChange={(e) =>
                      setSelectedStatus?.(e.target.value || undefined)
                    }
                    className="form-input text-lg shadow-md hover:shadow-lg focus:shadow-xl transition-all duration-300 border-2 focus:border-secondary-400 dark:focus:border-secondary-500 rounded-lg"
                  >
                    <option value="">All Statuses</option>
                    <option value="draft">Draft</option>
                    <option value="published">Published</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label
                    htmlFor="tags"
                    className="form-label font-semibold text-primary-700 dark:text-primary-300"
                  >
                    Tags
                  </label>
                  <input
                    id="tags"
                    type="text"
                    value={tagInput}
                    onChange={handleTagInputChange}
                    onKeyDown={handleTagInputKeyDown}
                    className="form-input text-lg shadow-md hover:shadow-lg focus:shadow-xl transition-all duration-300 border-2 focus:border-secondary-400 dark:focus:border-secondary-500 rounded-lg"
                    placeholder="Add tags..."
                  />
                </div>
              </div>

              {/* Selected tags with consistent styling */}
              {safeSelectedTags.length > 0 && (
                <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                  <span className="text-sm font-bold text-secondary-700 dark:text-secondary-300 block mb-3">
                    Active filters:
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {safeSelectedTags?.map((tag, index) => (
                      <span
                        key={`tag-${tag}-${index}`}
                        className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-secondary-100 dark:bg-secondary-900/30 text-secondary-800 dark:text-secondary-200"
                      >
                        {tag}
                        <button
                          type="button"
                          onClick={() => removeTag?.(tag)}
                          className="ml-2 text-secondary-600 dark:text-secondary-400 hover:text-secondary-800 dark:hover:text-secondary-200 font-bold"
                          aria-label={`Remove tag ${tag}`}
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Document selection with simplified styling */}
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-primary-600">
                Select Documents
              </h3>
              <DocumentPreviewList
                tags={safeSelectedTags}
                categoryFilter={selectedCategoryFilter}
                status={selectedStatus}
                onSelectedDocumentsChange={onSelectedDocumentsChange}
                selectedDocumentIds={safeSelectedDocumentIds}
              />
            </div>

            {/* Status messaging with consistent tip styling - Updated with Lucide lightbulb */}
            {!hasStyleSources ? (
              <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 rounded-lg p-4">
                <p className="text-secondary-700 dark:text-secondary-300 text-sm flex items-center">
                  <Lightbulb className="h-4 w-4 mr-2" />
                  <span className="font-semibold">Tip:</span>
                  <span className="ml-1">
                    Select documents above to generate with a specific writing
                    style, or use the "Skip" button for generic AI suggestions.
                  </span>
                </p>
              </div>
            ) : (
              <div className="bg-secondary-50 dark:bg-secondary-900/20 border border-secondary-200 dark:border-secondary-700 rounded-lg p-4">
                <p className="text-secondary-700 dark:text-secondary-300 text-sm flex items-center">
                  ✨ <span className="font-semibold ml-2">Ready:</span>
                  <span className="ml-1">
                    {safeSelectedDocumentIds.length} document
                    {safeSelectedDocumentIds.length > 1 ? "s" : ""} selected as
                    style reference. AI will emulate the writing style from
                    these documents.
                  </span>
                </p>
              </div>
            )}

            {/* Subscription info */}
            {!isLoadingGenerationLimit && aiGenerationsRemaining !== null && (
              <div className="text-center bg-primary-50 dark:bg-primary-900/20 rounded-xl p-4">
                <div className="flex items-center justify-center">
                  <span className="text-lg font-semibold text-primary-600 dark:text-primary-300">
                    AI Generations Remaining:
                  </span>
                  <span className="ml-2 text-2xl font-bold text-secondary-600 dark:text-secondary-400">
                    {aiGenerationsRemaining}
                  </span>
                </div>
                {aiGenerationsRemaining === 0 && (
                  <div className="mt-3 text-danger-600 dark:text-danger-400 bg-danger-50 dark:bg-danger-900/20 rounded-lg p-3">
                    You have reached your monthly AI generation limit.
                    <button
                      onClick={() => window.location.assign("/subscription")}
                      className="ml-2 underline font-bold text-danger-700 dark:text-danger-300 hover:text-danger-900 dark:hover:text-danger-100 transition-colors duration-200"
                    >
                      Upgrade your subscription →
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Buttons matching Stage 1 style */}
            <div className="flex gap-4">
              <button
                type="button"
                onClick={onSkipStyleSources}
                disabled={
                  isSubmitting ||
                  (aiGenerationsRemaining !== null &&
                    aiGenerationsRemaining <= 0 &&
                    !debugMode)
                }
                className={`btn-secondary flex-1 py-6 text-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center ${
                  isSubmitting ||
                  (aiGenerationsRemaining !== null &&
                    aiGenerationsRemaining <= 0 &&
                    !debugMode)
                    ? "opacity-50 cursor-not-allowed scale-95"
                    : "hover:scale-105 hover:-translate-y-1"
                }`}
              >
                Skip & Use Generic AI
              </button>

              <button
                type="submit"
                disabled={
                  isSubmitting ||
                  !hasStyleSources ||
                  (aiGenerationsRemaining !== null &&
                    aiGenerationsRemaining <= 0 &&
                    !debugMode)
                }
                className={`btn-primary flex-1 py-6 text-xl font-bold shadow-lg hover:shadow-xl transform transition-all duration-300 flex items-center justify-center ${
                  isSubmitting ||
                  !hasStyleSources ||
                  (aiGenerationsRemaining !== null &&
                    aiGenerationsRemaining <= 0 &&
                    !debugMode)
                    ? "opacity-50 cursor-not-allowed scale-95"
                    : "hover:scale-105 hover:-translate-y-1 bg-gradient-to-r from-secondary-500 to-secondary-600 hover:from-secondary-600 hover:to-secondary-700"
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Sparkles className="h-6 w-6 mr-3 animate-spin" />
                    Generating AI Suggestions...
                  </>
                ) : debugMode ? (
                  "Show Debug Info"
                ) : aiGenerationsRemaining !== null &&
                  aiGenerationsRemaining <= 0 ? (
                  "Generation Limit Reached"
                ) : (
                  <>
                    <Sparkles className="h-6 w-6 mr-3" />
                    Generate with Style References
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
