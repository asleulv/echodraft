// components/documents/DocumentList.tsx
import React, { useState, useEffect } from "react";
import type { Document } from "@/types/api";
import { formatDate } from "@/utils/dateUtils";
import {
  ChevronRight,
  CircleCheck,
  Pencil,
} from "lucide-react";
import type { NextRouter } from "next/router";

interface DocumentListProps {
  documents: Document[];
  isLoading: boolean;
  error: string;
  totalResults: number;
  searchTerm: string;
  hasActiveFilters: boolean;
  viewMode: "grid" | "list";
  selectedDocuments: number[];
  setSelectedDocuments: (docs: number[] | ((prev: number[]) => number[])) => void;
  onTagClick: (tag: string) => void;
  onCategoryClick: (categoryId: string | null) => void;
  clearFilters: () => void;
  router: NextRouter;
}

export default function DocumentList({
  documents,
  isLoading,
  error,
  totalResults,
  searchTerm,
  hasActiveFilters,
  viewMode,
  selectedDocuments,
  setSelectedDocuments,
  onTagClick,
  onCategoryClick,
  clearFilters,
  router
}: DocumentListProps) {
  const [isMobile, setIsMobile] = useState(false);
  const [showAllTags, setShowAllTags] = useState(false);

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedDocuments(documents.map((doc) => doc.id));
    } else {
      setSelectedDocuments([]);
    }
  };

  const handleDocumentSelect = (docId: number, checked: boolean) => {
    if (checked) {
      setSelectedDocuments((prev) => [...prev, docId]);
    } else {
      setSelectedDocuments((prev) => prev.filter((id) => id !== docId));
    }
  };

  if (error) {
    return (
      <div className="bg-danger-50 border border-danger-200 text-danger-700 px-4 py-3 rounded">
        {error}
      </div>
    );
  }

  if (documents.length === 0 && !isLoading) {
    return (
      <div className="text-center py-8">
        <p className="text-primary-500">
          {hasActiveFilters
            ? "No documents match your filters. Try adjusting your filter criteria."
            : "No documents found"}
        </p>
        {!hasActiveFilters && (
          <button
            onClick={() => router.push("/documents/new")}
            className="mt-4 btn-primary"
          >
            Create a document
          </button>
        )}
        {hasActiveFilters && (
          <button onClick={clearFilters} className="mt-4 btn-primary">
            Clear all filters
          </button>
        )}
      </div>
    );
  }

  const renderDocumentCard = (doc: Document) => (
    <div
      key={doc.id}
      className={`relative border border-primary-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer ${
        selectedDocuments.includes(doc.id)
          ? "bg-primary-200"
          : "bg-white"
      }`}
      style={{
        borderLeftWidth: "4px",
        borderLeftColor: doc.category_color || "#9CA3AF",
      }}
    >
      <div className="absolute top-2 right-2">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer"
            checked={selectedDocuments.includes(doc.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleDocumentSelect(doc.id, e.target.checked);
            }}
          />
          <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 hover:bg-primary-300">
            {selectedDocuments.includes(doc.id) && (
              <CircleCheck className="absolute w-5 h-5 text-primary-600" />
            )}
          </span>
        </label>
      </div>

      <div className="flex items-center mb-2">
        <ChevronRight className="w-5 h-5 text-primary-600 flex-shrink-0 mr-2" />
        <span
          className="document-title font-semibold truncate max-w-[80%] overflow-hidden whitespace-nowrap text-primary-600 cursor-pointer"
          onClick={() => router.push(`/documents/${doc.slug}`)}
        >
          {doc.title}
        </span>
        {doc.version > 1 && (
          <span className="ml-1 px-1 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
            v{doc.version}
          </span>
        )}
      </div>

      <div className="flex items-center justify-between mb-2">
        {doc.category_name ? (
          <span
            className="text-xs px-2 py-0.5 rounded-full whitespace-nowrap flex items-center cursor-pointer hover:bg-primary-400"
            style={{
              backgroundColor: `${doc.category_color}20` || "#9CA3AF20",
              color: doc.category_color || "#9CA3AF",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onCategoryClick(doc.category?.toString() || null);
            }}
          >
            {doc.category_name}
          </span>
        ) : (
          <span
            className="text-xs px-2 py-0.5 rounded-full bg-gray-200 text-gray-600 whitespace-nowrap flex items-center cursor-pointer hover:bg-primary-300"
            onClick={(e) => {
              e.stopPropagation();
              onCategoryClick("null");
            }}
          >
            Uncategorized
          </span>
        )}
        <span className="text-xs text-primary-500">
          {formatDate(doc.updated_at)}
        </span>
      </div>

      {doc.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {doc.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 hover:bg-primary-300 cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {doc.tags.length > 3 && (
            <span className="text-xs text-primary-500">
              +{doc.tags.length - 3} more
            </span>
          )}
        </div>
      )}
    </div>
  );

  const renderTableRow = (doc: Document) => (
    <tr
      key={doc.id}
      className={`transition-colors cursor-pointer ${
        selectedDocuments.includes(doc.id)
          ? "bg-primary-200"
          : "bg-primary-50"
      } hover:bg-primary-100`}
    >
      <td className="relative whitespace-nowrap py-4 pl-4 pr-3 text-sm">
        <label className="flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="hidden"
            checked={selectedDocuments.includes(doc.id)}
            onChange={(e) => {
              e.stopPropagation();
              handleDocumentSelect(doc.id, e.target.checked);
            }}
          />
          <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 hover:bg-primary-300">
            {selectedDocuments.includes(doc.id) && (
              <CircleCheck className="absolute w-5 h-5 text-primary-600" />
            )}
          </span>
        </label>
      </td>

      <td className="whitespace-nowrap py-4 pl-4 pr-3 text-sm">
        <div className="flex items-center">
          <ChevronRight
            className="h-4 w-4 flex-shrink-0 mr-2"
            style={{
              color: doc.category_color ? `${doc.category_color}80` : "#9CA3AF80",
            }}
          />
          <span
            className="document-title font-medium text-primary-600 cursor-pointer hover:text-primary-950 overflow-hidden text-ellipsis whitespace-nowrap max-w-[250px]"
            onClick={() => router.push(`/documents/${doc.slug}`)}
          >
            {doc.title}
          </span>
          {doc.version > 1 && (
            <span className="ml-2 px-1.5 py-0.5 text-xs font-medium bg-primary-200 text-primary-600 rounded">
              v{doc.version}
            </span>
          )}
        </div>
      </td>

      <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
        {doc.category_name ? (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200"
            style={{
              backgroundColor: `${doc.category_color}20` || "#9CA3AF20",
              color: doc.category_color || "#9CA3AF",
            }}
            onClick={(e) => {
              e.stopPropagation();
              onCategoryClick(doc.category?.toString() || null);
            }}
          >
            {doc.category_name}
          </span>
        ) : (
          <span
            className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-200 text-gray-600 hover:bg-primary-300 cursor-pointer"
            onClick={(e) => {
              e.stopPropagation();
              onCategoryClick("null");
            }}
          >
            Uncategorized
          </span>
        )}
      </td>

      <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
        <div className="flex flex-wrap gap-1">
          {doc.tags.slice(0, 5).map((tag) => (
            <span
              key={tag}
              onClick={(e) => {
                e.stopPropagation();
                onTagClick(tag);
              }}
              className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-200 text-primary-700 hover:bg-primary-300 cursor-pointer"
            >
              {tag}
            </span>
          ))}
          {doc.tags.length > 5 && (
            <span className="inline-flex items-center text-xs text-primary-500">
              +{doc.tags.length - 5} more
            </span>
          )}
        </div>
      </td>

      <td className="whitespace-nowrap px-3 py-4 text-sm text-primary-500">
        {formatDate(doc.updated_at)}
      </td>

      <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
        <button
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/documents/${doc.slug}/edit`);
          }}
          className="text-primary-400 hover:text-primary-600 mr-3"
        >
          <Pencil className="h-4 w-4" />
          <span className="sr-only">Edit</span>
        </button>
      </td>
    </tr>
  );

  return (
    <div className="sm:border sm:border-1 sm:border-primary-200 rounded-lg p-1 sm:p-4 mb-6 min-h-[400px]">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 gap-3">
        <h2 className="text-xl font-light text-primary-500 text-center sm:text-left">
          {searchTerm
            ? `Search Results for "${searchTerm}"`
            : hasActiveFilters
            ? "Filtered Documents"
            : "All Documents"}
          <span className="ml-2 text-sm text-primary-400">
            {isLoading ? (
              <span className="opacity-50">Loading...</span>
            ) : (
              `(${totalResults} documents)`
            )}
          </span>
        </h2>
      </div>

      {/* Document Display */}
      {viewMode === "grid" || isMobile ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
          {documents.map(renderDocumentCard)}
        </div>
      ) : (
        <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
          <table className="min-w-full divide-y divide-primary-200">
            <thead className="bg-primary-100">
              <tr>
                <th scope="col" className="relative py-3.5 pl-4 pr-3 w-12">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="hidden"
                      checked={
                        selectedDocuments.length > 0 &&
                        selectedDocuments.length === documents.length
                      }
                      onChange={(e) => handleSelectAll(e.target.checked)}
                    />
                    <span className="relative flex items-center justify-center w-5 h-5 border-2 border-primary-300 rounded-full transition-colors duration-200 bg-primary-200 hover:bg-primary-300">
                      {selectedDocuments.length > 0 &&
                        selectedDocuments.length === documents.length && (
                          <CircleCheck className="absolute w-5 h-5 text-primary-600" />
                        )}
                    </span>
                  </label>
                </th>
                <th className="py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-primary-500">
                  Title
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">
                  Category
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">
                  Tags
                </th>
                <th className="px-3 py-3.5 text-left text-sm font-semibold text-primary-500">
                  Updated
                </th>
                <th className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                  <span className="sr-only">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-primary-200 bg-white">
              {documents.map(renderTableRow)}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}