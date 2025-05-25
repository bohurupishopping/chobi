import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { sceneContent } = await request.json()

    if (!sceneContent || !sceneContent.trim()) {
      return NextResponse.json({ error: "Scene content is required" }, { status: 400 })
    }

    const promptGenerationPrompt = `
You are an expert at creating image generation prompts for AI art tools like DALL-E, Midjourney, and Stable Diffusion.

Convert this story scene into a detailed, vivid image prompt with a fresh perspective:

Scene: ${sceneContent}

Create a prompt that includes:
- Character descriptions (appearance, emotions, clothing)
- Environment details (location, weather, time of day, atmosphere)
- Mood and lighting
- Key visual elements and actions
- Artistic style suggestions
- Camera angle or composition notes

The prompt should be optimized for AI image generation and create a cinematic, storytelling frame.
Try to offer a different visual interpretation than what might be obvious.

IMPORTANT: Respond with ONLY the image prompt text. Do not include any formatting, explanations, or additional text.
`

    const promptResult = await generateText({
      model: openai("o4-mini-2025-04-16"),
      prompt: promptGenerationPrompt,
      temperature: 0.8, // Higher temperature for more creative variations
    })

    return NextResponse.json({ prompt: promptResult.text.trim() })
  } catch (error) {
    console.error("Error regenerating prompt:", error)
    return NextResponse.json({ error: "Failed to regenerate prompt" }, { status: 500 })
  }
}
