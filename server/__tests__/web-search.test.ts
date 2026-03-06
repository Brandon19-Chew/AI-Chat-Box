import { describe, it, expect } from "vitest";
import { shouldPerformWebSearch, formatSearchResults } from "../_core/web-search";

describe("Web Search Utility", () => {
  describe("shouldPerformWebSearch", () => {
    it("should return true for time-sensitive keywords like 'today'", () => {
      expect(shouldPerformWebSearch("What date is today?")).toBe(true);
    });



    it("should return true for 'latest' keyword", () => {
      expect(shouldPerformWebSearch("Show me the latest news")).toBe(true);
    });

    it("should return true for 'news' keyword", () => {
      expect(shouldPerformWebSearch("Tell me about recent news")).toBe(true);
    });

    it("should return true for 'weather' keyword", () => {
      expect(shouldPerformWebSearch("What is the weather today?")).toBe(true);
    });

    it("should return true for 'stock' keyword", () => {
      expect(shouldPerformWebSearch("What is the stock price?")).toBe(true);
    });

    it("should return true for 'price' keyword", () => {
      expect(shouldPerformWebSearch("How much does this cost?")).toBe(true);
    });

    it("should return true for 'now' keyword", () => {
      expect(shouldPerformWebSearch("What is happening now?")).toBe(true);
    });

    it("should return true for '2026' year", () => {
      expect(shouldPerformWebSearch("What happened in 2026?")).toBe(true);
    });

    it("should return true for 'breaking' keyword", () => {
      expect(shouldPerformWebSearch("Any breaking news?")).toBe(true);
    });

    it("should return true for 'trending' keyword", () => {
      expect(shouldPerformWebSearch("What is trending?")).toBe(true);
    });

    it("should return false for general questions without time-sensitive keywords", () => {
      expect(shouldPerformWebSearch("Tell me about the capital of France")).toBe(false);
    });

    it("should return false for historical questions", () => {
      expect(shouldPerformWebSearch("Tell me about World War 2")).toBe(false);
    });

    it("should be case-insensitive", () => {
      expect(shouldPerformWebSearch("TODAY IS WHAT DATE?")).toBe(true);
      expect(shouldPerformWebSearch("Tell me the current time")).toBe(true);
    });
  });

  describe("formatSearchResults", () => {
    it("should return 'No search results found' for empty array", () => {
      expect(formatSearchResults([])).toBe("No search results found.");
    });

    it("should format single search result correctly", () => {
      const results = [
        {
          title: "Test Title",
          url: "https://example.com",
          snippet: "Test snippet",
          source: "example.com",
        },
      ];
      const formatted = formatSearchResults(results);
      expect(formatted).toContain("[1] Test Title");
      expect(formatted).toContain("Source: example.com");
      expect(formatted).toContain("Test snippet");
      expect(formatted).toContain("URL: https://example.com");
    });

    it("should format multiple search results with numbering", () => {
      const results = [
        {
          title: "First Result",
          url: "https://example1.com",
          snippet: "First snippet",
          source: "example1.com",
        },
        {
          title: "Second Result",
          url: "https://example2.com",
          snippet: "Second snippet",
          source: "example2.com",
        },
      ];
      const formatted = formatSearchResults(results);
      expect(formatted).toContain("[1] First Result");
      expect(formatted).toContain("[2] Second Result");
    });

    it("should include source domain from URL", () => {
      const results = [
        {
          title: "Test",
          url: "https://www.example.com/page",
          snippet: "Test",
          source: "www.example.com",
        },
      ];
      const formatted = formatSearchResults(results);
      expect(formatted).toContain("Source: www.example.com");
    });
  });
});
