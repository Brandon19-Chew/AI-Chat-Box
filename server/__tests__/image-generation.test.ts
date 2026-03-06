import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { generateImages, isImageGenerationRequest, extractImagePrompt } from "../_core/image-generation";

describe("Image Generation", () => {
  describe("isImageGenerationRequest", () => {
    it("should detect image generation requests", () => {
      expect(isImageGenerationRequest("generate an image of a cat")).toBe(true);
      expect(isImageGenerationRequest("create a picture of a sunset")).toBe(true);
      expect(isImageGenerationRequest("draw a landscape")).toBe(true);
      expect(isImageGenerationRequest("visualize a futuristic city")).toBe(true);
    });

    it("should not detect non-image requests", () => {
      expect(isImageGenerationRequest("what is the weather today")).toBe(false);
      expect(isImageGenerationRequest("tell me a joke")).toBe(false);
      expect(isImageGenerationRequest("how do I cook pasta")).toBe(false);
    });

    it("should be case insensitive", () => {
      expect(isImageGenerationRequest("GENERATE IMAGE of a dog")).toBe(true);
      expect(isImageGenerationRequest("Create A Picture")).toBe(true);
    });
  });

  describe("extractImagePrompt", () => {
    it("should extract prompt from image generation request", () => {
      const result = extractImagePrompt("generate an image of a beautiful mountain landscape");
      expect(result).toContain("beautiful mountain landscape");
    });

    it("should remove common prefixes", () => {
      const result = extractImagePrompt("create a picture of a cat");
      expect(result).toContain("cat");
      expect(result).not.toContain("create");
    });

    it("should handle various prefixes", () => {
      expect(extractImagePrompt("draw a sunset")).toContain("sunset");
      expect(extractImagePrompt("paint a forest")).toContain("forest");
      expect(extractImagePrompt("visualize a robot")).toContain("robot");
      expect(extractImagePrompt("render a spaceship")).toContain("spaceship");
    });

    it("should return original message if no prefix found", () => {
      const message = "a cat sitting on a table";
      const result = extractImagePrompt(message);
      expect(result).toBe(message);
    });

    it("should limit prompt length to 1000 characters", () => {
      const longPrompt = "a".repeat(1500);
      const result = extractImagePrompt(longPrompt);
      expect(result.length).toBeLessThanOrEqual(1000);
    });
  });

  describe("generateImages", () => {
    it("should throw error if prompt is empty", async () => {
      await expect(generateImages({ prompt: "" })).rejects.toThrow(
        "Image prompt cannot be empty"
      );
    });

    it("should throw error if prompt is only whitespace", async () => {
      await expect(generateImages({ prompt: "   " })).rejects.toThrow(
        "Image prompt cannot be empty"
      );
    });

    it("should use default parameters", async () => {
      // Mock the fetch to verify parameters
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ url: "https://example.com/image.png" }],
        }),
      });
      global.fetch = mockFetch;

      try {
        await generateImages({ prompt: "a cat" });
        expect(mockFetch).toHaveBeenCalled();
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body.size).toBe("1024x1024");
        expect(body.quality).toBe("standard");
        expect(body.style).toBe("natural");
        expect(body.n).toBe(1);
      } finally {
        vi.restoreAllMocks();
      }
    });

    it("should limit prompt length to 1000 characters", async () => {
      const mockFetch = vi.fn().mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          data: [{ url: "https://example.com/image.png" }],
        }),
      });
      global.fetch = mockFetch;

      try {
        const longPrompt = "a".repeat(1500);
        await generateImages({ prompt: longPrompt });
        const callArgs = mockFetch.mock.calls[0];
        const body = JSON.parse(callArgs[1].body);
        expect(body.prompt.length).toBeLessThanOrEqual(1000);
      } finally {
        vi.restoreAllMocks();
      }
    });
  });
});
