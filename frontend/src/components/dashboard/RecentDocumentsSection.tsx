import { Timer, ChevronRight } from "lucide-react";
import { formatDate } from "@/utils/dateUtils";

export default function RecentDocumentsSection({
  documents,
  isLoading,
  error,
  documentLimit,
  setDocumentLimit,
  router,
}: {
  documents: any[];
  isLoading: boolean;
  error: string;
  documentLimit: number;
  setDocumentLimit: (n: number) => void;
  router: any;
}) {
  return (
    <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg sm:p-4 p-2 mb-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-0 sm:mb-4 gap-0">
        <h2 className="text-xl font-light text-primary-500 text-center justify-center sm:text-left flex items-center">
          <Timer className="mr-2 font-light text-primary-500" />
          Recent Documents
        </h2>
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <div className="mb-5 sm:mb-0 sm:flex items-center mr-4 w-full sm:w-auto justify-center">
            <div className="flex items-center space-x-4 sm:space-x-2 justify-center">
              <button
                onClick={() => {
                  const newLimit = documentLimit > 5 ? documentLimit - 5 : documentLimit;
                  setDocumentLimit(newLimit);
                  localStorage.setItem("documentLimit", newLimit.toString());
                }}
                className="text-primary-400 text-lg w-10 h-10 flex items-center justify-center rounded-full border border-primary-300 hover:bg-primary-100"
              >
                -
              </button>
              <span className="text-md text-primary-500">{documentLimit}</span>
              <button
                onClick={() => {
                  const newLimit = documentLimit < 100 ? documentLimit + 5 : documentLimit;
                  setDocumentLimit(newLimit);
                  localStorage.setItem("documentLimit", newLimit.toString());
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
        <p className="text-primary-500 dark:text-primary-600">Loading documents...</p>
      ) : error ? (
        <div className="bg-danger-50 dark:bg-danger-900/30 border border-danger-200 dark:border-danger-800 text-danger-700 dark:text-danger-400 px-4 py-3 rounded">
          {error}
        </div>
      ) : documents.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-secondary-500 dark:text-primary-600">No documents found</p>
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
                  <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500 sm:pl-6">Title</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">Category</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">Status</th>
                  <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">Updated</th>
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
                  borderLeftColor: doc.category_color || "#9CA3AF",
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
  );
}
