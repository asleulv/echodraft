// components/documents/SearchBar.tsx
import React, { useRef } from "react";
import { Search, X } from "lucide-react";

interface SearchBarProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  isSearching: boolean;
  clearSearch: () => void;
}

export default function SearchBar({
  searchTerm,
  setSearchTerm,
  isSearching,
  clearSearch
}: SearchBarProps) {
  const searchInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="mb-4">
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          {isSearching ? (
            <div className="animate-spin h-5 w-5 border-2 border-primary-400 border-t-transparent rounded-full"></div>
          ) : (
            <Search className="h-5 w-5 text-primary-400" />
          )}
        </div>
        <input
          ref={searchInputRef}
          type="text"
          className="form-input pl-10 w-full transition-all duration-200 placeholder-primary-400"
          placeholder="Search documents, tags, or content..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        {searchTerm && (
          <div className="absolute inset-y-0 right-0 flex items-center">
            <button
              className="pr-3 flex items-center"
              onClick={() => {
                clearSearch();
                searchInputRef.current?.focus();
              }}
            >
              <X className="h-5 w-5 text-primary-400 hover:text-primary-500" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}