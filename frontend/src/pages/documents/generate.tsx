import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { categoriesAPI, documentsAPI } from "@/utils/api";
import Layout from "@/components/Layout";
import {
  FileCog,
  AlertCircle,
  Check,
  TextSearch,
} from "lucide-react";
import DocumentPreviewList from "@/components/DocumentPreviewList";
import GenerationProgress, {
  GenerationStage,
} from "@/components/GenerationProgress";

export default function GenerateDocument() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [aiGenerationsRemaining, setAiGenerationsRemaining] = useState<number | null>(null);
  const [isLoadingGenerationLimit, setIsLoadingGenerationLimit] = useState(true);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string | undefined>();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>("published");
  const [concept, setConcept] = useState("");
  const [suggestionLength, setSuggestionLength] = useState("medium"); // ✅ Added suggestion length
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("analyzing");

  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        setError("Failed to load categories. Please try again.");
      } finally {
        setIsLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        setIsLoadingGenerationLimit(true);
        const { default: api } = await import('@/utils/api');
        const response = await api.get('/subscriptions/organization/');
        if (response.data && response.data.length > 0) {
          setAiGenerationsRemaining(response.data[0].ai_generations_remaining);
        }
      } catch (err) {
        // ignore
      } finally {
        setIsLoadingGenerationLimit(false);
      }
    };
    if (isAuthenticated) {
      fetchSubscriptionInfo();
    }
  }, [isAuthenticated]);

  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTagInput(e.target.value);
  };

  const handleTagInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !selectedTags.includes(trimmedTag)) {
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSelectedDocumentsChange = (docIds: number[]) => {
    setSelectedDocumentIds(docIds);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);
    setSuccess(undefined);
    setSuggestions(null);
    setSelectedSuggestion(null);
    setDebugData(null);

    setGenerationStage("analyzing");

    // ✅ Improved validation
    if (!concept.trim()) {
      setError("Please enter a concept for your new document.");
      setIsSubmitting(false);
      return;
    }
    if (selectedDocumentIds.length === 0) {
      setError("Please select at least one document to use as a style reference.");
      setIsSubmitting(false);
      return;
    }

    try {
      // ✅ Updated request body with suggestion length, removed style guide
      const requestBody = {
        generation_type: "suggestions",
        concept: concept.trim(),
        selected_document_ids: selectedDocumentIds,
        debug_mode: debugMode,
        suggestion_length: suggestionLength, // ✅ Added suggestion length
      };

      setTimeout(() => setGenerationStage("processing"), 1000);
      setTimeout(() => setGenerationStage("generating"), 2000);

      const response = await documentsAPI.generateDocumentWithAI(requestBody);

      setGenerationStage("formatting");
      const data = response.data;
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (data.suggestions) {
        setSuggestions(data.suggestions);
        setSuccess("Suggestions generated! Click one to use as your document start.");
      } else if (data.debug) {
        setDebugData(data);
        setSuccess("Debug information generated successfully!");
      } else {
        setError("No suggestions returned from the AI.");
      }
    } catch (err: any) {
      // ✅ Improved error handling
      setError(
        err.response?.data?.error || err.message || "Failed to generate suggestions. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSelectSuggestion = (suggestion: string) => {
    setSelectedSuggestion(suggestion);
    setSuccess("Suggestion selected! You can now continue writing your document.");
  };

  return (
    <Layout title="Generate Document with AI">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && (
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {success && (
            <div className="bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 px-4 py-3 rounded mb-6 flex items-start">
              <Check className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>{success}</div>
            </div>
          )}

          {debugData && (
            <div className="bg-white dark:bg-primary-100 border border-primary-200 dark:border-primary-300 rounded-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">Debug Information</h2>
              <pre className="text-sm whitespace-pre-wrap">{JSON.stringify(debugData, null, 2)}</pre>
              <div className="flex space-x-4 mt-4">
                <button
                  type="button"
                  onClick={() => {
                    setDebugData(null);
                    setSuccess(undefined);
                  }}
                  className="btn-primary"
                >
                  Back to Form
                </button>
              </div>
            </div>
          )}

          {isSubmitting ? (
            <GenerationProgress
              stage={generationStage}
              documentLength="medium"
            />
          ) : suggestions ? (
            <div className="bg-primary-100 dark:bg-primary-100 border-4 border-primary-200 rounded-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                AI Suggestions for Starting Your Document
              </h2>
              <ul className="space-y-3">
                {suggestions.map((s, idx) => (
                  <li
                    key={idx}
                    className={`cursor-pointer p-3 rounded border transition ${
                      selectedSuggestion === s
                        ? "bg-success-100 border-success-400"
                        : "bg-white border-primary-200 hover:bg-primary-50"
                    }`}
                    onClick={() => handleSelectSuggestion(s)}
                  >
                    {s}
                  </li>
                ))}
              </ul>
              {selectedSuggestion && (
                <div className="mt-6">
                  <h3 className="text-lg font-semibold mb-2">Selected Start:</h3>
                  <div className="p-4 bg-success-50 border border-success-200 rounded">
                    {selectedSuggestion}
                  </div>
                  <div className="mt-4">
                    <button
                      type="button"
                      className="btn-primary"
                      onClick={() => setSuggestions(null)}
                    >
                      Generate New Suggestions
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white dark:bg-primary-100 border border-primary-50 dark:border-primary-100 rounded-md border-4">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <div className="space-y-2 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
                      <div className="mb-2 justify-center flex flex-col items-center">
                        <h3 className="text-lg font-semibold flex items-center text-primary-600">
                          <FileCog className="h-5 w-5 mr-2" />
                          AI Suggestions Settings
                        </h3>
                        <p className="text-sm text-primary-500">
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
                          placeholder="Describe what you want the AI to write about..."
                          required
                        />
                      </div>

                      {/* ✅ Added suggestion length selector */}
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
                        <p className="mt-1 text-sm text-primary-500">
                          Choose how detailed you want each opening suggestion to be.
                        </p>
                      </div>

                      {selectedDocumentIds.length === 0 && (
                        <p className="mt-1 text-sm text-danger-500">
                          Please select at least one document to use as a style reference.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
                    <div className="mb-2 justify-center flex flex-col items-center">
                      <h3 className="text-lg font-semibold flex items-center text-primary-600">
                        <TextSearch className="h-5 w-5 mr-2" />
                        Style Sources
                      </h3>
                      <p className="text-sm text-primary-500">
                        Filter documents that will influence the AI's writing style:
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="categoryFilter"
                        className="form-label flex items-center"
                      >
                        Category Filter
                      </label>
                      <select
                        id="categoryFilter"
                        name="categoryFilter"
                        value={selectedCategoryFilter}
                        onChange={(e) => setSelectedCategoryFilter(e.target.value)}
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
                      <p className="mt-1 text-sm text-primary-500">
                        Only documents from this category will be used for generation.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="status"
                        className="form-label flex items-center"
                      >
                        Status Filter
                      </label>
                      <select
                        id="status"
                        name="status"
                        value={selectedStatus}
                        onChange={(e) => setSelectedStatus(e.target.value)}
                        className="form-input"
                      >
                        <option value="">All Statuses</option>
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                      <p className="mt-1 text-sm text-primary-500">
                        Only documents with this status will be used for generation.
                      </p>
                    </div>

                    <div>
                      <label
                        htmlFor="tags"
                        className="form-label flex items-center"
                      >
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
                            >
                              <span className="sr-only">Remove tag</span>
                              <svg
                                className="h-2 w-2"
                                stroke="currentColor"
                                fill="none"
                                viewBox="0 0 8 8"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeWidth="1.5"
                                  d="M1 1l6 6m0-6L1 7"
                                />
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
                        <button
                          type="button"
                          className="ml-2 btn-primary flex items-center"
                          onClick={addTag}
                        >
                          <span className="sr-only">Add tag</span>
                          <svg
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </button>
                      </div>
                      <p className="mt-1 text-sm text-primary-500">
                        Only documents with these tags will be used for generation.
                      </p>
                    </div>

                    <div className="mt-6">
                      <DocumentPreviewList
                        tags={selectedTags}
                        categoryFilter={selectedCategoryFilter}
                        status={selectedStatus}
                        onSelectedDocumentsChange={handleSelectedDocumentsChange}
                        selectedDocumentIds={selectedDocumentIds}
                      />
                      {selectedDocumentIds.length === 0 && (
                        <p className="mt-2 text-danger-500 text-sm">
                          Please select at least one document to use as a style reference.
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-start gap-4 p-6">
                    <div className="flex-grow">
                      {!isLoadingGenerationLimit && aiGenerationsRemaining !== null && (
                        <div className="text-hd text-primary-600 mb-4">
                          <span className="font-semibold">AI Generations Remaining:</span> {aiGenerationsRemaining}
                          {aiGenerationsRemaining === 0 && (
                            <div className="mt-1 text-danger-600">
                              You have reached your monthly AI generation limit. 
                              <button 
                                onClick={() => router.push('/subscription')} 
                                className="ml-1 underline font-semibold text-danger-600 hover:text-danger-400"
                              >
                                Upgrade your subscription
                              </button> 
                              {" "}to generate more documents.
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
          )}
        </div>
      </main>
    </Layout>
  );
}
