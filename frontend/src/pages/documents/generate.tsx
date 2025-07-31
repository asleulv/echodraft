import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { categoriesAPI, documentsAPI } from "@/utils/api";
import Layout from "@/components/Layout";
import DocumentPreviewList from "@/components/DocumentPreviewList";
import GenerationProgress, { GenerationStage } from "@/components/GenerationProgress";

import AISettingsForm from "./generate/AISettingsForm";
import SuggestionsList from "./generate/SuggestionsList";
import SaveSelectionActions from "./generate/SaveSelectionActions";
import StatusAlerts from "./generate/StatusAlerts";

export default function GenerateDocument() {
  // Progressive form stage
  const [formStage, setFormStage] = useState<'concept' | 'sources' | 'ready'>('concept');
  
  // State declarations (all your state from original code)
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
  const [suggestionLength, setSuggestionLength] = useState("medium");
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [generationStage, setGenerationStage] = useState<GenerationStage>("analyzing");

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // Effects and handlers: unchanged, just copied from your code
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
        const { default: api } = await import("@/utils/api");
        const response = await api.get("/subscriptions/organization/");
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

  // Tag input handlers
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) => setTagInput(e.target.value);
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
  const removeTag = (tagToRemove: string) => setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  const handleSelectedDocumentsChange = (docIds: number[]) => setSelectedDocumentIds(docIds);

  // Progressive form handlers
  const handleConceptComplete = () => {
    if (concept.trim()) {
      setFormStage('sources');
      setError(undefined); // Clear any previous errors
    }
  };

  // NEW: Allow skipping style sources and generate directly
  const handleSkipStyleSources = async () => {
    if (concept.trim()) {
      // Clear any selected documents since we're skipping
      setSelectedDocumentIds([]);
      // Generate directly without style sources
      await handleSubmit(new Event('submit') as any);
    }
  };

  const handleEditConcept = () => {
    setFormStage('concept');
    setSuggestions(null);
    setSelectedSuggestions([]);
    setSuccess(undefined);
  };

  // Form submission logic - UPDATED to allow empty selectedDocumentIds
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);
    setSuccess(undefined);
    setSuggestions(null);
    setSelectedSuggestions([]);
    setDebugData(null);

    setGenerationStage("analyzing");

    if (!concept.trim()) {
      setError("Please enter a concept for your new document.");
      setIsSubmitting(false);
      return;
    }

    // REMOVED: No longer require selectedDocumentIds to have items
    // if (selectedDocumentIds.length === 0) {
    //   setError("Please select at least one document to use as a style reference.");
    //   setIsSubmitting(false);
    //   return;
    // }

    try {
      const requestBody = {
        generation_type: "suggestions",
        concept: concept.trim(),
        selected_document_ids: selectedDocumentIds, // Can be empty array now
        debug_mode: debugMode,
        suggestion_length: suggestionLength,
      };

      setTimeout(() => setGenerationStage("processing"), 1000);
      setTimeout(() => setGenerationStage("generating"), 2000);

      const response = await documentsAPI.generateDocumentWithAI(requestBody);

      setGenerationStage("formatting");
      const data = response.data;
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (data.suggestions) {
        setSuggestions(data.suggestions);
        const styleMessage = selectedDocumentIds.length > 0 
          ? "Suggestions generated using your style references!" 
          : "Suggestions generated! (No specific style applied)";
        setSuccess(`${styleMessage} Select one or more paragraphs to add to your new document.`);
        setFormStage('ready'); // Move to suggestions stage
      } else if (data.debug) {
        setDebugData(data);
        setSuccess("Debug information generated successfully!");
      } else {
        setError("No suggestions returned from the AI.");
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || "Failed to generate suggestions. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-selection handlers
  const toggleSuggestionSelection = (suggestion: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(suggestion) ? prev.filter((s) => s !== suggestion) : [...prev, suggestion]
    );
  };
  const handleClearSelection = () => {
    setSelectedSuggestions([]);
    setSuccess("Suggestions generated! Select one or more paragraphs to add to your new document.");
  };

  // Save handler
  const handleSaveToDocument = async () => {
    if (selectedSuggestions.length === 0) {
      setError("Please select at least one suggestion to save.");
      return;
    }
    if (!user || !user.id) {
      setError("User not properly authenticated. Please log in again.");
      return;
    }
    if (!user.organization) {
      setError("User organization not found. Please contact support.");
      return;
    }
    try {
      setIsSubmitting(true);
      setSuccess("Saving document...");

      const combinedContent = selectedSuggestions.map((p) => `<p>${p.trim()}</p>`).join("\n");

      const documentData = {
        title: concept.trim().length > 50 ? concept.trim().substring(0, 50) + "..." : concept.trim(),
        content: combinedContent,
        status: "draft",
        category: selectedCategoryFilter ? parseInt(selectedCategoryFilter) : null,
        tags: selectedTags,
        organization: (user.organization as any)?.id || user.organization,
        created_by: user.id,
      };

      const response = await documentsAPI.createDocument(documentData);

      if (response.data) {
        setSuccess("Document saved! Redirecting to editor...");
        setTimeout(() => {
          router.push(`/documents/${response.data.id}`);
        }, 1500);
      }
    } catch (err: any) {
      setError(
        err.response?.data?.error ||
          err.response?.data?.message ||
          err.message ||
          "Failed to save document. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGenerateNew = () => {
    setSuggestions(null);
    setSelectedSuggestions([]);
    setSuccess(undefined);
    setFormStage('concept');
  };

  return (
    <Layout title="Generate Document with AI">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <StatusAlerts error={error} success={success} debugData={debugData} clearDebugData={() => setDebugData(null)} />

          {/* Only show form when not generating and no suggestions yet */}
          {!isSubmitting && formStage !== 'ready' && (
            <AISettingsForm
              stage={formStage}
              onConceptComplete={handleConceptComplete}
              onSkipStyleSources={handleSkipStyleSources} // NEW PROP
              concept={concept}
              setConcept={setConcept}
              suggestionLength={suggestionLength}
              setSuggestionLength={setSuggestionLength}
              selectedTags={selectedTags}
              setSelectedTags={setSelectedTags}
              tagInput={tagInput}
              setTagInput={setTagInput}
              onEditConcept={handleEditConcept}
              handleTagInputChange={handleTagInputChange}
              handleTagInputKeyDown={handleTagInputKeyDown}
              addTag={addTag}
              removeTag={removeTag}
              selectedCategoryFilter={selectedCategoryFilter}
              setSelectedCategoryFilter={setSelectedCategoryFilter}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
              categories={categories}
              isLoadingCategories={isLoadingCategories}
              selectedDocumentIds={selectedDocumentIds}
              onSelectedDocumentsChange={handleSelectedDocumentsChange}
              isSubmitting={isSubmitting}
              handleSubmit={handleSubmit}
              aiGenerationsRemaining={aiGenerationsRemaining}
              isLoadingGenerationLimit={isLoadingGenerationLimit}
              debugMode={debugMode}
              setDebugMode={setDebugMode}
            />
          )}

          {isSubmitting && (
            <GenerationProgress stage={generationStage} documentLength="medium" />
          )}

          {formStage === 'ready' && suggestions && (
            <>
              <button 
                onClick={handleEditConcept} 
                className="btn-secondary mb-4"
              >
                ← Edit Concept & Sources
              </button>
              
              <SuggestionsList
                suggestions={suggestions}
                selectedSuggestions={selectedSuggestions}
                toggleSuggestionSelection={toggleSuggestionSelection}
                handleClearSelection={handleClearSelection}
                handleGenerateNew={handleGenerateNew}
              />

              {selectedSuggestions.length > 0 && (
                <SaveSelectionActions
                  selectedCount={selectedSuggestions.length}
                  handleClearSelection={handleClearSelection}
                  handleSaveToDocument={handleSaveToDocument}
                  isSubmitting={isSubmitting}
                />
              )}
            </>
          )}
        </div>
      </main>
    </Layout>
  );
}
