import type { NextRequest } from "next/server"
import { openai } from "@ai-sdk/openai"
import { google } from "@ai-sdk/google"
import { streamText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { story, sceneCount, continueFrom, modelProvider = "openai" } = await request.json()

    if (!story || !story.trim()) {
      return new Response("Story content is required", { status: 400 })
    }

    const startScene = continueFrom ? continueFrom + 1 : 1
    const endScene = sceneCount

    // Select the model based on provider
    const model = modelProvider === "gemini" ? google("gemini-2.0-flash-exp") : openai("gpt-4.1-mini-2025-04-14")

    const prompt = `You are an expert at creating cinematic image generation prompts for animated movie-style storytelling. 

Here is the entire story:
${story}

CRITICAL REQUIREMENTS:
- You MUST generate exactly ${sceneCount} scenes total
- ${continueFrom ? `Continue from scene ${startScene} to scene ${endScene}` : `Generate scenes 1 to ${sceneCount}`}
- Each scene MUST cover a portion of the story chronologically
- The story MUST be completely covered from beginning to end across all ${sceneCount} scenes
- Do NOT skip any parts of the story
- Distribute the story content evenly across all ${sceneCount} scenes

Your task is to:
1. Analyze the complete story structure, characters, and narrative flow
2. ${continueFrom ? `Continue breaking down the story from scene ${startScene}` : `Break down the story into exactly ${sceneCount} distinct cinematic scenes`}
3. Ensure the entire story is covered chronologically
4. For each scene, extract the relevant story content, then create a detailed image generation prompt

IMPORTANT: You must respond in this EXACT format for each scene:

SCENE_START_[NUMBER]
STORY_CONTENT: [Extract the specific part of the story that this scene represents - actual dialogue, actions, and narrative from the original story]
PROMPT: [Your detailed cinematic image prompt following the structure below]
SCENE_END

For the PROMPT section, use this structure:

Main Subject: [Enhanced subject description with emotional elements - include character gender, appearance, clothing, facial expressions, body language, and specific actions they're performing]

Scene Context: [Environmental and atmospheric details - location, time of day, weather, lighting conditions, mood, and any relevant background elements]

Composition: [Camera angle, framing, perspective, depth of field, and visual composition notes that would make this scene cinematic]

Style Notes: [Artistic style, color palette, lighting effects, and any specific visual techniques that enhance the storytelling]

GUIDELINES:
- Focus on actual scenes with characters performing specific actions
- Include detailed character descriptions (gender, appearance, emotions, clothing)
- Make each scene feel like a frame from an animated movie
- Ensure scenes flow logically to tell the complete story
- Focus on visual storytelling - what can be seen and felt in the image
- Include environmental details that set the mood and atmosphere
- Make prompts detailed enough for high-quality AI image generation
- Maintain character consistency throughout the scenes
- Include specific lighting and composition notes for cinematic quality
- ENSURE you generate ALL requested scenes from ${startScene} to ${endScene}

${continueFrom ? `Continue generating scenes ${startScene} through ${endScene} now:` : `Generate all ${sceneCount} scenes now (1 through ${sceneCount}):`}`

    const encoder = new TextEncoder()

    const stream = new ReadableStream({
      async start(controller) {
        try {
          let sceneCounter = continueFrom || 0
          let buffer = ""

          // Send initial progress
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                progress: continueFrom ? (continueFrom / sceneCount) * 100 : 0,
                message: continueFrom
                  ? `Continuing from scene ${startScene} using ${modelProvider === "gemini" ? "Google Gemini" : "OpenAI GPT-4"}...`
                  : `Analyzing story structure using ${modelProvider === "gemini" ? "Google Gemini" : "OpenAI GPT-4"}...`,
              })}\n\n`,
            ),
          )

          const result = await streamText({
            model,
            prompt,
            temperature: 0.7,
            maxTokens: 4000,
          })

          for await (const delta of result.textStream) {
            buffer += delta

            // Look for complete scenes
            const sceneMatches = buffer.match(/SCENE_START_(\d+)([\s\S]*?)SCENE_END/g)

            if (sceneMatches) {
              for (const match of sceneMatches) {
                const sceneNumberMatch = match.match(/SCENE_START_(\d+)/)
                const contentMatch = match.match(/STORY_CONTENT:\s*([\s\S]*?)(?=PROMPT:)/)
                const promptMatch = match.match(/PROMPT:\s*([\s\S]*?)(?=SCENE_END)/)

                if (sceneNumberMatch && contentMatch && promptMatch) {
                  const sceneNumber = Number.parseInt(sceneNumberMatch[1])
                  const storyContent = contentMatch[1].trim()
                  const promptContent = promptMatch[1].trim()

                  if (sceneNumber > sceneCounter) {
                    sceneCounter = sceneNumber

                    // Send the scene data
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "scene",
                          scene: {
                            sceneNumber,
                            content: storyContent,
                            prompt: promptContent,
                          },
                        })}\n\n`,
                      ),
                    )

                    // Update progress
                    const progress = (sceneCounter / sceneCount) * 100
                    controller.enqueue(
                      encoder.encode(
                        `data: ${JSON.stringify({
                          type: "progress",
                          progress: Math.min(progress, 95),
                          message: `Generated scene ${sceneCounter} of ${sceneCount} using ${modelProvider === "gemini" ? "Google Gemini" : "OpenAI GPT-4"}...`,
                        })}\n\n`,
                      ),
                    )

                    // Remove processed scene from buffer
                    buffer = buffer.replace(match, "")
                  }
                }
              }
            }
          }

          // Final progress update
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "progress",
                progress: 100,
                message:
                  sceneCounter >= sceneCount
                    ? "Generation complete!"
                    : `Generated ${sceneCounter} scenes. You can continue generating more.`,
              })}\n\n`,
            ),
          )

          // Send completion
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "complete",
                totalScenes: sceneCounter,
                isComplete: sceneCounter >= sceneCount,
              })}\n\n`,
            ),
          )

          controller.close()
        } catch (error) {
          console.error("Stream error:", error)
          controller.enqueue(
            encoder.encode(
              `data: ${JSON.stringify({
                type: "error",
                message: "Failed to generate story prompts",
              })}\n\n`,
            ),
          )
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Error in generate-story-prompts:", error)
    return new Response("Internal server error", { status: 500 })
  }
}
