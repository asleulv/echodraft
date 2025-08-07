import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { categoriesAPI, documentsAPI } from "@/utils/api";
import Layout from "@/components/Layout";
import GenerationProgress, { GenerationStage } from "@/components/GenerationProgress";

// Your existing imports
import AISettingsForm from "./generate/AISettingsForm";
import SuggestionsList from "./generate/SuggestionsList";
import SaveSelectionActions from "./generate/SaveSelectionActions";
import StatusAlerts from "./generate/StatusAlerts";

// New credit-related imports
import CreditDisplay from "./generate/CreditDisplay";
import { useCreditInfo } from "@/hooks/useCreditInfo";
import { getCreditErrorText } from "@/utils/creditErrors";

export default function GenerateDocument() {
  // Progressive form stage
  const [formStage, setFormStage] = useState<'concept' | 'sources' | 'ready'>('concept');
  
  // State declarations (most unchanged)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  
  // REMOVED: Old subscription state
  // const [aiGenerationsRemaining, setAiGenerationsRemaining] = useState<number | null>(null);
  // const [isLoadingGenerationLimit, setIsLoadingGenerationLimit] = useState(true);
  
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

  // NEW: State for storing original request data for "Generate More" functionality
  const [originalRequestData, setOriginalRequestData] = useState<{
    concept: string;
    style_guide?: string;
    suggestion_length: string;
    selected_document_ids: number[];
    num_suggestions: number;
  }>({
    concept: '',
    suggestion_length: 'medium',
    selected_document_ids: [],
    num_suggestions: 5
  });

  // NEW: Use credit hook instead of subscription state
  const { creditInfo, isLoading: isLoadingCredits, hasCredits, refreshCreditInfo } = useCreditInfo();

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // Helper function to create clean, concise titles
  const createTitle = (concept: string) => {
    const trimmed = concept.trim();
    
    if (trimmed.length <= 40) return trimmed;
    
    const truncated = trimmed.substring(0, 40);
    const lastSpace = truncated.lastIndexOf(' ');
    
    return lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated;
  };

  // Helper function to create credit error JSX from utils
  const createCreditErrorJSX = (type: 'insufficient' | 'deduction_failed' | 'purchase_required') => {
    const errorText = getCreditErrorText(type);
    return (
      <div>
        <p className="font-semibold mb-2">{errorText.title}</p>
        <p className="mb-3">{errorText.message}</p>
        <button
          onClick={() => router.push('/subscription')}
          className="bg-secondary-600 text-white px-4 py-2 rounded hover:bg-secondary-500 transition-colors"
        >
          {errorText.buttonText}
        </button>
      </div>
    );
  };

  // Effects and handlers
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

  // REMOVED: Old subscription fetch effect - replaced with useCreditInfo hook

  // Tag input handlers (unchanged)
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

  // Progressive form handlers (unchanged)
  const handleConceptComplete = () => {
    if (concept.trim()) {
      setFormStage('sources');
      setError(undefined);
    }
  };

  const handleSkipStyleSources = async () => {
    if (concept.trim()) {
      setSelectedDocumentIds([]);
      await handleSubmit(new Event('submit') as any);
    }
  };

  const handleEditConcept = () => {
    setFormStage('concept');
    setSuggestions(null);
    setSelectedSuggestions([]);
    setSuccess(undefined);
  };

  // UPDATED: Form submission logic with credit checking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // NEW: Check credits before submission
    if (!hasCredits) {
      setError(createCreditErrorJSX('insufficient'));
      return;
    }

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

    try {
      const requestBody = {
        generation_type: "suggestions",
        concept: concept.trim(),
        selected_document_ids: selectedDocumentIds,
        debug_mode: debugMode,
        suggestion_length: suggestionLength,
      };

      setOriginalRequestData({
        concept: concept.trim(),
        suggestion_length: suggestionLength,
        selected_document_ids: selectedDocumentIds,
        num_suggestions: 5
      });

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
        setFormStage('ready');
        
        // NEW: Refresh credit info after successful generation
        await refreshCreditInfo();
      } else if (data.debug) {
        setDebugData(data);
        setSuccess("Debug information generated successfully!");
      } else {
        setError("No suggestions returned from the AI.");
      }
    } catch (err: any) {
      // UPDATED: Better error handling for credit issues
      if (err.response?.status === 402) {
        setError(createCreditErrorJSX('insufficient'));
        await refreshCreditInfo();
      } else {
        setError(err.response?.data?.error || err.message || "Failed to generate suggestions. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATED: Generate More handler with credit check
  const handleGenerateMore = async (count: number) => {
    // NEW: Check credits before generating more
    if (!hasCredits) {
      setError(createCreditErrorJSX('purchase_required'));
      return;
    }

    setIsSubmitting(true);
    setError(undefined);
    
    try {
      setGenerationStage("analyzing");
      
      const requestBody = {
        generation_type: "suggestions",
        concept: originalRequestData.concept,
        selected_document_ids: originalRequestData.selected_document_ids,
        debug_mode: debugMode,
        suggestion_length: originalRequestData.suggestion_length,
        num_suggestions: count,
      };

      setTimeout(() => setGenerationStage("processing"), 1000);
      setTimeout(() => setGenerationStage("generating"), 2000);

      const response = await documentsAPI.generateDocumentWithAI(requestBody);
      
      setGenerationStage("formatting");
      const data = response.data;
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (data.suggestions) {
        setSuggestions(prev => prev ? [...prev, ...data.suggestions] : data.suggestions);
        setSuccess(`Generated ${count} more suggestions! Select paragraphs to add to your document.`);
        
        // NEW: Refresh credit info after successful generation
        await refreshCreditInfo();
      } else {
        setError("No additional suggestions returned from the AI.");
      }
    } catch (err: any) {
      // UPDATED: Better error handling for credit issues
      if (err.response?.status === 402) {
        setError(createCreditErrorJSX('purchase_required'));
        await refreshCreditInfo();
      } else {
        setError(err.response?.data?.error || err.message || "Failed to generate more suggestions. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-selection handlers (unchanged)
  const toggleSuggestionSelection = (suggestion: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(suggestion) ? prev.filter((s) => s !== suggestion) : [...prev, suggestion]
    );
  };
  const handleClearSelection = () => {
    setSelectedSuggestions([]);
    setSuccess("Suggestions generated! Select one or more paragraphs to add to your new document.");
  };

  // Save handler (unchanged)
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
        title: createTitle(concept),
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

  // NEW: Calculate if generation should be disabled
  const isGenerationDisabled = !hasCredits || isSubmitting || isLoadingCredits;

  return (
    <Layout title="Generate Document with AI">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {/* NEW: Credit Display Component */}
          <CreditDisplay creditInfo={creditInfo} isLoading={isLoadingCredits} />

          {/* Existing Status Alerts */}
          <StatusAlerts error={error} success={success} debugData={debugData} clearDebugData={() => setDebugData(null)} />

          {/* Only show form when not generating and no suggestions yet */}
          {!isSubmitting && formStage !== 'ready' && (
            <AISettingsForm
              stage={formStage}
              onConceptComplete={handleConceptComplete}
              onSkipStyleSources={handleSkipStyleSources}
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
              isSubmitting={isGenerationDisabled} // UPDATED: Use credit-aware disabled state
              handleSubmit={handleSubmit}
              // UPDATED: Replace subscription props with credit props
              creditInfo={creditInfo}
              isLoadingCredits={isLoadingCredits}
              hasCredits={hasCredits}
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
                onGenerateMore={handleGenerateMore}
                originalRequestData={originalRequestData}
                // NEW: Pass credit info to disable "Generate More" if no credits
                hasCredits={hasCredits}
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
