import { ENV } from "./env";

export type ImageGenerationRequest = {
  prompt: string;
  size?: "256x256" | "512x512" | "1024x1024" | "1024x1792" | "1792x1024";
  quality?: "standard" | "hd";
  style?: "natural" | "vivid";
  n?: number;
};

export type ImageGenerationResponse = {
  created: number;
  data: Array<{
    url: string;
    revised_prompt?: string;
  }>;
};

const resolveImageApiUrl = () =>
  ENV.forgeApiUrl && ENV.forgeApiUrl.trim().length > 0
    ? `${ENV.forgeApiUrl.replace(/\/$/, "")}/v1/images/generations`
    : "https://forge.manus.im/v1/images/generations";

const assertApiKey = () => {
  if (!ENV.forgeApiKey) {
    throw new Error("OPENAI_API_KEY is not configured");
  }
};

/**
 * Generate images using the AI image generation API
 * @param request Image generation request parameters
 * @returns Array of generated image URLs
 */
export async function generateImages(request: ImageGenerationRequest): Promise<string[]> {
  assertApiKey();

  // Validate prompt
  if (!request.prompt || request.prompt.trim().length === 0) {
    throw new Error("Image prompt cannot be empty");
  }

  // Limit prompt length
  const prompt = request.prompt.trim().slice(0, 1000);

  const payload = {
    model: "dall-e-3",
    prompt,
    size: request.size || "1024x1024",
    quality: request.quality || "standard",
    style: request.style || "natural",
    n: request.n || 1,
  };

  try {
    const response = await fetch(resolveImageApiUrl(), {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${ENV.forgeApiKey}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Image Generation] API error:", response.status, errorText);
      throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ImageGenerationResponse;
    return data.data.map((img) => img.url);
  } catch (error) {
    console.error("[Image Generation] Error:", error);
    throw error;
  }
}

/**
 * Check if a message is requesting image generation
 * @param message The user message to check
 * @returns true if the message appears to be requesting image generation
 */
export function isImageGenerationRequest(message: string): boolean {
  const imageKeywords = [
    "generate image",
    "create image",
    "draw",
    "paint",
    "create a picture",
    "make an image",
    "generate a picture",
    "create a visual",
    "visualize",
    "show me",
    "design",
    "illustrate",
    "sketch",
    "render",
    "image of",
    "picture of",
    "photo of",
  ];

  const lowerMessage = message.toLowerCase();
  return imageKeywords.some((keyword) => lowerMessage.includes(keyword));
}

/**
 * Extract image generation prompt from a message
 * @param message The user message
 * @returns Extracted prompt or the original message
 */
export function extractImagePrompt(message: string): string {
  // Remove common prefixes
  let prompt = message
    .replace(/^(generate|create|draw|paint|make|design|illustrate|visualize|show me|render)\s+(?:an?\s+)?(image|picture|photo|visual|drawing|painting|sketch)?\s+(?:of\s+)?/i, "")
    .trim();

  // If nothing was removed, use the original message
  if (!prompt) {
    prompt = message;
  }

  return prompt.slice(0, 1000);
}
