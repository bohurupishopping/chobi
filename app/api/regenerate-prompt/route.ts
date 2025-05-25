import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { sceneContent, modelProvider = "openai" } = await request.json()

    if (!sceneContent || !sceneContent.trim()) {
      return NextResponse.json({ error: "Scene content is required" }, { status: 400 })
    }

    // Select the model based on provider
    const model = modelProvider === "gemini" ? google("gemini-2.5-flash-preview-05-20") : openai("gpt-4.1-mini-2025-04-14")

    const promptGenerationPrompt = `You are an expert at creating cinematic image generation prompts for animated movie-style storytelling.

Convert this story scene into a detailed, cinematic image prompt following this structure:

Scene: ${sceneContent}

Create a detailed prompt with these sections:

**Main Subject:** [Enhanced subject description with emotional elements - include character gender, appearance, clothing, facial expressions, body language, and specific actions they're performing]

**Scene Context:** [Environmental and atmospheric details - location, time of day, weather, lighting conditions, mood, and any relevant background elements]

**Composition:** [Camera angle, framing, perspective, depth of field, and visual composition notes that would make this scene cinematic]

**Style Notes:** [Artistic style, color palette, lighting effects, and any specific visual techniques that enhance the storytelling]

IMPORTANT: 
- Focus on actual scenes with characters performing specific actions
- Include detailed character descriptions (gender, appearance, emotions, clothing)
- Make it feel like a frame from an animated movie
- Include environmental details that set the mood and atmosphere
- Make the prompt detailed enough for high-quality AI image generation
- Focus on visual storytelling - what can be seen and felt in the image
- Include specific lighting and composition notes for cinematic quality

Return the complete formatted prompt with all sections.`

    const promptResult = await generateText({
      model,
      prompt: promptGenerationPrompt,
      temperature: 0.8,
    })

    return NextResponse.json({ prompt: promptResult.text.trim() })
  } catch (error) {
    console.error("Error regenerating prompt:", error)
    return NextResponse.json({ error: "Failed to regenerate prompt" }, { status: 500 })
  }
}
