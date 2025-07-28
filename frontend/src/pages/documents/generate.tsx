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
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [selectedSuggestion, setSelectedSuggestion] = useState<string | null>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("analyzing");
  const [styleGuide, setStyleGuide] = useState<string | null>(null);
  const [styleConstraintId, setStyleConstraintId] = useState<number | null>(() => {
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('styleConstraintId');
      if (savedId) {
        return parseInt(savedId, 10);
      }
    }
    return null;
  });
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
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

  useEffect(() => {
    if (styleConstraintId !== null) {
      localStorage.setItem('styleConstraintId', styleConstraintId.toString());
    }
  }, [styleConstraintId]);

  const clearStyleConstraint = () => {
    setStyleConstraintId(null);
    localStorage.removeItem('styleConstraintId');
    setStyleGuide(null);
  };

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
      clearStyleConstraint();
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    clearStyleConstraint();
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  const handleSelectedDocumentsChange = (docIds: number[]) => {
    if (JSON.stringify(docIds) !== JSON.stringify(selectedDocumentIds)) {
      setStyleConstraintId(null);
      localStorage.removeItem('styleConstraintId');
      setStyleGuide(null);
    }
    setSelectedDocumentIds(docIds);
  };

  const analyzeDocumentStyle = async () => {
    if (selectedDocumentIds.length === 0) {
      setError("Please select at least one document to use as a style reference.");
      return;
    }
    if (styleConstraintId) {
      setSuccess("Style constraint already exists. Ready to generate content.");
      return;
    }
    setIsAnalyzingStyle(true);
    setError(undefined);
    setSuccess(undefined);

    try {
      setGenerationStage("analyzing");
      const requestBody = {
        selected_document_ids: selectedDocumentIds,
        style_constraint_id: styleConstraintId
      };
      const response = await documentsAPI.analyzeDocumentStyle(requestBody);
      setStyleGuide(response.data.style_guide);
      if (response.data.style_constraint_id) {
        setStyleConstraintId(response.data.style_constraint_id);
      }
      setSuccess("Style analysis complete. Ready to generate content.");
    } catch (err: any) {
      setError(
        err.message || "Failed to analyze document style. Please try again."
      );
    } finally {
      setIsAnalyzingStyle(false);
    }
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
      if (!styleGuide && !styleConstraintId && selectedDocumentIds.length > 0) {
        try {
          const styleAnalysisRequestBody = {
            selected_document_ids: selectedDocumentIds
          };
          const styleResponse = await documentsAPI.analyzeDocumentStyle(styleAnalysisRequestBody);
          setStyleGuide(styleResponse.data.style_guide);
          if (styleResponse.data.style_constraint_id) {
            setStyleConstraintId(styleResponse.data.style_constraint_id);
          }
        } catch (styleErr: any) {
          setError(
            styleErr.message || "Failed to analyze document style. Please try again."
          );
          setIsSubmitting(false);
          return;
        }
      }

      const requestBody = {
        tags: selectedTags,
        category_filter: selectedCategoryFilter,
        status: selectedStatus,
        generation_type: "suggestions",
        debug_mode: debugMode,
        selected_document_ids: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
        concept,
        style_guide: styleGuide ?? undefined,
        style_constraint_id: styleConstraintId,
      };

      if (!selectedDocumentIds || selectedDocumentIds.length === 0) {
        setError("Please select at least one document to use as a style reference.");
        setIsSubmitting(false);
        return;
      }

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
        setSuccess("Prompt generated successfully!");
      } else {
        setError("No suggestions returned from the AI.");
      }
    } catch (err: any) {
      setError(
        err.message || "Failed to generate suggestions. Please try again."
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
                          Filter documents that will influence the AI's writing style:
                        </p>
                      </div>
                      <div>
                        <label htmlFor="concept" className="form-label mt-6">
                          Concept
                        </label>
                        <textarea
                          id="concept"
                          name="concept"
                          value={concept}
                          onChange={(e) => setConcept(e.target.value)}
                          className="form-input h-32"
                          placeholder="Describe what you want the AI to write about. The style will be based on the filtered documents."
                        />
                        <div className="mt-4">
                          <p className="text-sm text-primary-500">
                            Style will be automatically analyzed when you generate suggestions.
                          </p>
                          {styleGuide && (
                            <div className="mt-2 p-2 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 rounded">
                              <p className="text-sm">Style analysis complete! The AI will use this style guide when generating your suggestions.</p>
                            </div>
                          )}
                          {selectedDocumentIds.length === 0 && (
                            <p className="mt-1 text-sm text-danger-500">
                              Please select at least one document below to use as a style reference.
                            </p>
                          )}
                        </div>
                      </div>
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
                        onChange={(e) => {
                          clearStyleConstraint();
                          setSelectedCategoryFilter(e.target.value);
                        }}
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
                        onChange={(e) => {
                          clearStyleConstraint();
                          setSelectedStatus(e.target.value);
                        }}
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
