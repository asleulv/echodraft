import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { categoriesAPI, documentsAPI } from "@/utils/api";
import Layout from "@/components/Layout";
import GenerationProgress, {
  GenerationStage,
} from "@/components/GenerationProgress";
import { CheckCircle, Lightbulb, FileText, Sparkles } from "lucide-react";

// Your existing imports
import AISettingsForm from "./generate/AISettingsForm";
import SuggestionsList from "./generate/SuggestionsList";
import SaveSelectionActions from "./generate/SaveSelectionActions";
import StatusAlerts from "./generate/StatusAlerts";

// New credit-related imports
import CreditDisplay from "./generate/CreditDisplay";
import { useCreditInfo } from "@/hooks/useCreditInfo";
import { getCreditErrorText } from "@/utils/creditErrors";

// Define document type to fix TypeScript errors
interface Document {
  id: number;
  title: string;
  demo_type?: string;
  is_demo?: boolean;
  [key: string]: any;
}

export default function GenerateDocument() {
  // Progressive form stage
  const [formStage, setFormStage] = useState<"concept" | "sources" | "ready">(
    "concept"
  );

  // State declarations (most unchanged)
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | React.ReactNode | undefined>();
  const [success, setSuccess] = useState<string | undefined>();
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // NEW: Track if user came from onboarding
  const [isFromOnboarding, setIsFromOnboarding] = useState(false);

  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | undefined
  >();
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    undefined
  );
  const [concept, setConcept] = useState("");
  const [suggestionLength, setSuggestionLength] = useState("medium");
  const [suggestions, setSuggestions] = useState<string[] | null>(null);
  const [selectedSuggestions, setSelectedSuggestions] = useState<string[]>([]);
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("analyzing");

  // NEW: State for storing original request data for "Generate More" functionality
  const [originalRequestData, setOriginalRequestData] = useState<{
    concept: string;
    style_guide?: string;
    suggestion_length: string;
    selected_document_ids: number[];
    num_suggestions: number;
  }>({
    concept: "",
    suggestion_length: "medium",
    selected_document_ids: [],
    num_suggestions: 5,
  });

  // NEW: Use credit hook instead of subscription state
  const {
    creditInfo,
    isLoading: isLoadingCredits,
    hasCredits,
    refreshCreditInfo,
  } = useCreditInfo();

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // Helper function to create clean, concise titles
  const createTitle = (concept: string) => {
    const trimmed = concept.trim();

    if (trimmed.length <= 40) return trimmed;

    const truncated = trimmed.substring(0, 40);
    const lastSpace = truncated.lastIndexOf(" ");

    return lastSpace > 15 ? truncated.substring(0, lastSpace) : truncated;
  };

  // Helper function to create credit error JSX from utils
  const createCreditErrorJSX = (
    type: "insufficient" | "deduction_failed" | "purchase_required"
  ) => {
    const errorText = getCreditErrorText(type);
    return (
      <div>
        <p className="font-semibold mb-2">{errorText.title}</p>
        <p className="mb-3">{errorText.message}</p>
        <button
          onClick={() => router.push("/subscription")}
          className="bg-secondary-600 text-primary-50 px-4 py-2 rounded hover:bg-secondary-500 transition-colors"
        >
          {errorText.buttonText}
        </button>
      </div>
    );
  };

  // NEW: Enhanced success message component for onboarding users
  const renderSuccessMessage = () => {
    if (isFromOnboarding && formStage === "ready") {
      return (
        <div className="bg-success-50 border border-success-200 rounded-lg p-4 mb-6">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <CheckCircle className="w-6 h-6 text-success-600 mt-1" />
            </div>
            <div className="ml-3">
              <h3 className="text-lg font-medium text-success-800 mb-2 flex items-center">
                <Sparkles className="w-5 h-5 mr-2" />
                Your content is ready!
              </h3>
              <div className="text-sm text-success-700 space-y-1">
                <p className="flex items-center">
                  <CheckCircle className="w-4 h-4 mr-2 text-success-600" />
                  We've generated content in your selected style
                </p>
                <p className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-success-600" />
                  Check the boxes next to paragraphs you like
                </p>
                <p className="flex items-center">
                  <FileText className="w-4 h-4 mr-2 text-success-600" />
                  Click "Save as Document" below to create your draft
                </p>
                <p className="text-success-600 italic flex items-center mt-2">
                  <Lightbulb className="w-4 h-4 mr-2" />
                  Don't worry - you can edit everything after saving!
                </p>
              </div>
            </div>
          </div>
        </div>
      );
    }
    
    // Return null for regular users - StatusAlerts handles normal success
    return null;
  };

  // NEW: Selection status feedback component
  const renderSelectionStatus = () => {
    if (selectedSuggestions.length > 0) {
      const wordCount = selectedSuggestions.join(' ').split(' ').length;
      return (
        <div className="bg-secondary-50 border border-secondary-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-secondary-800 font-medium flex items-center">
              <CheckCircle className="w-4 h-4 mr-2 text-secondary-600" />
              {selectedSuggestions.length} paragraphs selected ({wordCount} words)
            </span>
            <span className="text-secondary-600 text-sm flex items-center">
              Ready to save!
              <FileText className="w-4 h-4 ml-1" />
            </span>
          </div>
        </div>
      );
    }
    return null;
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

  // NEW: Auto-select demo style document from onboarding
  useEffect(() => {
    const { concept: queryConcept, demo_style_slug } = router.query;

    if (queryConcept) {
      setConcept(queryConcept as string);
      setFormStage("sources");
    }

    if (demo_style_slug) {
      setIsFromOnboarding(true);
      
      const findDemoDocument = async () => {
        try {
          const response = await documentsAPI.getDocuments({
            latest_only: true,
            limit: 100,
          });

          const documents: Document[] =
            response.data.results || response.data.documents || [];

          const demoDoc = documents.find(
            (doc: Document) => doc.is_demo && doc.demo_type === demo_style_slug
          );

          if (demoDoc) {
            setSelectedDocumentIds([demoDoc.id]);
          }
        } catch (error) {
          // Handle error silently
        }
      };

      findDemoDocument();
    }
  }, [router.query]);

  // NEW: Auto-trigger generation when demo document is selected from onboarding
  useEffect(() => {
    if (selectedDocumentIds.length > 0 && formStage === "sources" && concept.trim()) {
      const { demo_style_slug } = router.query;
      if (demo_style_slug) {
        setTimeout(() => {
          handleSubmit(new Event("submit") as any);
        }, 100);
      }
    }
  }, [selectedDocumentIds, formStage, concept, router.query]);

  // Tag input handlers (unchanged)
  const handleTagInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setTagInput(e.target.value);
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
  const removeTag = (tagToRemove: string) =>
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  const handleSelectedDocumentsChange = (docIds: number[]) =>
    setSelectedDocumentIds(docIds);

  // Progressive form handlers (unchanged)
  const handleConceptComplete = () => {
    if (concept.trim()) {
      setFormStage("sources");
      setError(undefined);
    }
  };

  const handleSkipStyleSources = async () => {
    if (concept.trim()) {
      setSelectedDocumentIds([]);
      await handleSubmit(new Event("submit") as any);
    }
  };

  const handleEditConcept = () => {
    setFormStage("concept");
    setSuggestions(null);
    setSelectedSuggestions([]);
    setSuccess(undefined);
  };

  // UPDATED: Form submission logic with credit checking
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // NEW: Check credits before submission
    if (!hasCredits) {
      setError(createCreditErrorJSX("insufficient"));
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
        num_suggestions: 5,
      });

      setTimeout(() => setGenerationStage("processing"), 1000);
      setTimeout(() => setGenerationStage("generating"), 2000);

      const response = await documentsAPI.generateDocumentWithAI(requestBody);

      setGenerationStage("formatting");
      const data = response.data;
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (data.suggestions) {
        setSuggestions(data.suggestions);
        
        // Enhanced success message for different user types
        if (isFromOnboarding) {
          // Don't set success here - the enhanced component will handle it
          setSuccess(undefined);
        } else {
          const styleMessage = selectedDocumentIds.length > 0
            ? "Suggestions generated using your style references!"
            : "Suggestions generated! (No specific style applied)";
          setSuccess(`${styleMessage} Select one or more paragraphs to add to your new document.`);
        }
        
        setFormStage("ready");

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
        setError(createCreditErrorJSX("insufficient"));
        await refreshCreditInfo();
      } else {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to generate suggestions. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // UPDATED: Generate More handler with credit check
  const handleGenerateMore = async (count: number) => {
    // NEW: Check credits before generating more
    if (!hasCredits) {
      setError(createCreditErrorJSX("purchase_required"));
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
        setSuggestions((prev) =>
          prev ? [...prev, ...data.suggestions] : data.suggestions
        );
        setSuccess(
          `Generated ${count} more suggestions! Select paragraphs to add to your document.`
        );

        // NEW: Refresh credit info after successful generation
        await refreshCreditInfo();
      } else {
        setError("No additional suggestions returned from the AI.");
      }
    } catch (err: any) {
      // UPDATED: Better error handling for credit issues
      if (err.response?.status === 402) {
        setError(createCreditErrorJSX("purchase_required"));
        await refreshCreditInfo();
      } else {
        setError(
          err.response?.data?.error ||
            err.message ||
            "Failed to generate more suggestions. Please try again."
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Multi-selection handlers (unchanged)
  const toggleSuggestionSelection = (suggestion: string) => {
    setSelectedSuggestions((prev) =>
      prev.includes(suggestion)
        ? prev.filter((s) => s !== suggestion)
        : [...prev, suggestion]
    );
  };
  const handleClearSelection = () => {
    setSelectedSuggestions([]);
    if (!isFromOnboarding) {
      setSuccess(
        "Suggestions generated! Select one or more paragraphs to add to your new document."
      );
    }
  };

  // ENHANCED: Save handler with better feedback
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
      
      // Enhanced saving message for onboarding users
      const savingMessage = isFromOnboarding 
        ? "Creating your document... You'll be able to edit it in the next step!"
        : "Saving document...";
      setSuccess(savingMessage);

      const combinedContent = selectedSuggestions
        .map((p) => `<p>${p.trim()}</p>`)
        .join("\n");

      const documentData = {
        title: createTitle(concept),
        content: combinedContent,
        status: "draft",
        category: selectedCategoryFilter
          ? parseInt(selectedCategoryFilter)
          : null,
        tags: selectedTags,
        organization: (user.organization as any)?.id || user.organization,
        created_by: user.id,
      };

      const response = await documentsAPI.createDocument(documentData);

      if (response.data) {
        // Enhanced success message for different user types
        const successMessage = isFromOnboarding
          ? "Perfect! Your document is saved. You'll be redirected to edit it in 2 seconds..."
          : "Document saved! Redirecting to editor...";
        setSuccess(successMessage);
        
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

          {/* Enhanced Success Message for Onboarding Users */}
          {renderSuccessMessage()}

          {/* Existing Status Alerts - but hidden for onboarding users when suggestions are ready */}
          {!(isFromOnboarding && formStage === "ready") && (
            <StatusAlerts
              error={error}
              success={success}
              debugData={debugData}
              clearDebugData={() => setDebugData(null)}
            />
          )}

          {/* Only show form when not generating and no suggestions yet */}
          {!isSubmitting && formStage !== "ready" && (
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
              isSubmitting={isGenerationDisabled}
              handleSubmit={handleSubmit}
              creditInfo={creditInfo}
              isLoadingCredits={isLoadingCredits}
              hasCredits={hasCredits}
              debugMode={debugMode}
              setDebugMode={setDebugMode}
            />
          )}

          {isSubmitting && (
            <GenerationProgress
              stage={generationStage}
              documentLength="medium"
            />
          )}

          {formStage === "ready" && suggestions && (
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
                hasCredits={hasCredits}
              />

              {/* NEW: Selection status feedback */}
              {renderSelectionStatus()}

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
