import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { documentsAPI, categoriesAPI } from "@/utils/api";
import { Document } from "@/types/api";
import Layout from "@/components/Layout";
import { ChevronRight, Grid, List, Timer, SquareLibrary } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";
import { useSystemMessage } from "@/hooks/useSystemMessage";
import SystemMessage from "@/components/SystemMessage";

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
  const [documentLimit, setDocumentLimit] = useState<number>(5); // Default to 5 documents
  const [isLimitLoaded, setIsLimitLoaded] = useState(false); // Track if limit is loaded from localStorage
  const [isViewModeLoaded, setIsViewModeLoaded] = useState(false); // Track if view mode is loaded from localStorage

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

  // Fetch documents
  useEffect(() => {
    const fetchDocuments = async () => {
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

        console.log("Fetching documents with limit:", documentLimit);
        const response = await documentsAPI.getDocuments(params);
        const allDocuments = response.data.results || [];

        // Filter documents based on selected statuses
        let filteredDocuments =
          selectedStatuses.length === 3
            ? allDocuments // If all statuses are selected, show all documents
            : allDocuments.filter((doc: any) =>
                selectedStatuses.includes(doc.status)
              );

        // Apply client-side limit in case the server doesn't respect the limit parameter
        if (filteredDocuments.length > documentLimit) {
          console.log(`Applying client-side limit: ${documentLimit}`);
          filteredDocuments = filteredDocuments.slice(0, documentLimit);
        }

        console.log(
          `Filtered from ${allDocuments.length} to ${filteredDocuments.length} documents`
        );
        setDocuments(filteredDocuments);
      } catch (err: any) {
        setError("Failed to load documents");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDocuments();
  }, [isAuthenticated, selectedStatuses, documentLimit, isLimitLoaded]); // Add isLimitLoaded to dependencies

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
        const documentsData = documentsResponse.data.results || [];

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
        console.error("Failed to load categories and documents:", err);
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
          {/* System Message */}
          {systemMessage && (
            <div className="mb-6">
              <SystemMessage 
                message={systemMessage} 
                onClose={dismissMessage}
              />
            </div>
          )}
          
          {/* Recent Documents Section */}
          <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg sm:p-4 p-2 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-0 sm:mb-4 gap-0">
              <h2 className="text-xl font-light text-primary-500 text-center justify-center sm:text-left flex items-center">
                <Timer className="mr-2 font-light text-primary-500" />
                Recent Documents
              </h2>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                {/* Document Limit Selector */}
                <div className="mb-5 sm:mb-0 sm:flex items-center mr-4 w-full sm:w-auto justify-center">
                  <div className="flex items-center space-x-4 sm:space-x-2 justify-center">
                    <button
                      onClick={() => {
                        const newLimit =
                          documentLimit > 5 ? documentLimit - 5 : documentLimit; // Prevent going below 5
                        setDocumentLimit(newLimit);
                        localStorage.setItem(
                          "documentLimit",
                          newLimit.toString()
                        );
                      }}
                      className="text-primary-400 text-lg w-10 h-10 flex items-center justify-center rounded-full border border-primary-300 hover:bg-primary-100"
                    >
                      -
                    </button>
                    <span className="text-md text-primary-500">
                      {documentLimit}
                    </span>
                    <button
                      onClick={() => {
                        const newLimit =
                          documentLimit < 100
                            ? documentLimit + 5
                            : documentLimit; // Prevent going above 100
                        setDocumentLimit(newLimit);
                        localStorage.setItem(
                          "documentLimit",
                          newLimit.toString()
                        );
                      }}
                      className="text-primary-400 text-lg w-10 h-10 flex items-center justify-center rounded-full border border-primary-300 hover:bg-primary-100"
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <p className="text-primary-500 dark:text-primary-600">
                Loading documents...
              </p>
            ) : error ? (
              <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
                {error}
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-secondary-500 dark:text-primary-600">
                  No documents found
                </p>
                <button
                  onClick={() => router.replace("/documents/new")}
                  className="mt-4 btn-primary"
                >
                  Create a document
                </button>
              </div>
            ) : (
              <>
                {/* Desktop view - Table */}
                <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-primary-200">
                    <thead className="bg-primary-100">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500 sm:pl-6"
                        >
                          Title
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                        >
                          Category
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                        >
                          Status
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                        >
                          Updated
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200 bg-primary-50">
                      {documents.map((doc) => (
                        <tr
                          key={doc.id}
                          className="hover:bg-primary-100 cursor-pointer"
                          onClick={() => router.push(`/documents/${doc.slug}`)}
                        >
                          <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm font-medium text-primary-700 sm:pl-6 hover:text-secondary-700 flex items-center gap-2">
                            <ChevronRight
                              className="w-4 h-4"
                              style={{
                                color: doc.category_color
                                  ? `${doc.category_color}80`
                                  : "#9CA3AF80",
                              }}
                            />
                            <span className="document-title font-md text-primary-600 dark:text-primary-600">
                              {doc.title}
                            </span>
                            {doc.version > 1 && (
                              <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
                                v{doc.version}
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                            {doc.category_name ? (
                              <span
                                className="px-2 py-0.5 rounded-full text-xs whitespace-nowrap flex items-center inline-flex"
                                style={{
                                  backgroundColor:
                                    `${doc.category_color}20` || "#9CA3AF20",
                                  color: doc.category_color || "#9CA3AF",
                                }}
                              >
                                {doc.category_name}
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-xs bg-gray-200 dark:bg-primary-200 text-gray-600 dark:text-primary-400 whitespace-nowrap flex items-center inline-flex">
                                Uncategorized
                              </span>
                            )}
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                            <div className="flex items-center">
                              <span
                                className={`inline-block w-2 h-2 rounded-full ml-4 ${
                                  doc.status === "draft"
                                    ? "bg-yellow-400 dark:bg-yellow-700"
                                    : doc.status === "published"
                                    ? "bg-green-400 dark:bg-green-700"
                                    : doc.status === "archived"
                                    ? "bg-gray-400 dark:bg-gray-600"
                                    : "bg-gray-300 dark:bg-gray-500"
                                }`}
                              />
                            </div>
                          </td>

                          <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                            {formatDate(doc.updated_at)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view - Compact Cards */}
                <div className="md:hidden space-y-2">
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      onClick={() => router.push(`/documents/${doc.slug}`)}
                      className="border border-primary-200 dark:border-primary-200 rounded-lg p-2 cursor-pointer hover:shadow-md dark:hover:shadow-white/10 transition-shadow bg-white dark:bg-primary-100"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: doc.category_color || "#9CA3AF", // Use category color or gray for uncategorized
                      }}
                    >
                      <div className="flex items-center justify-between mb-1 w-full">
                        <div className="flex items-center gap-2 w-full min-w-0">
                          <span
                            className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${
                              doc.status === "draft"
                                ? "bg-yellow-400 dark:bg-yellow-700"
                                : doc.status === "published"
                                ? "bg-green-400 dark:bg-green-700"
                                : doc.status === "archived"
                                ? "bg-gray-400 dark:bg-gray-600"
                                : "bg-gray-300 dark:bg-gray-500"
                            }`}
                          />
                          <span className="document-title font-semibold truncate max-w-[80%] overflow-hidden whitespace-nowrap text-primary-600 dark:text-primary-600">
                            {doc.title}
                            {doc.version > 1 && (
                              <span className="ml-1 px-1 py-0.5 text-xs font-medium bg-primary-300 text-primary-600 rounded">
                                v{doc.version}
                              </span>
                            )}
                          </span>
                        </div>

                        {doc.category_name ? (
                          <span
                            className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex-shrink"
                            style={{
                              backgroundColor:
                                `${doc.category_color}20` || "#9CA3AF20",
                              color: doc.category_color || "#9CA3AF",
                            }}
                          >
                            {doc.category_name}
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-primary-200 text-gray-600 dark:text-primary-400 whitespace-nowrap ml-2 flex-shrink">
                            Uncategorized
                          </span>
                        )}
                      </div>

                      <div className="flex mt-1 text-xs">
                        <span className="text-primary-500 dark:text-primary-400 mr-2 ml-auto">
                          {formatDate(doc.updated_at)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          {/* Categories Section */}
          <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg sm:p-4 p-2 mb-6">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-0 sm:mb-4 gap-3">
              <h2 className="text-xl font-light text-primary-500 text-center justify-center sm:text-left flex items-center">
                <SquareLibrary className="mr-2 text-primary-500" />
                Categories
              </h2>

              {/* View Mode Toggle - Desktop only */}
              <div className="hidden sm:flex items-center space-x-2 self-end sm:self-auto">
                <button
                  onClick={() => {
                    setCategoryViewMode("grid");
                    localStorage.setItem("categoryViewMode", "grid");
                  }}
                  className={`p-1.5 rounded ${
                    categoryViewMode === "grid"
                      ? "bg-primary-300 text-primary-500"
                      : "text-primary-400 hover:bg-primary-100"
                  }`}
                  aria-label="Grid view"
                  title="Grid view"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    setCategoryViewMode("list");
                    localStorage.setItem("categoryViewMode", "list");
                  }}
                  className={`p-1.5 rounded ${
                    categoryViewMode === "list"
                      ? "bg-primary-300 text-primary-500"
                      : "text-primary-400 hover:bg-primary-100"
                  }`}
                  aria-label="List view"
                  title="List view"
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {isLoadingCategories ? (
              <p className="dark:text-primary-300">Loading categories...</p>
            ) : categories.length === 0 ? (
              <div className="text-center py-4">
                <p className="text-primary-500 dark:text-primary-400">
                  No categories found
                </p>
                <button
                  onClick={() => router.replace("/categories")}
                  className="mt-2 btn-secondary text-sm"
                >
                  Create Categories
                </button>
              </div>
            ) : categoryViewMode === "grid" && !isMobile ? (
              <div className="hidden sm:grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {/* Uncategorized category - only show if there are uncategorized documents */}
                {documents.some((doc) => !doc.category_name) && (
                  <div
                    onClick={() => {
                      console.log("Navigating to uncategorized documents");
                      router.push({
                        pathname: "/documents",
                        query: { category: "null" },
                      });
                    }}
                    className="border border-primary-200 dark:border-primary-200 rounded-lg p-2 hover:shadow-md dark:hover:shadow-white/10 transition-shadow cursor-pointer bg-white dark:bg-primary-100"
                    style={{
                      borderLeftWidth: "4px",
                      borderLeftColor: "#9CA3AF", // Gray color for uncategorized
                    }}
                  >
                    <div className="flex items-center mb-2">
                      <span
                        className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex"
                        style={{
                          backgroundColor: "#9CA3AF20",
                          color: "#9CA3AF",
                        }}
                      >
                        Uncategorized
                      </span>
                    </div>

                    {/* Description */}
                    <p className="text-sm text-primary-500 mb-2">
                      Documents without a category
                    </p>

                    {/* Document count - same position as regular categories */}
                    <p className="text-sm text-primary-400">
                      {documents.filter((doc) => !doc.category_name).length}{" "}
                      {documents.filter((doc) => !doc.category_name).length ===
                      1
                        ? "document"
                        : "documents"}
                    </p>
                  </div>
                )}

                {/* Regular categories - only show if they have documents */}
                {categories
                  .filter((category) => category.document_count > 0)
                  .map((category) => (
                    <div
                      key={category.id}
                      onClick={() => {
                        console.log(
                          "Navigating to documents with category:",
                          category.id
                        );
                        router.push({
                          pathname: "/documents",
                          query: { category: String(category.id) },
                        });
                      }}
                      className="border border-primary-200 dark:border-primary-200 rounded-lg p-2 hover:shadow-md dark:hover:shadow-white/10 transition-shadow cursor-pointer bg-white dark:bg-primary-100"
                      style={{
                        borderLeftWidth: "4px",
                        borderLeftColor: category.color || "#2563eb", // Use primary-600 fallback color
                      }}
                    >
                      <div className="flex items-center mb-2">
                        <span
                          className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex"
                          style={{
                            backgroundColor:
                              `${category.color}20` || "#9CA3AF20",
                            color: category.color || "#9CA3AF",
                          }}
                        >
                          {category.name}
                        </span>
                      </div>
                      {category.description && (
                        <p className="text-sm text-primary-500 mb-2">
                          {category.description}
                        </p>
                      )}
                      <p className="text-sm text-primary-400">
                        {category.document_count}{" "}
                        {category.document_count === 1
                          ? "document"
                          : "documents"}
                      </p>
                    </div>
                  ))}
              </div>
            ) : (
              <>
                {/* Desktop view - Table */}
                <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                  <table className="min-w-full divide-y divide-primary-200">
                    <thead className="bg-primary-100">
                      <tr>
                        <th
                          scope="col"
                          className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500 sm:pl-6"
                        >
                          Name
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                        >
                          Description
                        </th>
                        <th
                          scope="col"
                          className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500"
                        >
                          Documents
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-primary-200 bg-primary-50">
                      {/* Uncategorized category - only show if there are uncategorized documents */}
                      {documents.some((doc) => !doc.category_name) && (
                        <tr
                          className="hover:bg-primary-100 cursor-pointer"
                          onClick={() =>
                            router.push({
                              pathname: "/documents",
                              query: { category: "null" },
                            })
                          }
                        >
                          <td className="whitespace-nowrap py-1 pl-4 pr-3 text-sm font-medium text-primary-700 sm:pl-6">
                            <span
                              className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex"
                              style={{
                                backgroundColor: "#9CA3AF20",
                                color: "#9CA3AF",
                              }}
                            >
                              Uncategorized
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                            Documents without a category
                          </td>
                          <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                            {
                              documents.filter((doc) => !doc.category_name)
                                .length
                            }
                          </td>
                        </tr>
                      )}

                      {/* Regular categories - only show if they have documents */}
                      {categories
                        .filter((category) => category.document_count > 0)
                        .map((category) => (
                          <tr
                            key={category.id}
                            className="hover:bg-primary-100 cursor-pointer"
                            onClick={() =>
                              router.push({
                                pathname: "/documents",
                                query: { category: String(category.id) },
                              })
                            }
                          >
                            <td className="whitespace-nowrap py-1 pl-4 pr-3 text-sm font-medium text-primary-700 sm:pl-6">
                              <span
                                className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex"
                                style={{
                                  backgroundColor:
                                    `${category.color}20` || "#9CA3AF20",
                                  color: category.color || "#9CA3AF",
                                }}
                              >
                                {category.name}
                              </span>
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                              {category.description || "-"}
                            </td>
                            <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
                              {category.document_count}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile view - Simple List */}
                <div className="md:hidden space-y-3">
                  {/* Uncategorized category - only show if there are uncategorized documents */}
                  {documents.some((doc) => !doc.category_name) && (
                    <div
                      onClick={() =>
                        router.push({
                          pathname: "/documents",
                          query: { category: "null" },
                        })
                      }
                      className="border border-primary-200 dark:border-primary-200 rounded-lg p-3 cursor-pointer hover:shadow-md dark:hover:shadow-white/10 transition-shadow bg-white dark:bg-primary-100"
                      style={{
                        backgroundColor: "#9CA3AF20",
                        borderLeftWidth: "4px",
                        borderLeftColor: "#9CA3AF", // Gray color for uncategorized
                      }}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span
                          className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex"
                          style={{
                            color: "#9CA3AF",
                          }}
                        >
                          Uncategorized
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-200 dark:bg-primary-200 text-gray-600 dark:text-primary-400 whitespace-nowrap ml-2 flex-shrink-0">
                          {documents.filter((doc) => !doc.category_name).length}{" "}
                          {documents.filter((doc) => !doc.category_name)
                            .length === 1
                            ? "doc"
                            : "docs"}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Regular categories - only show if they have documents */}
                  {categories
                    .filter((category) => category.document_count > 0)
                    .map((category) => (
                      <div
                        key={category.id}
                        onClick={() =>
                          router.push({
                            pathname: "/documents",
                            query: { category: String(category.id) },
                          })
                        }
                        className="border border-primary-200 dark:border-primary-200 rounded-lg p-3 cursor-pointer hover:shadow-md dark:hover:shadow-white/10 transition-shadow"
                        style={{
                          backgroundColor: `${category.color}20` || "#9CA3AF20", // Use the lighter background
                          borderLeftWidth: "4px",
                          borderLeftColor: category.color || "#2563eb", // Keep the solid category color for the border
                        }}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <span
                            className="px-2 py-0.5 rounded-full text-md whitespace-nowrap flex items-center inline-flex"
                            style={{ color: category.color || "#9CA3AF" }} // Keep the category text color
                          >
                            {category.name}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex-shrink-0"
                            style={{ color: category.color || "#2563eb" }} // Keep the category color for doc count text
                          >
                            {category.document_count}{" "}
                            {category.document_count === 1 ? "doc" : "docs"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </Layout>
  );
}
