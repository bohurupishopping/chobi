import { NextRequest, NextResponse } from "next/server";
import Together from "together-ai";

// Maximum prompt length that Together AI can handle effectively
const MAX_PROMPT_LENGTH = 4000;

// Function to truncate prompt if it exceeds the maximum length
function truncatePrompt(prompt: string): string {
  if (prompt.length > MAX_PROMPT_LENGTH) {
    // Try to truncate at a sentence or paragraph boundary
    const truncated = prompt.substring(0, MAX_PROMPT_LENGTH);
    const lastPeriod = truncated.lastIndexOf('.');
    const lastNewline = truncated.lastIndexOf('\n');
    const breakPoint = Math.max(lastPeriod, lastNewline);
    
    return breakPoint > 0 ? truncated.substring(0, breakPoint + 1) : truncated;
  }
  return prompt;
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, negativePrompt, seed, steps, width, height, model, apiKey } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Use the provided API key if available, otherwise fall back to environment variable
    const togetherApiKey = apiKey || process.env.TOGETHER_API_KEY;
    
    if (!togetherApiKey) {
      return NextResponse.json(
        { error: 'No API key available. Please add a Together AI API key in settings.' },
        { status: 400 }
      );
    }

    // Initialize the Together AI client with the appropriate API key
    const together = new Together({
      apiKey: togetherApiKey,
    });

    // Default configuration optimized for the template system
    const defaultWidth = 1280;  // 16:9 aspect ratio
    const defaultHeight = 720;
    const defaultSteps = 4;     // Maximum for Together AI
    const defaultModel = "black-forest-labs/FLUX.1-schnell-Free";

    // Ensure steps are within Together AI's limits (1-4)
    const validatedSteps = steps ? Math.min(Math.max(1, Number(steps)), 4) : defaultSteps;

    // Process and validate the prompts
    const processedPrompt = truncatePrompt(prompt);
    const processedNegativePrompt = negativePrompt ? truncatePrompt(negativePrompt) : undefined;

    try {
      // Generate the image with optimized parameters
      const response = await together.images.create({
        model: model || defaultModel,
        prompt: processedPrompt,
        negative_prompt: processedNegativePrompt,
        width: width || defaultWidth,
        height: height || defaultHeight,
        steps: validatedSteps,
        n: 1,
        response_format: "base64",
        seed: seed ? Number(seed) : undefined,
      });
      
      if (!response.data || !response.data[0]?.b64_json) {
        return NextResponse.json(
          { error: "No valid response received from Together AI" },
          { status: 500 }
        );
      }
      
      // Extract image data
      const imageData = response.data[0].b64_json;
      
      // Create a base64 data URL from the image data
      const base64ImageData = `data:image/png;base64,${imageData}`;
      
      // Return the response with additional metadata
      return NextResponse.json({
        imageData: base64ImageData,
        text: "Image generated successfully with Together AI",
        prompt: processedPrompt,
        timestamp: Date.now(),
        metadata: {
          width: width || defaultWidth,
          height: height || defaultHeight,
          steps: validatedSteps,
          model: model || defaultModel,
          promptLength: processedPrompt.length,
          wasPromptTruncated: processedPrompt.length < prompt.length,
        }
      });
      
    } catch (apiError: any) {
      // Enhanced error handling with more specific error messages
      let errorMessage = `Error from Together AI: ${apiError.message}`;
      
      if (apiError.message?.includes("invalid_request_error")) {
        errorMessage = "Invalid request: Please check your prompt and parameters.";
      } else if (apiError.message?.includes("authentication")) {
        errorMessage = "Authentication failed: Please check your API key.";
      } else if (apiError.message?.includes("quota")) {
        errorMessage = "API quota exceeded: Please check your usage limits.";
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }
    
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  }
} 