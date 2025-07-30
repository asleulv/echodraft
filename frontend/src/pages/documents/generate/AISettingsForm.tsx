import React from "react";
import DocumentPreviewList from "@/components/DocumentPreviewList";
import { FileCog, TextSearch } from "lucide-react";

interface AISettingsFormProps {
  stage: 'concept' | 'sources' | 'ready';
  onConceptComplete: () => void;
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
  concept,
  setConcept,
  suggestionLength,
  setSuggestionLength,
  selectedTags,
  setSelectedTags,
  tagInput,
  setTagInput,
  handleTagInputChange,
  handleTagInputKeyDown,
  addTag,
  removeTag,
  selectedCategoryFilter,
  setSelectedCategoryFilter,
  selectedStatus,
  setSelectedStatus,
  categories,
  isLoadingCategories,
  selectedDocumentIds,
  onSelectedDocumentsChange,
  isSubmitting,
  handleSubmit,
  aiGenerationsRemaining,
  isLoadingGenerationLimit,
  debugMode,
  setDebugMode,
}: AISettingsFormProps) {
  
  const conceptFilled = concept.trim().length > 0;

  return (
    <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md border-4">
      
      {/* Stage 1: Concept Input */}
      {stage === 'concept' && (
        <div className="p-8 space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-primary-600 mb-2">What do you want to write about?</h2>
            <p className="text-lg text-primary-500">Describe your concept and we'll help you get started</p>
          </div>

          <div>
            <label htmlFor="concept" className="form-label text-lg font-medium">
              Your Concept *
            </label>
            <textarea
              id="concept"
              value={concept}
              onChange={(e) => setConcept(e.target.value)}
              className="form-input h-40 text-lg"
              placeholder="e.g., 'A blog post about sustainable living tips for busy professionals' or 'An email campaign for our new product launch'"
              autoFocus
              required
            />
            <div className="flex justify-between items-center mt-2">
              <p className="text-xs text-gray-500">{concept.length} characters</p>
              {conceptFilled && (
                <p className="text-xs text-success-600">✓ Concept ready</p>
              )}
            </div>
          </div>

          <div>
            <label htmlFor="suggestionLength" className="form-label text-lg font-medium">
              How detailed should suggestions be?
            </label>
            <select
              id="suggestionLength"
              value={suggestionLength}
              onChange={(e) => setSuggestionLength(e.target.value)}
              className="form-input text-lg"
            >
              <option value="short">Short paragraphs (50-75 words)</option>
              <option value="medium">Medium paragraphs (75-125 words)</option>
              <option value="long">Long paragraphs (125-200 words)</option>
              <option value="detailed">Detailed paragraphs (200-300 words)</option>
            </select>
            <p className="mt-1 text-sm text-primary-500">
              This determines how much detail each AI suggestion will contain
            </p>
          </div>

          <button
            type="button"
            onClick={onConceptComplete}
            disabled={!conceptFilled}
            className={`btn-primary w-full py-4 text-lg font-semibold ${
              !conceptFilled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-primary-700'
            }`}
          >
            Continue to Style Sources →
          </button>
        </div>
      )}

      {/* Stage 2: Style Sources */}
      {stage === 'sources' && (
        <form onSubmit={handleSubmit}>
          <div className="p-6 space-y-6">
            {/* Show condensed concept */}
            <div className="bg-primary-50 dark:bg-primary-900/20 p-4 rounded-lg border border-primary-200">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-sm font-semibold text-primary-600 uppercase tracking-wide">Your Concept:</span>
                  <p className="text-primary-800 dark:text-primary-200 mt-1 font-medium">
                    {concept.length > 150 ? concept.substring(0, 150) + '...' : concept}
                  </p>
                </div>
                <button 
                  type="button" 
                  onClick={() => onConceptComplete()} // This will be called but stage is already 'sources', need to go back
                  className="text-primary-600 hover:text-primary-800 text-sm underline ml-4"
                >
                  Edit
                </button>
              </div>
            </div>

            <div className="text-center">
              <h2 className="text-2xl font-bold text-primary-600 mb-2">Choose Your Writing Style</h2>
              <p className="text-primary-500">Select documents that match the style you want AI to emulate</p>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label htmlFor="categoryFilter" className="form-label font-medium">Category</label>
                <select
                  id="categoryFilter"
                  value={selectedCategoryFilter || ''}
                  onChange={(e) => setSelectedCategoryFilter(e.target.value || undefined)}
                  className="form-input"
                  disabled={isLoadingCategories}
                >
                  <option value="">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="status" className="form-label font-medium">Status</label>
                <select
                  id="status"
                  value={selectedStatus || ''}
                  onChange={(e) => setSelectedStatus(e.target.value || undefined)}
                  className="form-input"
                >
                  <option value="">All Statuses</option>
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label htmlFor="tags" className="form-label font-medium">Filter by Tags</label>
                <input
                  id="tags"
                  type="text"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  className="form-input"
                  placeholder="Add tags..."
                />
              </div>
            </div>

            {/* Selected tags */}
            {selectedTags.length > 0 && (
              <div>
                <span className="text-sm font-medium text-primary-600 block mb-2">Active tag filters:</span>
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map((tag) => (
                    <span
                      key={tag}
                      className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/70 dark:text-primary-400"
                    >
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="ml-2 text-primary-600 hover:text-primary-800 font-bold"
                        aria-label={`Remove tag ${tag}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Document selection */}
            <div>
              <h3 className="text-lg font-semibold text-primary-600 mb-3 flex items-center">
                <TextSearch className="h-5 w-5 mr-2" />
                Select Style Reference Documents
              </h3>
              <DocumentPreviewList
                tags={selectedTags}
                categoryFilter={selectedCategoryFilter}
                status={selectedStatus}
                onSelectedDocumentsChange={onSelectedDocumentsChange}
                selectedDocumentIds={selectedDocumentIds}
              />
            </div>

            {selectedDocumentIds.length === 0 ? (
              <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <p className="text-yellow-800 dark:text-yellow-200 font-medium">
                  ⚠️ Please select at least one document to use as a style reference.
                </p>
                <p className="text-yellow-700 dark:text-yellow-300 text-sm mt-1">
                  The AI will learn from these documents to match your writing style.
                </p>
              </div>
            ) : (
              <div className="bg-success-50 dark:bg-success-900/20 border border-success-200 dark:border-success-800 rounded-lg p-4">
                <p className="text-success-800 dark:text-success-200 font-medium">
                  ✓ {selectedDocumentIds.length} document{selectedDocumentIds.length > 1 ? 's' : ''} selected as style reference
                </p>
              </div>
            )}

            {/* Subscription info and submit */}
            <div className="pt-4 border-t border-primary-200">
              {!isLoadingGenerationLimit && aiGenerationsRemaining !== null && (
                <div className="text-center mb-4">
                  <span className="text-sm font-medium text-primary-600">
                    AI Generations Remaining: 
                  </span>
                  <span className="ml-1 font-bold text-primary-800">
                    {aiGenerationsRemaining}
                  </span>
                  {aiGenerationsRemaining === 0 && (
                    <div className="mt-2 text-danger-600 dark:text-danger-400">
                      You have reached your monthly AI generation limit.
                      <button
                        onClick={() => window.location.assign("/subscription")}
                        className="ml-1 underline font-semibold text-danger-600 hover:text-danger-400 dark:text-danger-400 dark:hover:text-danger-300"
                      >
                        Upgrade your subscription
                      </button>
                    </div>
                  )}
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting || selectedDocumentIds.length === 0 || (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0 && !debugMode)}
                className={`btn-primary w-full py-4 text-lg font-semibold ${
                  isSubmitting || selectedDocumentIds.length === 0 || (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0 && !debugMode)
                    ? 'opacity-50 cursor-not-allowed' 
                    : 'hover:bg-primary-700'
                }`}
              >
                {isSubmitting 
                  ? 'Generating AI Suggestions...' 
                  : debugMode
                  ? 'Show Debug Info'
                  : aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0
                  ? 'Generation Limit Reached'
                  : '✨ Generate AI Suggestions'
                }
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
