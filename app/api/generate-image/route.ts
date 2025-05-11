import { GoogleGenAI, Modality } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";
import { put } from '@vercel/blob';

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

    // Create a quality-enhanced prompt with specific details for high-quality generation
    const qualityEnhancement = "high quality cinematic illustration, detailed artwork, professional illustration, crisp details";
    
    // Build the complete prompt with enhancements and appropriate negative prompt handling
    let enhancedPrompt = `${prompt}. ${qualityEnhancement}`;
    
    // Add the negative prompt as a separate instruction if provided
    const negativePromptText = negativePrompt ? 
      `Avoid: ${negativePrompt}, blurry, distorted, low resolution, poor quality, deformed, pixelated` : 
      "Avoid: blurry, distorted, low resolution, poor quality, deformed, unnatural, pixelated";

    // Add seed, steps, and aspect ratio configuration
    const configOptions: any = {
      responseModalities: [Modality.TEXT, Modality.IMAGE],
    };
    
    if (seed) {
      configOptions.seed = seed;
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
      
      // Process the response if it exists
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
      // Extract the base64 data from the data URL
      const buffer = Buffer.from(imageData, 'base64');
      
      // Generate a unique filename
      const filename = `generated-image-16x9-${Date.now()}-${seed || 'random'}.png`;
      
      // Upload to Vercel Blob
      const blob = await put(filename, buffer, {
        contentType: 'image/png',
        access: 'public', // Make the image publicly accessible
      });

      // Return both the base64 data and the Blob URL
      return NextResponse.json({
        imageData: base64ImageData, // Keep sending the base64 data for immediate display
        blobUrl: blob.url,          // Also send the Blob URL for persistent storage
        text: responseText || "Image generated successfully",
        prompt: prompt,
        timestamp: Date.now(),
      });
      
    } catch (apiError: any) {
      return NextResponse.json(
        { error: `Error from Gemini API: ${apiError.message}` },
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