import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { categoriesAPI, documentsAPI } from "@/utils/api";
import Layout from "@/components/Layout";
import {
  AudioLines,
  FileCog,
  AlertCircle,
  Check,
  FileText,
  Files,
  TextSearch,
  Divide,
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
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<
    string | undefined
  >();
  const [selectedDocumentCategory, setSelectedDocumentCategory] = useState<
    string | undefined
  >(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(
    "published"
  );
  const [documentType, setDocumentType] = useState("summary");
  const [generationType, setGenerationType] = useState("existing");
  const [concept, setConcept] = useState("");
  const [documentLength, setDocumentLength] = useState("medium");
  const [title, setTitle] = useState("");
  const [generatedDocument, setGeneratedDocument] = useState<any>(null);
  const [debugMode, setDebugMode] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);
  const [selectedDocumentIds, setSelectedDocumentIds] = useState<number[]>([]);
  const [generationStage, setGenerationStage] =
    useState<GenerationStage>("analyzing");
  const [styleGuide, setStyleGuide] = useState<string | null>(null);
  const [styleConstraintId, setStyleConstraintId] = useState<number | null>(() => {
    // Try to get the style constraint ID from localStorage when the component mounts
    if (typeof window !== 'undefined') {
      const savedId = localStorage.getItem('styleConstraintId');
      if (savedId) {
        console.log("Retrieved style constraint ID from localStorage:", savedId);
        return parseInt(savedId, 10);
      }
    }
    return null;
  });
  const [isAnalyzingStyle, setIsAnalyzingStyle] = useState(false);

  const { isAuthenticated, isLoading: authLoading, user } = useAuth();
  const router = useRouter();

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
        setError("Failed to load categories. Please try again.");
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategories();
  }, []);

  // Fetch user's subscription information to get AI generation limit
  useEffect(() => {
    const fetchSubscriptionInfo = async () => {
      try {
        setIsLoadingGenerationLimit(true);
        // Import the API utility
        const { default: api } = await import('@/utils/api');
        
        // Use the API utility to make the request
        const response = await api.get('/subscriptions/organization/');
        console.log("Subscription info response:", response.data);
        
        if (response.data && response.data.length > 0) {
          const remaining = response.data[0].ai_generations_remaining;
          console.log("AI generations remaining:", remaining);
          setAiGenerationsRemaining(remaining);
        }
      } catch (err) {
        console.error("Failed to fetch subscription information:", err);
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
      console.log("Saved style constraint ID to localStorage:", styleConstraintId);
    }
  }, [styleConstraintId]);

  // No longer need to check for user API key as we're using a global API key

  // Clear style constraint when filters change
  const clearStyleConstraint = () => {
    console.log("Filters changed, clearing style constraint ID");
    setStyleConstraintId(null);
    localStorage.removeItem('styleConstraintId');
    setStyleGuide(null);
  };

  // Handle tag input
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
      // Adding a tag changes the filter criteria, so clear the style constraint
      clearStyleConstraint();
      setSelectedTags([...selectedTags, trimmedTag]);
      setTagInput("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    // Removing a tag changes the filter criteria, so clear the style constraint
    clearStyleConstraint();
    setSelectedTags(selectedTags.filter((tag) => tag !== tagToRemove));
  };

  // Handle selected documents change
  const handleSelectedDocumentsChange = (docIds: number[]) => {
    // If the selected documents change, we need to clear the style constraint ID
    // This ensures that when selecting new documents, we'll perform a fresh analysis
    if (JSON.stringify(docIds) !== JSON.stringify(selectedDocumentIds)) {
      console.log("Selected documents changed, clearing style constraint ID");
      setStyleConstraintId(null);
      localStorage.removeItem('styleConstraintId');
      setStyleGuide(null);
    }
    setSelectedDocumentIds(docIds);
  };

  // Analyze document style for "New Content" mode
  const analyzeDocumentStyle = async () => {
    if (generationType !== 'new') return;
    
    // Validate that documents are selected
    if (selectedDocumentIds.length === 0) {
      setError("Please select at least one document to use as a style reference.");
      return;
    }
    
    // If we already have a style constraint ID, we can skip the analysis
    if (styleConstraintId) {
      console.log("Style constraint already exists with ID:", styleConstraintId);
      setSuccess("Style constraint already exists. Ready to generate content.");
      return;
    }
    
    setIsAnalyzingStyle(true);
    setError(undefined);
    setSuccess(undefined);
    
    try {
      // Start with analyzing stage
      setGenerationStage("analyzing");
      
      // Prepare request body for style analysis - ONLY include selected document IDs
      // Do NOT include tags, category_filter, or status as these will cause the backend
      // to analyze all matching documents instead of just the selected ones
      const requestBody = {
        selected_document_ids: selectedDocumentIds,
        style_constraint_id: styleConstraintId
      };
      
      console.log("Analyzing document style with request body:", requestBody);
      
      // Make the API request for style analysis
      const response = await documentsAPI.analyzeDocumentStyle(requestBody);
      
      // Set the style guide and style constraint ID from the response
      setStyleGuide(response.data.style_guide);
      if (response.data.style_constraint_id) {
        setStyleConstraintId(response.data.style_constraint_id);
      }
      setSuccess("Style analysis complete. Ready to generate content.");
      
    } catch (err: any) {
      console.error("Failed to analyze document style:", err);
      
      // Check for OpenAI API quota exceeded error
      if (
        err.response?.data?.error &&
        (err.response.data.error.includes("quota") ||
          err.response.data.error.includes("exceeded") ||
          err.response.data.error.includes("limit"))
      ) {
        setError(
          "OpenAI API quota exceeded. You have reached your usage limit. " +
            "Please check your OpenAI account for details or try again later. " +
            "You may need to upgrade your plan or wait until your quota resets."
        );
      } else {
        setError(
          err.message || "Failed to analyze document style. Please try again."
        );
      }
    } finally {
      setIsAnalyzingStyle(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(undefined);
    setSuccess(undefined);
    setGeneratedDocument(null);
    setDebugData(null);

    // Start with analyzing stage
    setGenerationStage("analyzing");

    // Validate inputs
    if (generationType === "new" && !concept.trim()) {
      setError("Please enter a concept for your new document.");
      setIsSubmitting(false);
      return;
    }

    // Validate that documents are selected for new content generation
    if (generationType === "new" && selectedDocumentIds.length === 0) {
      setError("Please select at least one document to use as a style reference.");
      setIsSubmitting(false);
      return;
    }

    try {
      // For "New Content" mode, automatically analyze style first if not already done
      if (generationType === "new" && !styleGuide && !styleConstraintId && selectedDocumentIds.length > 0) {
        try {
          // Prepare request body for style analysis - ONLY include selected document IDs
          // Do NOT include tags, category_filter, or status as these will cause the backend
          // to analyze all matching documents instead of just the selected ones
          const styleAnalysisRequestBody = {
            selected_document_ids: selectedDocumentIds
          };
          
          // Make the API request for style analysis
          const styleResponse = await documentsAPI.analyzeDocumentStyle(styleAnalysisRequestBody);
          
          // Set the style guide and style constraint ID from the response
          setStyleGuide(styleResponse.data.style_guide);
          if (styleResponse.data.style_constraint_id) {
            setStyleConstraintId(styleResponse.data.style_constraint_id);
          }
        } catch (styleErr: any) {
          console.error("Failed to analyze document style:", styleErr);
          
          // Check for OpenAI API quota exceeded error
          if (
            styleErr.response?.data?.error &&
            (styleErr.response.data.error.includes("quota") ||
              styleErr.response.data.error.includes("exceeded") ||
              styleErr.response.data.error.includes("limit"))
          ) {
            setError(
              "OpenAI API quota exceeded. You have reached your usage limit. " +
                "Please check your OpenAI account for details or try again later. " +
                "You may need to upgrade your plan or wait until your quota resets."
            );
          } else {
            setError(
              styleErr.message || "Failed to analyze document style. Please try again."
            );
          }
          setIsSubmitting(false);
          return;
        }
      }

      // Prepare request body based on generation type
      const requestBody = {
        tags: selectedTags,
        category_filter: selectedCategoryFilter,
        document_category: selectedDocumentCategory,
        status: selectedStatus,
        title:
          title ||
          (generationType === "new"
            ? "AI Generated Content"
            : `AI Generated ${
                documentType.charAt(0).toUpperCase() + documentType.slice(1)
              }`),
        generation_type: generationType,
        document_length: documentLength,
        debug_mode: debugMode,
        selected_document_ids:
          selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined,
      };

      // Add document_type for existing content or concept for new content
      if (generationType === "existing") {
        Object.assign(requestBody, { document_type: documentType });
      } else {
        // For new content, add concept and selected document IDs to ensure we have the same documents
        // for style reference as we did during style analysis
        Object.assign(requestBody, { 
          concept,
          style_guide: styleGuide,
          style_constraint_id: styleConstraintId,
          selected_document_ids: selectedDocumentIds.length > 0 ? selectedDocumentIds : undefined
        });
        
        // Log the style constraint ID being sent to the backend
        console.log("DOCUMENT GENERATION - Sending style constraint ID to backend:", styleConstraintId);
        console.log("DOCUMENT GENERATION - Selected document IDs:", selectedDocumentIds);
      }

      // Final validation check before API call - ensure we still have documents selected
      if (generationType === "new" && (!selectedDocumentIds || selectedDocumentIds.length === 0)) {
        setError("Please select at least one document to use as a style reference.");
        setIsSubmitting(false);
        return;
      }

      // Move to processing stage after a short delay
      setTimeout(() => setGenerationStage("processing"), 2000);

      // Move to generating stage after another delay
      setTimeout(() => setGenerationStage("generating"), 5000);

      // Make the API request using the API utility
      const response = await documentsAPI.generateDocumentWithAI(requestBody);

      // Move to formatting stage
      setGenerationStage("formatting");

      const data = response.data;

      // Short delay before completing
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Check if this is debug data or a generated document
      if (data.debug) {
        setDebugData(data);
        setSuccess("Prompt generated successfully!");
      } else {
        // Instead of showing the success screen, redirect directly to the document
        if (data.slug) {
          // Redirect to the document page with a query parameter to indicate it was just generated
          router.push(`/documents/${data.slug}?generated=true`);
        } else {
          // Fallback in case slug is not available
          setGeneratedDocument(data);
          setSuccess("Document generated successfully!");
        }
      }
    } catch (err: any) {
      console.error("Failed to generate document:", err);

      // Check for subscription limit reached error
      if (err.response?.data?.limit_reached) {
        const { current_plan, upgrade_options } = err.response.data;
        setError(
          <div>
            <p>You have reached your monthly AI generation limit for the {current_plan} plan.</p>
            <p className="mt-2">Please upgrade your subscription to generate more AI documents:</p>
            <div className="mt-4 flex flex-col sm:flex-row gap-3">
              {upgrade_options && Object.keys(upgrade_options).map(plan => (
                <button 
                  key={plan}
                  onClick={() => router.push('/subscription')}
                  className="inline-block px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 transition-colors"
                >
                  Upgrade to {upgrade_options[plan].name} 
                  ({upgrade_options[plan].limit} generations for ${upgrade_options[plan].price}/month)
                </button>
              ))}
            </div>
          </div>
        );
      }
      // Check for OpenAI API quota exceeded error
      else if (
        err.response?.data?.error &&
        (err.response.data.error.includes("quota") ||
          err.response.data.error.includes("exceeded") ||
          err.response.data.error.includes("limit"))
      ) {
        setError(
          <div>
            <p>OpenAI API quota exceeded. You have reached your usage limit.</p>
            <p className="mt-2">Please try again later. This error <strong>has not</strong> counted against your monthly generation limit.</p>
          </div>
        );
      }
      // Check for timeout errors
      else if (
        err.message?.includes("timeout") ||
        err.message?.includes("timed out") ||
        err.response?.data?.error?.includes("timeout")
      ) {
        setError(
          <div>
            <p>The request timed out while generating your document.</p>
            <p className="mt-2">This may be due to high server load or a complex request. This error <strong>has not</strong> counted against your monthly generation limit.</p>
            <p className="mt-2">Please try again with a shorter document length or simpler concept.</p>
          </div>
        );
      }
      // Check for network errors
      else if (err.message?.includes("Network Error") || !err.response) {
        setError(
          <div>
            <p>Network error occurred while connecting to the server.</p>
            <p className="mt-2">Please check your internet connection and try again. This error <strong>has not</strong> counted against your monthly generation limit.</p>
          </div>
        );
      }
      // Handle other API errors
      else if (err.response?.data?.error) {
        setError(
          <div>
            <p>Error: {err.response.data.error}</p>
            <p className="mt-2">This error <strong>has not</strong> counted against your monthly generation limit.</p>
          </div>
        );
      }
      // Fallback for any other errors
      else {
        setError(
          <div>
            <p>An unexpected error occurred: {err.message || "Unknown error"}</p>
            <p className="mt-2">This error <strong>has not</strong> counted against your monthly generation limit.</p>
            <p className="mt-2">Please try again or contact support if the problem persists.</p>
          </div>
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Navigate to the generated document
  const viewGeneratedDocument = () => {
    if (generatedDocument && generatedDocument.slug) {
      router.push(`/documents/${generatedDocument.slug}`);
    }
  };

  // Get the appropriate title and description for the filter section based on generation type
  const getFilterSectionTitle = () => {
    if (generationType === "new") {
      return "Style Reference";
    } else {
      return "Source Selection";
    }
  };

  // Get the appropriate description for the filter section based on generation type
  const getFilterSectionDescription = () => {
    if (generationType === "new") {
      return "Filter documents that will influence the AI's writing style:";
    } else {
      return "Select documents to summarize, analyze, or compare:";
    }
  };

  // Get the appropriate icon for the filter section based on generation type
  const getFilterSectionIcon = () => {
    if (generationType === "new") {
      return <AudioLines className="h-5 w-5 mr-2" />;
    } else {
      return <Files className="h-5 w-5 mr-2" />;
    }
  };

  // Get the appropriate title for the document preview section based on generation type
  const getPreviewSectionTitle = () => {
    if (generationType === "new") {
      return "Style Sources";
    } else {
      return "Document Sources";
    }
  };

  // Get the appropriate description for the document preview section based on generation type
  const getPreviewSectionDescription = () => {
    if (generationType === "new") {
      return "Filter documents that will influence the AI's writing style:";
    } else {
      return "Select documents to be processed by the AI:";
    }
  };

  // Get the appropriate icon for the document preview section based on generation type
  const getPreviewSectionIcon = () => {
    if (generationType === "new") {
      return <TextSearch className="h-5 w-5 mr-2" />;
    } else {
      return <FileText className="h-5 w-5 mr-2" />;
    }
  };

  return (
    <Layout title="Generate Document with AI">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {error && typeof error === 'string' && !error.includes("API key") && (
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>{error}</div>
            </div>
          )}

          {error && typeof error === 'string' && error.includes("API key") && (
            <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded mb-6 flex items-start">
              <AlertCircle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
              <div>
                <p>{error}</p>
                <button
                  onClick={() => router.push("/profile")}
                  className="mt-2 text-primary-600 hover:text-primary-500 dark:text-primary-400 dark:hover:text-primary-300 underline"
                >
                  Go to Profile Settings
                </button>
              </div>
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

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">System Message</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-60">
                  <pre className="text-sm whitespace-pre-wrap">
                    {debugData.system_message}
                  </pre>
                </div>
              </div>

              <div className="mb-6">
                <h3 className="text-lg font-medium mb-2">User Prompt</h3>
                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-md overflow-auto max-h-96">
                  <pre className="text-sm whitespace-pre-wrap">
                    {debugData.prompt}
                  </pre>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div>
                  <h3 className="text-md font-medium mb-2">Model</h3>
                  <p className="text-primary-600 dark:text-primary-400">
                    {debugData.model}
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Max Tokens</h3>
                  <p className="text-primary-600 dark:text-primary-400">
                    {debugData.max_tokens}
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">Document Count</h3>
                  <p className="text-primary-600 dark:text-primary-400">
                    {debugData.document_count}
                  </p>
                </div>
                <div>
                  <h3 className="text-md font-medium mb-2">
                    Combined Content Length
                  </h3>
                  <p className="text-primary-600 dark:text-primary-400">
                    {debugData.combined_content_length} characters
                  </p>
                </div>
              </div>

              {debugData.document_titles &&
                debugData.document_titles.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-lg font-medium mb-2">Documents Used</h3>
                    <ul className="list-disc pl-5">
                      {debugData.document_titles.map(
                        (title: string, index: number) => (
                          <li
                            key={index}
                            className="text-primary-600 dark:text-primary-400"
                          >
                            {title}
                          </li>
                        )
                      )}
                    </ul>
                  </div>
                )}

              <div className="flex space-x-4">
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
              documentLength={documentLength}
            />
          ) : generatedDocument ? (
            <div className="bg-primary-100 dark:bg-primary-100 border-4 border-primary-200 rounded-md p-6 mb-6">
              <h2 className="text-xl font-semibold mb-4">
                Document Generated Successfully
              </h2>
              <div className="mb-4">
                <p className="text-primary-600 dark:text-primary-400 mb-2">
                  Title: {generatedDocument.title}
                </p>
                <p className="text-primary-600 dark:text-primary-400 mb-2">
                  Status: {generatedDocument.status}
                </p>
                {generatedDocument.category && (
                  <p className="text-primary-600 dark:text-primary-400 mb-2">
                    Category: {generatedDocument.category.name}
                  </p>
                )}
                {generatedDocument.tags &&
                  generatedDocument.tags.length > 0 && (
                    <div className="mb-2">
                      <span className="text-primary-600 dark:text-primary-400">
                        Tags:{" "}
                      </span>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {generatedDocument.tags.map((tag: string) => (
                          <span
                            key={tag}
                            className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800 dark:bg-primary-900/70 dark:text-primary-400"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
              </div>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={viewGeneratedDocument}
                  className="btn-primary"
                >
                  View Document
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setGeneratedDocument(null);
                    setSuccess(undefined);
                  }}
                  className="btn-primary"
                >
                  Generate Another
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-white dark:bg-primary-100 border border-primary-50 dark:border-primary-100 rounded-md border-4">
              <form onSubmit={handleSubmit}>
                <div className="space-y-6">
                  <div>
                    <div className="space-y-2 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
                      {/* Header with clear explanation */}
                      <div className="mb-2 justify-center flex flex-col items-center">
                        <h3 className="text-lg font-semibold flex items-center text-primary-600">
                          <FileCog className="h-5 w-5 mr-2" />
                          New document settings
                        </h3>
                        <p className="text-sm text-primary-500">
                          Filter documents that will influence the AI's writing
                          style:
                        </p>
                      </div>

                      <div>
                        <ul className="grid w-full gap-4 sm:grid-cols-2 mb-10">
                          <li>
                            <input
                              type="radio"
                              id="gen-existing"
                              name="generationType"
                              value="existing"
                              checked={generationType === "existing"}
                              onChange={() => {
                                // Clear style constraint when generation type changes
                                clearStyleConstraint();
                                setGenerationType("existing");
                              }}
                              className="hidden peer"
                            />
                            <label
                              htmlFor="gen-existing"
                              className="inline-flex items-center justify-between w-full p-5 text-primary-400 dark:text-primary-500 bg-primary-100 border border-primary-200 rounded-lg cursor-pointer 
                                        peer-checked:border-primary-600 peer-checked:text-primary-800 hover:text-primary-600 hover:bg-primary-200"
                            >
                              <div className="block">
                                <div className="text-lg font-semibold">
                                  Existing Content
                                </div>
                                <div>Based on uploaded or past documents</div>
                              </div>
                            </label>
                          </li>
                          <li>
                            <input
                              type="radio"
                              id="gen-new"
                              name="generationType"
                              value="new"
                              checked={generationType === "new"}
                              onChange={() => {
                                // Clear style constraint when generation type changes
                                clearStyleConstraint();
                                setGenerationType("new");
                              }}
                              className="hidden peer"
                            />
                            <label
                              htmlFor="gen-new"
                              className="inline-flex items-center justify-between w-full p-5 text-primary-400 dark:text-primary-500 bg-primary-100 border border-primary-200 rounded-lg cursor-pointer 
                                        peer-checked:border-primary-600 peer-checked:text-primary-800 hover:text-primary-600 hover:bg-primary-200"
                            >
                              <div className="block">
                                <div className="text-lg font-semibold">
                                  New Content
                                </div>
                                <div>Create something from scratch</div>
                              </div>
                            </label>
                          </li>
                        </ul>
                      </div>

                      <div className="mt-1">
                        <label
                          htmlFor="documentType"
                          className="form-label flex items-center"
                        >
                          New Document Title
                        </label>
                        <input
                          type="text"
                          id="title"
                          name="title"
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          className="form-input w-full"
                          placeholder="If empty AI will set a title"
                        />
                      </div>

                      <div>
                        <label
                          htmlFor="documentCategory"
                          className="form-label flex items-center mt-5"
                        >
                          New Document Category
                        </label>
                        <select
                          id="documentCategory"
                          name="documentCategory"
                          value={selectedDocumentCategory}
                          onChange={(e) =>
                            setSelectedDocumentCategory(e.target.value)
                          }
                          className="form-input"
                          disabled={isLoadingCategories}
                        >
                          <option value="">Uncategorized</option>
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label
                          htmlFor="documentLength"
                          className="form-label flex items-center mt-6"
                        >
                          New Document Length
                        </label>
                        <select
                          id="documentLength"
                          name="documentLength"
                          value={documentLength}
                          onChange={(e) => setDocumentLength(e.target.value)}
                          className="form-input"
                        >
                          <option value="micro">
                            Micro (50-160 characters)
                          </option>
                          <option value="very_short">
                            Very Short (150-400 words)
                          </option>
                          <option value="short">Short (500-750 words)</option>
                          <option value="medium">
                            Medium (750-1500 words)
                          </option>
                          <option value="long">Long (1500-3000 words)</option>
                          <option value="very_long">
                            Very Long (3000+ words)
                          </option>
                        </select>
                      </div>

                      {generationType === "new" && (
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
                            placeholder="Describe what you want the AI to write about. The
                            style will be based on the filtered documents."
                          />
                          <div className="mt-4">
                            <p className="text-sm text-primary-500">
                              Style will be automatically analyzed when you generate the document.
                            </p>
                            {styleGuide && (
                              <div className="mt-2 p-2 bg-success-50 dark:bg-success-900/30 border border-success-200 dark:border-success-800 text-success-700 dark:text-success-400 rounded">
                                <p className="text-sm">Style analysis complete! The AI will use this style guide when generating your content.</p>
                              </div>
                            )}
                            {selectedDocumentIds.length === 0 && (
                              <p className="mt-1 text-sm text-danger-500">
                                Please select at least one document below to use as a style reference.
                              </p>
                            )}
                          </div>
                        </div>
                      )}

                      {generationType === "existing" && (
                        <div>
                          <label
                            htmlFor="documentType"
                            className="form-label flex items-center mt-6"
                          >
                            Document Type
                          </label>
                          <select
                            id="documentType"
                            name="documentType"
                            value={documentType}
                            onChange={(e) => setDocumentType(e.target.value)}
                            className="form-input"
                          >
                            <option value="summary">Summary</option>
                            <option value="analysis">Analysis</option>
                            <option value="comparison">Comparison</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-6 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
                    {/* Header with clear explanation */}
                    <div className="mb-2 justify-center flex flex-col items-center">
                      <h3 className="text-lg font-semibold flex items-center text-primary-600">
                        {getFilterSectionIcon()}
                        {getFilterSectionTitle()}
                      </h3>
                      <p className="text-sm text-primary-500">
                        {getFilterSectionDescription()}
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
                          // Clear style constraint when category filter changes
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
                        Only documents from this category will be used for
                        generation.
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
                          // Clear style constraint when status filter changes
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
                        Only documents with this status will be used for
                        generation.
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
                        Only documents with these tags will be used for
                        generation.
                      </p>
                    </div>
                  </div>

                  {/* Document Preview Section */}
                  <div className="space-y-6 p-4 bg-primary-50/50 dark:bg-primary-900/20 rounded-xl border border-primary-200 dark:border-primary-500">
                    <div className="flex justify-center items-center pt-2">
                      <div className="justify-center flex flex-col items-center">
                        <h3 className="text-lg font-semibold flex items-center text-primary-600">
                          {getPreviewSectionIcon()}
                          {getPreviewSectionTitle()}
                        </h3>
                        <p className="text-sm text-primary-500">
                          {getPreviewSectionDescription()}
                        </p>
                      </div>
                    </div>
                    <div>
                      {/* Document Preview List */}
                      <DocumentPreviewList
                        tags={selectedTags}
                        categoryFilter={selectedCategoryFilter}
                        status={selectedStatus}
                        onSelectedDocumentsChange={
                          handleSelectedDocumentsChange
                        }
                      />
                    </div>
                  </div>

                  <div className="pt-4 flex flex-col sm:flex-row items-start gap-4 p-6">
                    <div className="flex-grow">
                      
                      
                      {/* Display AI generation limit */}
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
                        (generationType === "new" && selectedDocumentIds.length === 0) ||
                        (aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0 && !debugMode)
                      }
                    >
                      {isSubmitting
                        ? "Generating..."
                        : debugMode
                        ? "Show Prompt"
                        : aiGenerationsRemaining !== null && aiGenerationsRemaining <= 0
                        ? "Limit Reached"
                        : "Generate Document"}
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
