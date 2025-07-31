// hooks/useDocumentFilters.ts
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/context/AuthContext";
import { documentsAPI, categoriesAPI } from "@/utils/api";
import type { Category } from "@/types/api";

interface UseDocumentFiltersProps {
  onFilterChange: () => void;
}

export function useDocumentFilters({
  onFilterChange,
}: UseDocumentFiltersProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([
    "draft",
    "published",
    "archived",
  ]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [allAvailableTags, setAllAvailableTags] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(false);

  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // Sync filters with URL parameters
  useEffect(() => {
    const { tags, category, status } = router.query;
    let filtersChanged = false;

    if (tags && typeof tags === "string") {
      const tagArray = tags.split(",");
      setSelectedTags(tagArray);
      filtersChanged = true;
    } else if (!tags && selectedTags.length > 0) {
      setSelectedTags([]);
      filtersChanged = true;
    }

    if (category && typeof category === "string") {
      setSelectedCategory(category);
      filtersChanged = true;
    } else if (!category && selectedCategory) {
      setSelectedCategory(null);
      filtersChanged = true;
    }

    if (status && typeof status === "string") {
      const statusArray = status.split(",");
      setSelectedStatuses(statusArray);
      filtersChanged = true;
    } else if (!status && selectedStatuses.length !== 3) {
      setSelectedStatuses(["draft", "published", "archived"]);
      filtersChanged = true;
    }

    if (filtersChanged) {
      setTimeout(() => onFilterChange(), 100);
    }
  }, [router.query]);

  // Fetch categories
  useEffect(() => {
    const fetchCategories = async () => {
      if (!isAuthenticated) return;

      try {
        const response = await categoriesAPI.getCategories();
        setCategories(response.data.results || []);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };

    fetchCategories();
  }, [isAuthenticated]);

  // Fetch all available tags
  useEffect(() => {
    const fetchAllTags = async () => {
      if (!isAuthenticated) return;

      try {
        // Fetch a large number of documents to get all tags
        const response = await documentsAPI.getDocuments({
          limit: 1000,
          latest_only: true,
        });

        const docs = response.data.results || [];
        const uniqueTags = new Set<string>();

        docs.forEach((doc: any) => {
          if (doc.tags && Array.isArray(doc.tags)) {
            doc.tags.forEach((tag: string) => uniqueTags.add(tag));
          }
        });

        setAllAvailableTags(Array.from(uniqueTags).sort());
      } catch (err) {
        console.error("Failed to fetch tags:", err);
      }
    };

    fetchAllTags();
  }, [isAuthenticated]);

  const updateURL = (newFilters: Record<string, string | null>) => {
    const query: Record<string, string> = {};

    // Preserve existing filters
    if (selectedTags.length > 0 && !("tags" in newFilters)) {
      query.tags = selectedTags.join(",");
    }
    if (selectedCategory && !("category" in newFilters)) {
      query.category = selectedCategory;
    }
    if (selectedStatuses.length < 3 && !("status" in newFilters)) {
      query.status = selectedStatuses.join(",");
    }

    // Add new filters
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== null) {
        query[key] = value;
      }
    });

    router.replace({ pathname: "/documents", query }, undefined, {
      shallow: true,
    });
  };

  const handleTagSelect = (tag: string) => {
    const newTags = selectedTags.includes(tag)
      ? selectedTags.filter((t) => t !== tag)
      : [...selectedTags, tag];

    setSelectedTags(newTags);
    updateURL({ tags: newTags.length > 0 ? newTags.join(",") : null });
    onFilterChange();
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
    updateURL({ category: categoryId });
    onFilterChange();
  };

  const handleStatusToggle = (status: string) => {
    const newStatuses = selectedStatuses.includes(status)
      ? selectedStatuses.filter((s) => s !== status)
      : [...selectedStatuses, status];

    setSelectedStatuses(newStatuses);
    updateURL({
      status: newStatuses.length > 0 ? newStatuses.join(",") : null,
    });
    onFilterChange();
  };

  const clearFilters = () => {
    setSelectedTags([]);
    setSelectedCategory(null);
    setSelectedStatuses(["draft", "published", "archived"]);
    router.push("/documents", undefined, { shallow: true });
    onFilterChange();
  };

  const hasActiveFilters = Boolean(
    selectedTags.length > 0 ||
      (selectedCategory &&
        selectedCategory !== "all" &&
        selectedCategory !== "") ||
      selectedStatuses.length > 0
  );

  return {
    selectedTags,
    selectedCategory,
    selectedStatuses,
    categories,
    allAvailableTags,
    showFilters,
    setShowFilters,
    handleTagSelect,
    handleCategorySelect,
    handleStatusToggle,
    clearFilters,
    hasActiveFilters,
  };
}
