import { documentsAPI } from "@/utils/api";
import type { Document } from "@/types/api";

export interface SearchParams {
  query: string;
  tags?: string;
  category?: string;
  status?: string;
  page?: number;
  limit?: number;
}

export interface SearchResult {
  documents: Document[];
  totalCount: number;
  hasMore: boolean;
}

/**
 * Enhanced search function that handles various search scenarios
 */
export async function searchDocuments(params: SearchParams): Promise<SearchResult> {
  const { query, page = 1, limit = 100, ...filters } = params;

  try {
    console.log(`Searching for: "${query}"`, { page, limit, filters });

    // Prepare search parameters
    const searchParams: Record<string, any> = {
      page,
      limit,
    };

    // Add filters to search
    if (filters.tags) {
      searchParams.tags = filters.tags;
    }
    if (filters.category) {
      searchParams.category = filters.category;
    }
    if (filters.status) {
      searchParams.status = filters.status;
    }

    // Execute search
    const response = await documentsAPI.searchDocuments(query.trim(), searchParams);
    const documents = response.data.results || [];
    const totalCount = response.data.count || 0;

    console.log(`Search results: ${documents.length} documents (total: ${totalCount})`);

    // Log sample results for debugging
    if (documents.length > 0) {
      const firstDoc = documents[0];
      console.log(`First result: "${firstDoc.title}" - Tags: [${firstDoc.tags.join(', ')}]`);
    }

    return {
      documents,
      totalCount,
      hasMore: totalCount > page * limit
    };

  } catch (error) {
    console.error('Search error:', error);
    throw new Error('Search failed. Please try again with different terms.');
  }
}

/**
 * Check if a search term might be looking for tags
 */
export function isTagSearch(query: string): boolean {
  return query.startsWith('#') || query.startsWith('tag:');
}

/**
 * Extract tag name from tag search query
 */
export function extractTagFromQuery(query: string): string {
  if (query.startsWith('#')) {
    return query.substring(1);
  }
  if (query.startsWith('tag:')) {
    return query.substring(4);
  }
  return query;
}

/**
 * Check if search should include content search
 */
export function shouldSearchContent(query: string): boolean {
  // Don't search content for very short queries (performance)
  return query.trim().length >= 3;
}

/**
 * Parse search query for advanced search features
 */
export function parseSearchQuery(query: string): {
  terms: string[];
  tags: string[];
  exactPhrase?: string;
} {
  const result = {
    terms: [] as string[],
    tags: [] as string[],
    exactPhrase: undefined as string | undefined
  };

  // Extract exact phrases (quoted text)
  const exactPhraseMatch = query.match(/"([^"]+)"/);
  if (exactPhraseMatch) {
    result.exactPhrase = exactPhraseMatch[1];
    query = query.replace(exactPhraseMatch[0], '').trim();
  }

  // Extract hashtags
  const hashtagMatches = query.match(/#\w+/g);
  if (hashtagMatches) {
    result.tags = hashtagMatches.map(tag => tag.substring(1));
    query = query.replace(/#\w+/g, '').trim();
  }

  // Extract remaining terms
  if (query.trim()) {
    result.terms = query.trim().split(/\s+/);
  }

  return result;
}