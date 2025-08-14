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

    // Parse the search query for advanced features
    const parsedQuery = parseSearchQuery(query);

    // Prepare search parameters
    const searchParams: Record<string, any> = {
      page,
      limit,
    };

    // Add existing filters to search
    if (filters.category) {
      searchParams.category = filters.category;
    }
    if (filters.status) {
      searchParams.status = filters.status;
    }

    // Handle tags - combine existing tag filters with parsed hashtags
    const existingTags = filters.tags ? filters.tags.split(',') : [];
    const parsedTags = parsedQuery.tags || [];
    const allTags = [...existingTags, ...parsedTags];
    
    if (allTags.length > 0) {
      searchParams.tags = allTags.join(',');
    }

    // Build the cleaned search query (without hashtags)
    let cleanQuery = '';
    if (parsedQuery.exactPhrase) {
      cleanQuery = `"${parsedQuery.exactPhrase}"`;
    }
    if (parsedQuery.terms.length > 0) {
      cleanQuery += (cleanQuery ? ' ' : '') + parsedQuery.terms.join(' ');
    }

    // Use cleaned query or wildcard if only searching by tags
    const finalQuery = cleanQuery.trim() || (parsedTags.length > 0 ? '*' : query.trim());

    // Execute search with cleaned query


    const response = await documentsAPI.searchDocuments(finalQuery, searchParams);
    const documents = response.data.results || [];
    const totalCount = response.data.count || 0;


    // Log sample results for debugging
    if (documents.length > 0) {
      const firstDoc = documents[0];

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
