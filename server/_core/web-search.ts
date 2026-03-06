/**
 * Web Search Utility
 * Provides real-time information fetching for AI responses
 */

export interface SearchResult {
  title: string;
  url: string;
  snippet: string;
  source: string;
  date?: string;
}

/**
 * Performs a web search using a public search API
 * Falls back gracefully if the API is unavailable
 */
export async function performWebSearch(query: string): Promise<SearchResult[]> {
  try {
    // Using DuckDuckGo's API as it doesn't require authentication
    const encodedQuery = encodeURIComponent(query);
    const response = await fetch(`https://api.duckduckgo.com/?q=${encodedQuery}&format=json&no_redirect=1`, {
      headers: {
        "User-Agent": "Zrytium-AI/1.0",
      },
    });

    if (!response.ok) {
      console.warn(`[WebSearch] API returned status ${response.status}`);
      return [];
    }

    const data = (await response.json()) as {
      Results?: Array<{
        FirstURL?: string;
        Text?: string;
        Result?: string;
      }>;
      RelatedTopics?: Array<{
        FirstURL?: string;
        Text?: string;
        Result?: string;
      }>;
    };

    const results: SearchResult[] = [];

    // Process direct results
    if (data.Results && Array.isArray(data.Results)) {
      for (const result of data.Results.slice(0, 3)) {
        if (result.Text && result.FirstURL) {
          results.push({
            title: result.Result || result.Text.substring(0, 100),
            url: result.FirstURL,
            snippet: result.Text,
            source: new URL(result.FirstURL).hostname || "Unknown",
          });
        }
      }
    }

    // Process related topics if needed
    if (results.length < 3 && data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
      for (const topic of data.RelatedTopics.slice(0, 3 - results.length)) {
        if (topic.Text && topic.FirstURL) {
          results.push({
            title: topic.Result || topic.Text.substring(0, 100),
            url: topic.FirstURL,
            snippet: topic.Text,
            source: new URL(topic.FirstURL).hostname || "Unknown",
          });
        }
      }
    }

    return results;
  } catch (error) {
    console.warn("[WebSearch] Search failed:", error instanceof Error ? error.message : String(error));
    return [];
  }
}

/**
 * Formats search results into a readable string for the AI
 */
export function formatSearchResults(results: SearchResult[]): string {
  if (results.length === 0) {
    return "No search results found.";
  }

  return results
    .map((result, index) => {
      return `[${index + 1}] ${result.title}\nSource: ${result.source}\n${result.snippet}\nURL: ${result.url}`;
    })
    .join("\n\n");
}

/**
 * Determines if a query would benefit from a web search
 * Returns true for time-sensitive queries
 */
export function shouldPerformWebSearch(userMessage: string): boolean {
  const timeSensitiveKeywords = [
    "today",
    "current",
    "latest",
    "recent",
    "news",
    "weather",
    "stock",
    "price",
    "rate",
    "now",
    "right now",
    "this week",
    "this month",
    "this year",
    "2026",
    "2025",
    "2024",
    "breaking",
    "trending",
    "live",
    "happening",
    "what is",
    "how much",
    "how many",
  ];

  const lowerMessage = userMessage.toLowerCase();
  return timeSensitiveKeywords.some((keyword) => lowerMessage.includes(keyword));
}
