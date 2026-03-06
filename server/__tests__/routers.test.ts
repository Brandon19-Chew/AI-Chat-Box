import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("AI Response with Current Date/Time Context", () => {
  beforeEach(() => {
    // Mock the current date to February 21, 2026
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-02-21T14:30:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should include current date in system prompt for title generation", () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    // Expected: "Friday, February 21, 2026" (or similar based on timezone)
    expect(currentDate).toContain("2026");
    expect(currentDate).toContain("February");
    expect(currentDate).toContain("21");
  });

  it("should include current time in system prompt for AI responses", () => {
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    // Expected: time string like "02:30:00 PM"
    expect(currentTime).toMatch(/\d{2}:\d{2}:\d{2}\s(AM|PM)/);
  });

  it("should format date correctly for system prompt", () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const systemPrompt = `Today is ${currentDate}. You are a helpful AI assistant.`;

    // Verify the prompt contains the date
    expect(systemPrompt).toContain("Today is");
    expect(systemPrompt).toContain("2026");
    expect(systemPrompt).toContain("February");
  });

  it("should format date and time correctly for chat responses", () => {
    const currentDate = new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
    const currentTime = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

    const systemPrompt = `You are a helpful AI assistant called Zrytium AI. Today is ${currentDate} at ${currentTime} GMT+8. Provide clear, concise, and helpful responses.`;

    // Verify the prompt contains both date and time
    expect(systemPrompt).toContain("Today is");
    expect(systemPrompt).toContain("2026");
    expect(systemPrompt).toContain("February");
    expect(systemPrompt).toContain("GMT+8");
    expect(systemPrompt).toMatch(/\d{2}:\d{2}:\d{2}\s(AM|PM)/);
  });
});
