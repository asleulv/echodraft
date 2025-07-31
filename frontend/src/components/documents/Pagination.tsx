// components/documents/Pagination.tsx
import React from "react";

interface PaginationProps {
  currentPage: number;
  totalResults: number;
  hasMoreResults: boolean;
  onPageChange: (page: number) => void;
  pageSize: number;
}

export default function Pagination({
  currentPage,
  totalResults,
  hasMoreResults,
  onPageChange,
  pageSize
}: PaginationProps) {
  const totalPages = Math.ceil(totalResults / pageSize);

  if (totalResults === 0) {
    return null;
  }

  return (
    <div className="mt-6 flex justify-between items-center">
      {currentPage > 1 ? (
        <button
          onClick={() => onPageChange(currentPage - 1)}
          className="px-4 py-2 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors"
        >
          Previous
        </button>
      ) : (
        <div></div>
      )}

      <div className="flex items-center space-x-4">
        <span className="text-primary-600">
          Page {currentPage} of {totalPages}
        </span>
        <span className="text-sm text-primary-500">
          {totalResults} total documents
        </span>
      </div>

      {hasMoreResults ? (
        <button
          onClick={() => onPageChange(currentPage + 1)}
          className="px-4 py-2 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors"
        >
          Next
        </button>
      ) : (
        <div></div>
      )}
    </div>
  );
}