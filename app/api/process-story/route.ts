import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { story, sceneCount, sectionOnly } = await request.json()

    if (!story || !story.trim()) {
      return NextResponse.json({ error: "Story content is required" }, { status: 400 })
    }

    // First, section the story
    const sectioningPrompt = `
You are an expert story analyst. Break down the following story into exactly ${sceneCount} logical scenes or narrative segments.

Each scene should:
- Represent a distinct moment, location change, or narrative beat
- Be substantial enough to create a meaningful image
- Maintain story continuity
- Focus on visual elements that can be illustrated

Story to analyze:
${story}

IMPORTANT: Respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

The JSON should have this exact structure:
{
  "scenes": [
    {
      "content": "The actual scene text from the story",
      "sceneNumber": 1
    },
    {
      "content": "The next scene text from the story", 
      "sceneNumber": 2
    }
  ]
}
`

    const sectioningResult = await generateText({
      model: openai("gpt-4.1-mini-2025-04-14"),
      prompt: sectioningPrompt,
      temperature: 0.3,
    })

    // Clean the response to extract JSON
    let cleanedResponse = sectioningResult.text.trim()

    // Remove markdown code blocks if present
    cleanedResponse = cleanedResponse.replace(/```json\s*/g, "").replace(/```\s*/g, "")

    // Remove any leading/trailing non-JSON content
    const jsonStart = cleanedResponse.indexOf("{")
    const jsonEnd = cleanedResponse.lastIndexOf("}")

    if (jsonStart === -1 || jsonEnd === -1) {
      console.error("No valid JSON found in response:", cleanedResponse)
      return NextResponse.json({ error: "Failed to parse story sections - no valid JSON found" }, { status: 500 })
    }

    cleanedResponse = cleanedResponse.substring(jsonStart, jsonEnd + 1)

    interface Scene {
      content: string
      sceneNumber: number
    }

    interface SectionsData {
      scenes: Scene[]
    }

    let sectionsData: SectionsData
    try {
      sectionsData = JSON.parse(cleanedResponse)

      // Validate the structure
      if (!sectionsData.scenes || !Array.isArray(sectionsData.scenes)) {
        throw new Error("Invalid response structure")
      }
    } catch (parseError) {
      console.error("Failed to parse sectioning result:", parseError)
      console.error("Cleaned response:", cleanedResponse)

      // Fallback: try to split the story manually
      const sentences = story.split(/[.!?]+/).filter((s: string) => s.trim().length > 20)
      const scenesPerSection = Math.max(1, Math.floor(sentences.length / sceneCount))

      sectionsData = {
        scenes: [] as Scene[],
      }

      for (let i = 0; i < sceneCount && i * scenesPerSection < sentences.length; i++) {
        const startIdx = i * scenesPerSection
        const endIdx = Math.min((i + 1) * scenesPerSection, sentences.length)
        const sceneContent = sentences.slice(startIdx, endIdx).join(". ").trim() + "."

        sectionsData.scenes.push({
          content: sceneContent,
          sceneNumber: i + 1,
        })
      }
    }

    // If sectionOnly flag is true, return just the sections without generating prompts
    if (sectionOnly) {
      return NextResponse.json({ scenes: sectionsData.scenes })
    }

    // Generate image prompts for each section (original behavior)
    const promptGenerationPromises = sectionsData.scenes.map(async (scene: any) => {
      const promptGenerationPrompt = `
You are an expert at creating image generation prompts for AI art tools like DALL-E, Midjourney, and Stable Diffusion.

Convert this story scene into a detailed, vivid image prompt:

Scene: ${scene.content}

Create a prompt that includes:
- Character descriptions (appearance, emotions, clothing)
- Environment details (location, weather, time of day, atmosphere)
- Mood and lighting
- Key visual elements and actions
- Artistic style suggestions
- Camera angle or composition notes

The prompt should be optimized for AI image generation and create a cinematic, storytelling frame.

Return only the image prompt, no additional text or formatting.
`

      const promptResult = await generateText({
        model: openai("gpt-4.1-mini-2025-04-14"),
        prompt: promptGenerationPrompt,
        temperature: 0.7,
      })

      return {
        content: scene.content,
        prompt: promptResult.text.trim(),
        sceneNumber: scene.sceneNumber,
      }
    })

    const scenes = await Promise.all(promptGenerationPromises)

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error("Error processing story:", error)
    return NextResponse.json({ error: "Failed to process story" }, { status: 500 })
  }
}
