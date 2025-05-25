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
    const model = modelProvider === "gemini" ? google("gemini-2.0-flash") : openai("gpt-4.1-mini-2025-04-14")

    const prompt = `You are an expert at creating cinematic image generation prompts for animated movie-style storytelling. 

Here is the entire horror story:
${story}

CRITICAL REQUIREMENTS:
- You MUST generate exactly ${sceneCount} scenes total (50 scenes total for the complete story)
- ${continueFrom ? `Continue from scene ${startScene} to scene ${endScene}` : `Generate scenes 1 to ${sceneCount}`}
- Each scene MUST cover a portion of the story chronologically
- The story MUST be completely covered from beginning to end across all 50 scenes
- Focus on creating horror-themed, atmospheric, and visually striking scenes
- Each scene should be a complete visual moment that advances the story

Your task is to:
1. Analyze the complete horror story structure, characters, and narrative flow
2. ${continueFrom ? `Continue breaking down the story from scene ${startScene}` : `Break down the story into exactly ${sceneCount} distinct cinematic scenes`}
3. Ensure the entire story is covered chronologically across all 50 scenes
4. For each scene, create a detailed image generation prompt following the structure below

IMPORTANT: You must respond in this EXACT JSON format for each scene:

SCENE_START_[NUMBER]
STORY_CONTENT: [A brief 2-3 word Bengali/English description of the scene]
PROMPT: [A detailed horror-themed prompt in the following JSON structure]
SCENE_END

For the PROMPT section, use this structure (output as valid JSON):

{
  "sceneNumber": [scene number],
  "prompt": "Main Subject: [Detailed description of characters including gender, appearance, clothing, facial expressions, and actions. Example: 'A young woman in her 20s with long black hair, wearing a torn white dress, her face frozen in terror as she looks over her shoulder. Her eyes are wide with fear, lips slightly parted in a silent scream.']\n\nScene Context: [Atmospheric details including location, time of day, weather, lighting. Example: 'A decrepit Victorian mansion at midnight during a thunderstorm. Lightning flashes reveal peeling wallpaper and broken furniture. The air is thick with dust and the scent of decay.']\n\nComposition: [Camera angle, framing, and visual elements. Example: 'Medium close-up shot with a slightly low angle, making the character appear vulnerable. The frame is tight with shallow depth of field, focusing on the character's terrified expression while the background blurs into darkness.']\n\nStyle Notes: [Artistic style, color palette, and mood. Example: 'Dark, cinematic horror aesthetic with high contrast lighting. Color palette of deep blues, sickly greens, and blood red accents. Inspired by Japanese horror films with subtle visual distortion to create unease.']",
  "content": "[2-3 word Bengali/English description]"
}

GUIDELINES FOR HORROR PROMPTS:
- Focus on creating a strong sense of atmosphere and tension in every scene
- Include detailed character descriptions (gender, age, appearance, clothing, emotions)
- Emphasize environmental storytelling - the setting should feel like a character itself
- Use lighting and weather to enhance the horror mood (moonlight, flickering lights, fog, rain)
- Include specific horror elements (shadows, reflections, subtle background details)
- Maintain visual consistency for characters and locations throughout the scenes
- No dialogue or text in the images
- Each scene should be a complete, visually compelling moment
- Focus on showing, not telling - the horror should be visual and atmospheric
- Use cinematic composition techniques (rule of thirds, leading lines, framing)
- Describe specific facial expressions and body language that convey fear, tension, or dread
- Include subtle horror elements in the background that might be noticed on second glance
- Use color psychology to enhance the mood (blues for cold fear, reds for danger, etc.)
- Vary camera angles and distances to create visual interest and emotional impact
- Ensure smooth transitions between scenes to maintain narrative flow
- Each prompt should be detailed enough for high-quality AI image generation
- The 'content' field should be a simple 2-3 word description in Bengali/English
- The 'prompt' field should be a detailed, multi-paragraph description
- Focus on creating a sense of unease and tension even in quieter scenes
- Remember that horror is often most effective when it's subtle and psychological
- Use environmental storytelling to hint at backstory and build atmosphere
- Include specific, concrete details that make the horror feel real and immediate
- Vary the types of horror (psychological, supernatural, body horror, etc.) to keep it interesting
- Ensure the horror elements are culturally appropriate and respectful
- The final output should be a cohesive, terrifying visual narrative when viewed in sequence

ENSURE you generate ALL requested scenes from ${startScene} to ${endScene} out of the total 50 scenes.

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
