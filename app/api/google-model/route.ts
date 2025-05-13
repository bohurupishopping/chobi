import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';

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

// Function to read and encode image to base64
async function getImageAsBase64(imagePath: string): Promise<string> {
  const fullPath = path.join(process.cwd(), 'public', imagePath);
  const imageBuffer = await fs.promises.readFile(fullPath);
  return imageBuffer.toString('base64');
}

export async function POST(request: NextRequest) {
  try {
    const { prompt, negativePrompt, seed, steps, apiKey, referenceImages } = await request.json();

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
    
    // Use fixed seed for consistency if provided, otherwise use the default
    const fixedSeed = seed || 42;
    const timestamp = Date.now();

    // Add the negative prompt as a separate instruction
    const negativePromptText = processedNegativePrompt ? 
      `Avoid: ${processedNegativePrompt}, blurry, distorted, low resolution, poor quality, deformed, pixelated` : 
      "Avoid: blurry, distorted, low resolution, poor quality, deformed, unnatural, pixelated";

    // Configuration options for the generation
    const configOptions: any = {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
      temperature: 0.3, // Lower temperature for more consistent results
      topK: 20,        // Lower topK for more focused generations
      topP: 0.8,       // Adjusted for balance between creativity and consistency
      seed: fixedSeed, // Use fixed seed for consistency
    };
    
    if (steps) {
      configOptions.steps = steps;
    }

    try {
      // Prepare reference images if provided
      const contents: any[] = [{ text: enhancedPrompt }];

      if (referenceImages && referenceImages.length > 0) {
        for (const imgPath of referenceImages) {
          try {
            const base64Image = await getImageAsBase64(imgPath);
            contents.push({
              inlineData: {
                mimeType: "image/png",
                data: base64Image
              }
            });
          } catch (error) {
            console.error(`Error loading reference image ${imgPath}:`, error);
          }
        }
      }

      // Generate the image with reference images
      const model = ai.models.generateContent({
        model: "gemini-2.0-flash-preview-image-generation",
        contents,
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
      const filename = `generated-image-16x9-${timestamp}-${fixedSeed}.png`;
      
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
          seed: fixedSeed,
          steps: steps,
          promptLength: processedPrompt.length,
          wasPromptTruncated: processedPrompt.length < prompt.length,
          temperature: configOptions.temperature,
          topK: configOptions.topK,
          topP: configOptions.topP,
          usedReferenceImages: referenceImages
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