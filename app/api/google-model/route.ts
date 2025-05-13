import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';
import * as fs from 'fs';
import * as path from 'path';
import { referenceImages } from '@/lib/prompt-builder';

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
  console.log('\n=== Google Model API Request Started ===');
  const requestStartTime = Date.now();

  try {
    const requestData = await request.json();
    console.log('\nRequest Data:', {
      prompt: requestData.prompt,
      negativePrompt: requestData.negativePrompt,
      seed: requestData.seed,
      steps: requestData.steps,
      hasApiKey: !!requestData.apiKey,
      referenceImages: requestData.referenceImages
    });

    const { prompt, negativePrompt, seed, steps, apiKey } = requestData;
    
    // Always use the default reference images
    const defaultRefImages = referenceImages.map(img => img.path);
    console.log('\nUsing default reference images:', defaultRefImages);

    if (!prompt) {
      console.error('Error: No prompt provided');
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Use the provided API key if available, otherwise fall back to environment variable
    const geminiApiKey = apiKey || process.env.GEMINI_API_KEY;
    
    if (!geminiApiKey) {
      console.error('Error: No API key available');
      return NextResponse.json(
        { error: 'No API key available. Please add an API key in settings.' },
        { status: 400 }
      );
    }

    // Initialize the Google GenAI client
    console.log('\nInitializing Google GenAI client...');
    const ai = new GoogleGenAI({
      apiKey: geminiApiKey
    });

    // Process and validate the prompts
    const processedPrompt = truncatePrompt(prompt);
    const processedNegativePrompt = negativePrompt ? truncatePrompt(negativePrompt) : "";

    console.log('\nProcessed Prompts:', {
      originalPromptLength: prompt.length,
      processedPromptLength: processedPrompt.length,
      wasPromptTruncated: processedPrompt.length < prompt.length,
      hasNegativePrompt: !!processedNegativePrompt
    });

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
      temperature: 0.3,
      topK: 20,
      topP: 0.8,
      seed: fixedSeed,
    };
    
    if (steps) {
      configOptions.steps = steps;
    }

    console.log('\nGeneration Config:', {
      ...configOptions,
      negativePromptText,
      timestamp
    });

    try {
      // Prepare reference images if provided
      const contents: any[] = [{ text: enhancedPrompt }];
      console.log('\nPreparing contents array:', {
        initialContent: { text: enhancedPrompt },
        defaultReferenceImages: defaultRefImages
      });

      // Always process default reference images
      console.log('\nProcessing default reference images:', {
        count: defaultRefImages.length,
        paths: defaultRefImages
      });

      for (const imgPath of defaultRefImages) {
        console.log(`\nProcessing reference image: ${imgPath}`);
        try {
          console.log('Reading image file...');
          const base64Image = await getImageAsBase64(imgPath);
          console.log('Successfully converted image to base64');
          console.log('Base64 string length:', base64Image.length);

          contents.push({
            inlineData: {
              mimeType: "image/png",
              data: base64Image
            }
          });
          console.log('Successfully added image to contents array');
        } catch (error) {
          console.error('Error processing reference image:', {
            path: imgPath,
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined
          });
        }
      }

      console.log('\nFinal contents array:', {
        length: contents.length,
        hasTextPrompt: !!contents[0]?.text,
        numberOfImages: contents.length - 1
      });

      console.log('\nCalling Gemini API with configuration:', {
        model: "gemini-2.0-flash-preview-image-generation",
        contentsLength: contents.length,
        configOptions: {
          ...configOptions,
          negativePrompt: negativePromptText
        }
      });

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
      console.log('\nReceived response from Gemini API');
      
      if (!response || !response.candidates || !response.candidates[0]?.content?.parts) {
        console.error('Error: Invalid response structure from Gemini API', response);
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
          console.log('\nResponse text:', responseText);
        } else if (part.inlineData) {
          imageData = part.inlineData.data;
          console.log('Image data received');
        }
      }

      if (!imageData) {
        console.error('Error: No image data in response');
        return NextResponse.json(
          { error: "No image was generated" },
          { status: 500 }
        );
      }

      // Create a base64 data URL from the image data
      const base64ImageData = `data:image/png;base64,${imageData}`;
      
      console.log('\nUploading to Vercel Blob...');
      // Store the image in Vercel Blob
      const buffer = Buffer.from(imageData, 'base64');
      const filename = `generated-image-16x9-${timestamp}-${fixedSeed}.png`;
      
      const blob = await put(filename, buffer, {
        contentType: 'image/png',
        access: 'public',
      });
      console.log('Successfully uploaded to Vercel Blob:', blob.url);

      const responseData = {
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
          usedReferenceImages: defaultRefImages
        }
      };

      const requestDuration = Date.now() - requestStartTime;
      console.log('\nRequest completed successfully', {
        duration: `${requestDuration}ms`,
        metadata: responseData.metadata
      });

      return NextResponse.json(responseData);
      
    } catch (apiError: any) {
      // Enhanced error handling with more specific error messages
      console.error('\nGemini API Error:', {
        error: apiError,
        message: apiError.message,
        stack: apiError.stack
      });

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
    console.error('\nUnexpected Error:', {
      error,
      message: error.message,
      stack: error.stack
    });

    return NextResponse.json(
      { error: error.message || "Failed to generate image" },
      { status: 500 }
    );
  } finally {
    const requestDuration = Date.now() - requestStartTime;
    console.log(`\n=== Google Model API Request Ended (${requestDuration}ms) ===\n`);
  }
} 