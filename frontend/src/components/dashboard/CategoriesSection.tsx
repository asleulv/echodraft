import { Grid, List, SquareLibrary } from "lucide-react";

export default function CategoriesSection({
  categories,
  documents,
  isLoadingCategories,
  categoryViewMode,
  setCategoryViewMode,
  isMobile,
  router,
}: {
  categories: any[];
  documents: any[];
  isLoadingCategories: boolean;
  categoryViewMode: "grid" | "list";
  setCategoryViewMode: (mode: "grid" | "list") => void;
  isMobile: boolean;
  router: any;
}) {
  return (
    <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg sm:p-4 p-2 mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-0 sm:mb-4 gap-3">
        <h2 className="text-xl font-light text-primary-500 text-center justify-center sm:text-left flex items-center">
          <SquareLibrary className="mr-2 text-primary-500" />
          Categories
        </h2>
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
          {documents.some((doc) => !doc.category_name) && (
            <div
              onClick={() => {
                router.push({
                  pathname: "/documents",
                  query: { category: "null" },
                });
              }}
              className="border border-primary-200 dark:border-primary-200 rounded-lg p-2 hover:shadow-md dark:hover:shadow-white/10 transition-shadow cursor-pointer bg-white dark:bg-primary-100"
              style={{
                borderLeftWidth: "4px",
                borderLeftColor: "#9CA3AF",
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
              <p className="text-sm text-primary-500 mb-2">
                Documents without a category
              </p>
              <p className="text-sm text-primary-400">
                {documents.filter((doc) => !doc.category_name).length}{" "}
                {documents.filter((doc) => !doc.category_name).length === 1
                  ? "document"
                  : "documents"}
              </p>
            </div>
          )}
          {categories
            .filter((category) => category.document_count > 0)
            .map((category) => (
              <div
                key={category.id}
                onClick={() => {
                  router.push({
                    pathname: "/documents",
                    query: { category: String(category.id) },
                  });
                }}
                className="border border-primary-200 dark:border-primary-200 rounded-lg p-2 hover:shadow-md dark:hover:shadow-white/10 transition-shadow cursor-pointer bg-white dark:bg-primary-100"
                style={{
                  borderLeftWidth: "4px",
                  borderLeftColor: category.color || "#2563eb",
                }}
              >
                <div className="flex items-center mb-2">
                  <span
                    className="px-2 py-0.5 rounded-md text-md whitespace-nowrap flex items-center inline-flex"
                    style={{
                      backgroundColor: `${category.color}20` || "#9CA3AF20",
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
                  {category.document_count === 1 ? "document" : "documents"}
                </p>
              </div>
            ))}
        </div>
      ) : (
        <>
          <div className="hidden md:block overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
            <table className="min-w-full divide-y divide-primary-200">
              <thead className="bg-primary-100">
                <tr>
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500 sm:pl-6">Name</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">Description</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">Documents</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-primary-200 bg-primary-50">
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
                      {documents.filter((doc) => !doc.category_name).length}
                    </td>
                  </tr>
                )}
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
                            backgroundColor: `${category.color}20` || "#9CA3AF20",
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
          <div className="md:hidden space-y-3">
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
                  borderLeftColor: "#9CA3AF",
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
                    {documents.filter((doc) => !doc.category_name).length === 1
                      ? "doc"
                      : "docs"}
                  </span>
                </div>
              </div>
            )}
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
                    backgroundColor: `${category.color}20` || "#9CA3AF20",
                    borderLeftWidth: "4px",
                    borderLeftColor: category.color || "#2563eb",
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="px-2 py-0.5 rounded-full text-md whitespace-nowrap flex items-center inline-flex"
                      style={{ color: category.color || "#9CA3AF" }}
                    >
                      {category.name}
                    </span>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2 flex-shrink-0"
                      style={{ color: category.color || "#2563eb" }}
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
  );
}
