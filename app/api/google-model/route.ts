import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';

// Maximum prompt length that Gemini can handle effectively
const MAX_PROMPT_LENGTH = 4000;

// Function to truncate prompt if it exceeds the maximum length
function truncatePrompt(prompt: string): string {
  if (prompt.length > MAX_PROMPT_LENGTH) {
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
    const { prompt, negativePrompt, seed, steps, apiKey } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Use the provided API key if available, otherwise fall back to environment variable
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      return NextResponse.json(
        { error: 'No API key available. Please add an API key in settings.' },
        { status: 400 }
      );
    }

    // Initialize the Google GenAI client
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey
    });

    // Process and validate the prompts
    const processedPrompt = truncatePrompt(prompt);
    const processedNegativePrompt = negativePrompt ? truncatePrompt(negativePrompt) : "";

    // Create a quality-enhanced prompt with specific details for high-quality generation
    const qualityEnhancement = "high quality cinematic illustration, detailed artwork, professional illustration, crisp details";
    
    // Build the complete prompt with enhancements and appropriate negative prompt handling
    let enhancedPrompt = `${processedPrompt}. ${qualityEnhancement}`;
    
    // Add randomization parameters to ensure unique generations
    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const timestamp = Date.now();
    enhancedPrompt = `${enhancedPrompt} [Seed: ${randomSeed}, Timestamp: ${timestamp}]`;

    // Add the negative prompt as a separate instruction
    const negativePromptText = processedNegativePrompt ? 
      `Avoid: ${processedNegativePrompt}, blurry, distorted, low resolution, poor quality, deformed, pixelated` : 
      "Avoid: blurry, distorted, low resolution, poor quality, deformed, unnatural, pixelated";

    // Configuration options for the generation
    const configOptions: any = {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      temperature: 0.6, // Add some randomness to the generation
      topK: 40,        // Increase variety in the output
      topP: 0.85,      // Allow more creative generations
    };
    
    if (randomSeed) {
      configOptions.seed = randomSeed;
    }
    
    if (steps) {
      configOptions.steps = steps;
    }

    try {
      // Generate the image
      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents: enhancedPrompt,
        config: {
          ...configOptions,
          negativePrompt: negativePromptText,
        },
      });
      
      const response = await model;
      
      if (!response || !response.candidates || !response.candidates[0]?.content?.parts) {
        return NextResponse.json(
          { error: "No valid response received from the AI model" },
          { status: 500 }
        );
      }
      
      // Extract image and text data
      let imageData = null;
      let responseText = null;

      for (const part of response.candidates[0].content.parts) {
        if (part.text) {
          responseText = part.text;
        } else if (part.inlineData) {
          imageData = part.inlineData.data;
        }
      }

      if (!imageData) {
        return NextResponse.json(
          { error: "No image was generated" },
          { status: 500 }
        );
      }

      // Create a base64 data URL from the image data
      const base64ImageData = `data:image/png;base64,${imageData}`;
      
      // Store the image in Vercel Blob
      const buffer = Buffer.from(imageData, 'base64');
      const filename = `generated-image-16x9-${timestamp}-${randomSeed}.png`;
      
      const blob = await put(filename, buffer, {
        contentType: 'image/png',
        access: 'public',
      });

      // Return both the base64 data and the Blob URL
      return NextResponse.json({
        imageData: base64ImageData,
        blobUrl: blob.url,
        text: responseText || "Image generated successfully",
        prompt: processedPrompt,
        timestamp: timestamp,
        metadata: {
          seed: randomSeed,
          steps: steps,
          promptLength: processedPrompt.length,
          wasPromptTruncated: processedPrompt.length < prompt.length,
          temperature: configOptions.temperature,
          topK: configOptions.topK,
          topP: configOptions.topP
        }
      });
      
    } catch (apiError: any) {
      // Enhanced error handling with more specific error messages
      let errorMessage = `Error from Gemini API: ${apiError.message}`;
      
      if (apiError.message?.includes("invalid_request")) {
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