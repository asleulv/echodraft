import React from "react";
import DocumentPreviewList from "@/components/DocumentPreviewList";
import { FileCog, TextSearch } from "lucide-react";

interface AISettingsFormProps {
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
  return (
    <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md border-4">
      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          <div>
            <div className="space-y-2 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
              <div className="mb-2 justify-center flex flex-col items-center">
                <h3 className="text-lg font-semibold flex items-center text-primary-600 dark:text-primary-600">
                  <FileCog className="h-5 w-5 mr-2" />
                  AI Suggestions Settings
                </h3>
                <p className="text-sm text-primary-500 dark:text-primary-500">
                  Configure what you want the AI to generate:
                </p>
              </div>

              <div>
                <label htmlFor="concept" className="form-label mt-6">
                  Concept *
                </label>
                <textarea
                  id="concept"
                  name="concept"
                  value={concept}
                  onChange={(e) => setConcept(e.target.value)}
                  className="form-input h-32"
                  placeholder="What are you writing about?"
                  required
                />
              </div>

              <div>
                <label htmlFor="suggestionLength" className="form-label">
                  Suggestion Length
                </label>
                <select
                  id="suggestionLength"
                  name="suggestionLength"
                  value={suggestionLength}
                  onChange={(e) => setSuggestionLength(e.target.value)}
                  className="form-input"
                >
                  <option value="short">Short (50-75 words)</option>
                  <option value="medium">Medium (75-125 words)</option>
                  <option value="long">Long (125-200 words)</option>
                  <option value="detailed">Detailed (200-300 words)</option>
                </select>
                <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
                  Choose how detailed you want each opening suggestion to be.
                </p>
              </div>

              {selectedDocumentIds.length === 0 && (
                <p className="mt-1 text-sm text-teal-500">
                  Please select at least one document to use as a style reference.
                </p>
              )}
            </div>
          </div>

          <div className="space-y-6 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
            <div className="mb-2 justify-center flex flex-col items-center">
              <h3 className="text-lg font-semibold flex items-center text-primary-600 dark:text-primary-600">
                <TextSearch className="h-5 w-5 mr-2" />
                Style Sources
              </h3>
              <p className="text-sm text-primary-500 dark:text-primary-500">
                Filter documents that will influence the AI's writing style:
              </p>
            </div>

            <div>
              <label htmlFor="categoryFilter" className="form-label flex items-center">
                Category Filter
              </label>
              <select
                id="categoryFilter"
                name="categoryFilter"
                value={selectedCategoryFilter}
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
              <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
                Only documents from this category will be used for generation.
              </p>
            </div>

            <div>
              <label htmlFor="status" className="form-label flex items-center">
                Status Filter
              </label>
              <select
                id="status"
                name="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value || undefined)}
                className="form-input"
              >
                <option value="">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
                Only documents with this status will be used for generation.
              </p>
            </div>

            <div>
              <label htmlFor="tags" className="form-label flex items-center">
                Tag Filters
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {selectedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/70 dark:text-primary-400"
                  >
                    {tag}
                    <button
                      type="button"
                      className="ml-1.5 inline-flex items-center justify-center h-4 w-4 rounded-full text-primary-400 hover:text-primary-600 dark:text-primary-300 dark:hover:text-primary-100"
                      onClick={() => removeTag(tag)}
                      aria-label={`Remove tag ${tag}`}
                    >
                      <svg
                        className="h-2 w-2"
                        stroke="currentColor"
                        fill="none"
                        viewBox="0 0 8 8"
                      >
                        <path strokeLinecap="round" strokeWidth="1.5" d="M1 1l6 6m0-6L1 7" />
                      </svg>
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex">
                <input
                  id="tags"
                  type="text"
                  className="form-input"
                  value={tagInput}
                  onChange={handleTagInputChange}
                  onKeyDown={handleTagInputKeyDown}
                  placeholder="Add tags (press Enter or comma to add)"
                />
                <button type="button" className="ml-2 btn-primary flex items-center" onClick={addTag}>
                  Add
                </button>
              </div>
              <p className="mt-1 text-sm text-primary-500 dark:text-primary-400">
                Only documents with these tags will be used for generation.
              </p>
            </div>

            <div className="mt-6">
              <DocumentPreviewList
                tags={selectedTags}
                categoryFilter={selectedCategoryFilter}
                status={selectedStatus}
                onSelectedDocumentsChange={onSelectedDocumentsChange}
                selectedDocumentIds={selectedDocumentIds}
              />
              {selectedDocumentIds.length === 0 && (
                <p className="mt-2 text-teal-500 text-sm">Please select at least one document to use as a style reference.</p>
              )}
            </div>
          </div>

          <div className="pt-4 flex flex-col sm:flex-row items-start gap-4 p-6">
            <div className="flex-grow">
              {!isLoadingGenerationLimit && aiGenerationsRemaining !== null && (
                <div className="text-hd text-primary-600 dark:text-primary-400 mb-4">
                  <span className="font-semibold">AI Generations Remaining:</span> {aiGenerationsRemaining}
                  {aiGenerationsRemaining === 0 && (
                    <div className="mt-1 text-danger-600 dark:text-danger-400">
                      You have reached your monthly AI generation limit.
                      <button
                        onClick={() => window.location.assign("/subscription")}
                        className="ml-1 underline font-semibold text-danger-600 hover:text-danger-400 dark:text-danger-400 dark:hover:text-danger-300"
                      >
                        Upgrade your subscription
                      </button>{" "}
                      to generate more documents.
                    </div>
                  )}
                </div>
              )}
            </div>
            <button
              type="submit"
              className="btn-primary w-full sm:w-auto"
              disabled={
                isSubmitting ||
                selectedDocumentIds.length === 0 ||
                (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0 && !debugMode)
              }
            >
              {isSubmitting
                ? "Generating..."
                : debugMode
                ? "Show Prompt"
                : aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0
                ? "Limit Reached"
                : "Generate Suggestions"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
