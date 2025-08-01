// components/documents/FilterPanel.tsx
import React, { useState } from "react";
import { Filter, ChevronDown, X, Grid, List } from "lucide-react";
import type { Category } from "@/types/api";

interface FilterPanelProps {
  showFilters: boolean;
  setShowFilters: (show: boolean) => void;
  hasActiveFilters: boolean;
  clearFilters: () => void;
  selectedTags: string[];
  selectedCategory: string | null;
  selectedStatuses: string[];
  categories: Category[];
  allAvailableTags: string[];
  onTagSelect: (tag: string) => void;
  onCategorySelect: (categoryId: string | null) => void;
  onStatusToggle: (status: string) => void;
  viewMode: "grid" | "list";
  setViewMode: (mode: "grid" | "list") => void;
}

export default function FilterPanel({
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearFilters,
  selectedTags,
  selectedCategory,
  selectedStatuses,
  categories,
  allAvailableTags,
  onTagSelect,
  onCategorySelect,
  onStatusToggle,
  viewMode,
  setViewMode
}: FilterPanelProps) {
  const [tagInput, setTagInput] = useState("");

  const getFilteredTags = () => {
    return allAvailableTags
      .filter((tag) => tag.toLowerCase().includes(tagInput.toLowerCase()))
      .slice(0, 10)
      .sort();
  };

  const activeFilterCount = 
    selectedTags.length + 
    (selectedCategory ? 1 : 0) + 
    (selectedStatuses.length < 3 ? 1 : 0);

  return (
    <div className="mb-6">
      <div className="bg-primary-50 border border-primary-200 rounded-lg shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3">
          <div className="flex items-center justify-center sm:justify-start mb-3 sm:mb-0">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-3 py-1.5 bg-primary-100 hover:bg-primary-200 text-primary-700 rounded-md transition-colors duration-200 mr-3"
            >
              <Filter className="w-4 h-4 mr-2" />
              <span className="font-medium">Filters</span>
              <ChevronDown
                className={`w-4 h-4 ml-2 transition-transform ${
                  showFilters ? "rotate-180" : ""
                }`}
              />
            </button>

            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="flex items-center px-3 py-1.5 bg-danger-50 hover:bg-danger-100 text-danger-600 rounded-md transition-colors duration-200"
              >
                <X className="w-3 h-3 mr-2" />
                <span className="font-medium">Clear filters</span>
              </button>
            )}
          </div>

          <div className="flex items-center space-x-2">
            {hasActiveFilters && (
              <span className="bg-primary-100 text-primary-700 px-2 py-1 rounded-md text-sm font-medium mr-2">
                {activeFilterCount} active filters
              </span>
            )}
            
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "list" : "grid")}
              className="p-2 rounded-md bg-primary-100 hover:bg-primary-200 text-primary-700 transition-colors duration-200"
              title={`Switch to ${viewMode === "grid" ? "list" : "grid"} view`}
            >
              {viewMode === "grid" ? <List className="w-4 h-4" /> : <Grid className="w-4 h-4" />}
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="border-t border-primary-200 p-5 bg-primary-100 rounded-b-lg">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Category Filter */}
              <div className="filter-section">
                <label className="block text-sm font-semibold text-primary-700 mb-2">
                  Category
                </label>
                <select
                  className="form-input w-full shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  value={selectedCategory || ""}
                  onChange={(e) => onCategorySelect(e.target.value || null)}
                >
                  <option value="">All Categories</option>
                  <option value="null">Uncategorized</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id.toString()}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {selectedCategory && (
                  <div className="mt-2 text-xs text-primary-500">
                    Selected: {categories.find(c => c.id.toString() === selectedCategory)?.name || "Uncategorized"}
                  </div>
                )}
              </div>

              {/* Status Filter */}
              <div className="filter-section">
                <span className="block text-sm font-semibold text-primary-700 mb-2">
                  Status
                </span>
                <div className="flex flex-wrap gap-2">
                  {[
                    { id: "draft", label: "Draft" },
                    { id: "published", label: "Published" },
                    { id: "archived", label: "Archived" },
                  ].map((status) => (
                    <button
                      key={status.id}
                      onClick={() => onStatusToggle(status.id)}
                      className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${
                        selectedStatuses.includes(status.id)
                          ? "bg-primary-300 text-primary-600"
                          : "bg-primary-100 text-primary-400 hover:bg-primary-200"
                      }`}
                    >
                      {status.label}
                    </button>
                  ))}
                </div>
                <div className="mt-2 text-xs text-primary-500">
                  {selectedStatuses.length === 3 
                    ? "All statuses selected" 
                    : `Selected: ${selectedStatuses.map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(", ")}`}
                </div>
              </div>

              {/* Tag Filter */}
              <div className="filter-section">
                <label className="block text-sm font-semibold text-primary-700 mb-2">
                  Tags
                </label>
                <input
                  type="text"
                  className="form-input w-full shadow-sm focus:ring-primary-500 focus:border-primary-500"
                  placeholder="Search tags..."
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                />
                <div className="mt-2 flex flex-wrap gap-2 max-h-32 overflow-y-auto p-2 bg-primary-50 rounded-md border border-primary-200">
                  {getFilteredTags().length > 0 ? (
                    getFilteredTags().map((tag) => (
                      <button
                        key={tag}
                        onClick={() => onTagSelect(tag)}
                        className={`px-2 py-1 text-xs font-medium rounded-md ${
                          selectedTags.includes(tag)
                            ? "bg-primary-300 text-primary-800 border border-primary-400"
                            : "bg-primary-100 text-primary-400 border border-primary-400 hover:bg-primary-200"
                        }`}
                      >
                        {tag}
                      </button>
                    ))
                  ) : (
                    <span className="text-xs text-primary-400 italic">No matching tags found</span>
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-2 text-xs text-primary-500">
                    Selected: {selectedTags.join(", ")}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
