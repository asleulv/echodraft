import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { documentsAPI, categoriesAPI } from "@/utils/api";
import { Document } from "@/types/api";
import Layout from "@/components/Layout";
import { useSystemMessage } from "@/hooks/useSystemMessage";
import SystemMessage from "@/components/SystemMessage";
import RecentDocumentsSection from "@/components/dashboard/RecentDocumentsSection";
import CategoriesSection from "@/components/dashboard/CategoriesSection";
import LiveOnBoardingSection from "@/components/dashboard/LiveOnBoardingSection";

export default function Dashboard() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingCategories, setIsLoadingCategories] = useState(true);
  const [error, setError] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "draft",
    "published",
    "archived",
  ]);
  const [categoryViewMode, setCategoryViewMode] = useState<"grid" | "list">("grid");
  const [isMobile, setIsMobile] = useState(false);
  const [documentLimit, setDocumentLimit] = useState<number>(5);
  const [isLimitLoaded, setIsLimitLoaded] = useState(false);
  const [isViewModeLoaded, setIsViewModeLoaded] = useState(false);
  
  // Add these new state variables for Getting Started functionality
  const [showGettingStarted, setShowGettingStarted] = useState(false);
  const [hasOnlyDemoDocuments, setHasOnlyDemoDocuments] = useState(false);

  // Load saved document limit and category view mode from localStorage
  useEffect(() => {
    // Load document limit
    const savedLimit = localStorage.getItem("documentLimit");
    if (savedLimit) {
      setDocumentLimit(parseInt(savedLimit, 10));
    }
    setIsLimitLoaded(true); // Mark loading as complete regardless of whether a value was found
    
    // Load category view mode
    const savedViewMode = localStorage.getItem("categoryViewMode");
    if (savedViewMode && (savedViewMode === "grid" || savedViewMode === "list")) {
      setCategoryViewMode(savedViewMode as "grid" | "list");
    }
    setIsViewModeLoaded(true); // Mark loading as complete regardless of whether a value was found
  }, []);

  // Check if device is mobile
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };

    // Initial check
    checkIfMobile();

    // Add event listener for window resize
    window.addEventListener("resize", checkIfMobile);

    // Cleanup
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();
  
  // Fetch system message for dashboard
  const { message: systemMessage, dismissMessage } = useSystemMessage('dashboard');

  // Redirect if not authenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // NEW: Handle URL parameter from help button
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const shouldShow = urlParams.get('help');
    
    if (shouldShow === 'true') {
      const dismissed = localStorage.getItem('getting-started-dismissed');
      if (!dismissed) {
        setShowGettingStarted(true);
      }
      // Clean up URL parameter
      router.replace('/dashboard', undefined, { shallow: true });
    }
  }, [router]);

  // Fetch documents (updated to handle demo status)
  useEffect(() => {
    const fetchDocuments = async () => {
      console.log("=== DEBUG INFO ===");
      console.log("Total documents:", documents.length);
      console.log("All documents:", documents);
      console.log("Demo documents:", documents.filter(doc => doc.is_demo));
      console.log("Non-demo documents:", documents.filter(doc => !doc.is_demo));
      console.log("==================");
      if (!isAuthenticated || !isLimitLoaded) return; // Don't fetch until limit is loaded

      try {
        setIsLoading(true);

        // If no statuses are selected, show no documents
        if (selectedStatuses.length === 0) {
          setDocuments([]);
          setIsLoading(false);
          return;
        }

        // Fetch documents with limit
        const params = {
          latest_only: true,
          limit: documentLimit,
        };

        const response = await documentsAPI.getDocuments(params);
        const allDocuments = response.data.results || response.data.documents || [];
        
        // Check if user only has demo documents (from your backend response)
        const hasOnlyDemos = response.data.has_only_demo_documents || false;
        setHasOnlyDemoDocuments(hasOnlyDemos);
        
        // Show getting started if user has only demo documents and hasn't dismissed it
        const dismissed = localStorage.getItem('getting-started-dismissed');
        if (hasOnlyDemos && !dismissed) {
          setShowGettingStarted(true);
        }

        // Filter documents based on selected statuses
        let filteredDocuments =
          selectedStatuses.length === 3
            ? allDocuments // If all statuses are selected, show all documents
            : allDocuments.filter((doc: any) =>
                selectedStatuses.includes(doc.status)
              );

        // Apply client-side limit in case the server doesn't respect the limit parameter
        if (filteredDocuments.length > documentLimit) {
          filteredDocuments = filteredDocuments.slice(0, documentLimit);
        }

        setDocuments(filteredDocuments);
      } catch (err: any) {
        setError("Failed to load documents");
        console.error("Error fetching documents:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, selectedStatuses, documentLimit, isLimitLoaded]);

  // Handle dismissing the getting started section
  const handleDismissGettingStarted = () => {
    setShowGettingStarted(false);
    localStorage.setItem('getting-started-dismissed', 'true');
  };

  // Fetch categories and documents
  useEffect(() => {
    const fetchCategoriesAndDocuments = async () => {
      if (!isAuthenticated) return;

      try {
        setIsLoadingCategories(true);

        // Fetch categories
        const categoriesResponse = await categoriesAPI.getCategories();
        let categoriesData = categoriesResponse.data.results || [];

        // Fetch documents to get the latest update time for each category
        const documentsResponse = await documentsAPI.getDocuments({
          latest_only: true,
          limit: 100, // Get a reasonable number of documents to analyze
        });
        const documentsData = documentsResponse.data.results || documentsResponse.data.documents || [];

        // Create a map of category ID to the latest document update time
        const categoryLastUpdated = new Map<number, string>();

        // Process documents to find the latest update time for each category
        documentsData.forEach((doc: any) => {
          if (doc.category) {
            const categoryId = doc.category;
            const updatedAt = doc.updated_at;

            // If this document is more recent than what we've seen for this category, update the map
            if (
              !categoryLastUpdated.has(categoryId) ||
              updatedAt > categoryLastUpdated.get(categoryId)!
            ) {
              categoryLastUpdated.set(categoryId, updatedAt);
            }
          }
        });

        // Add the last updated time to each category
        categoriesData = categoriesData.map((category: any) => ({
          ...category,
          last_document_update:
            categoryLastUpdated.get(category.id) || category.updated_at,
        }));

        // Sort categories by the last document update time (most recent first)
        categoriesData.sort((a: any, b: any) => {
          const aTime = a.last_document_update || a.updated_at;
          const bTime = b.last_document_update || b.updated_at;
          return new Date(bTime).getTime() - new Date(aTime).getTime();
        });

        setCategories(categoriesData);

        // Set default view mode based on number of categories only if no preference is saved
        if (!localStorage.getItem("categoryViewMode")) {
          const displayedCategories = categoriesData.filter(
            (category: any) => category.document_count > 0
          );
          if (displayedCategories.length > 10) {
            setCategoryViewMode("list");
            localStorage.setItem("categoryViewMode", "list");
          }
        }
      } catch (err: any) {
        console.error("Error fetching categories:", err);
      } finally {
        setIsLoadingCategories(false);
      }
    };

    fetchCategoriesAndDocuments();
  }, [isAuthenticated]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold">Loading...</h2>
        </div>
      </div>
    );
  }

  return (
    <Layout title="Dashboard">
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          {systemMessage && (
            <div className="mb-6">
              <SystemMessage 
                message={systemMessage} 
                onClose={dismissMessage}
              />
            </div>
          )}

          {/* Add Getting Started Section */}
          {showGettingStarted && (
            <LiveOnBoardingSection onDismiss={handleDismissGettingStarted} />
          )}

          <RecentDocumentsSection
            documents={documents.filter(doc => !doc.is_demo)} 
            isLoading={isLoading}
            error={error}
            documentLimit={documentLimit}
            setDocumentLimit={setDocumentLimit}
            router={router}
          />

          <CategoriesSection
            categories={categories}
            documents={documents}
            isLoadingCategories={isLoadingCategories}
            categoryViewMode={categoryViewMode}
            setCategoryViewMode={setCategoryViewMode}
            isMobile={isMobile}
            router={router}
          />
        </div>
      </main>
    </Layout>
  );
}
