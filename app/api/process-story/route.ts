import { type NextRequest, NextResponse } from "next/server"
import { openai } from "@ai-sdk/openai"
import { generateText } from "ai"

export async function POST(request: NextRequest) {
  try {
    const { story, sceneCount, sectionOnly } = await request.json()

    if (!story || !story.trim()) {
      return NextResponse.json({ error: "Story content is required" }, { status: 400 })
    }

    // First, analyze the story structure
    const analysisPrompt = `
You are an expert story analyst. Analyze the following story to understand its narrative structure, key events, and natural breaking points.

Story to analyze:
${story}

Please provide a brief analysis of the story's structure, including:
1. Main narrative arcs or sections
2. Key events and turning points
3. Scene transitions (location changes, time jumps, POV shifts)
4. Emotional beats and pacing

Respond with a short analysis (2-3 sentences) that will help in creating meaningful scene divisions.`

    // Get story analysis to inform scene splitting
    const analysisResult = await generateText({
      model: openai("gpt-4.1-mini-2025-04-14"),
      prompt: analysisPrompt,
      temperature: 0.2,
    })

    // Section the story based on the analysis
    const sectioningPrompt = `
You are an expert story analyst. Break down the following story into exactly ${sceneCount} logical, visually distinct scenes, ensuring the entire story is covered from beginning to end.

STORY ANALYSIS:
${analysisResult.text}

STORY:
${story}

GUIDELINES:
1. Create exactly ${sceneCount} scenes that cover the entire story from start to finish
2. Each scene should represent a distinct moment, location, or narrative beat
3. Prioritize natural breaks in the story (time jumps, location changes, POV shifts)
4. Ensure each scene has clear visual elements that can be illustrated
5. Maintain narrative flow and continuity between scenes
6. Keep dialogue and action together when they belong to the same scene
7. Distribute content proportionally - longer sections of the story should get more scenes
8. Ensure the division feels natural and maintains the story's pacing
9. The first scene should start at the beginning of the story
10. The last scene should include the story's conclusion

IMPORTANT: 
- The total number of scenes MUST be exactly ${sceneCount}
- The ENTIRE story must be covered with NO content left out
- Each scene should be substantial enough to be meaningful
- Each scene summary must be 4-5 sentences long, providing a detailed description of the scene's key elements, actions, emotions, and context. Avoid short or generic summaries.
- Respond with ONLY a valid JSON object. Do not include any markdown formatting, code blocks, or additional text.

FORMAT:
{
  "scenes": [
    {
      "content": "The actual scene text from the story, including all relevant dialogue and action",
      "sceneNumber": 1,
      "summary": "Detailed 4-5 sentence summary of the scene's key elements, describing the main actions, emotions, and context to provide a richer understanding for illustration or further processing."
    },
    {
      "content": "The next scene text from the story",
      "sceneNumber": 2,
      "summary": "Detailed 4-5 sentence summary of the scene's key elements, describing the main actions, emotions, and context to provide a richer understanding for illustration or further processing."
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
      summary?: string
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

      // Ensure all scenes have required fields
      sectionsData.scenes = sectionsData.scenes.map(scene => ({
        content: scene.content || '',
        sceneNumber: scene.sceneNumber || 0,
        summary: scene.summary || ''
      }))
    } catch (parseError) {
      console.error("Failed to parse sectioning result:", parseError)
      console.error("Cleaned response:", cleanedResponse)

      // Fallback: try to split the story into the exact number of requested scenes
      // First, split the story into words to ensure even distribution
      const words = story.split(/\s+/);
      const wordsPerScene = Math.max(1, Math.ceil(words.length / sceneCount));
      
      // Initialize sections data
      sectionsData = {
        scenes: [] as Scene[],
      };
      
      // Split into scenes based on word count, but try to respect paragraph boundaries
      const currentSceneWords: string[] = [];
      let currentSceneNumber = 1;
      
      // First, try to split by paragraphs if they exist
      const paragraphs = story.split(/\n\s*\n+/).filter((p: string) => p.trim().length > 0);
      
      if (paragraphs.length > 0) {
        // Calculate target words per paragraph to distribute scenes
        const totalWords = words.length;
        let wordCount = 0;
        let currentScene: string[] = [];
        
        for (const paragraph of paragraphs) {
          const paragraphWords = paragraph.split(/\s+/);
          const paragraphWordCount = paragraphWords.length;
          
          // If adding this paragraph would exceed the target words per scene,
          // finalize the current scene and start a new one
          if (currentScene.length > 0 && 
              (wordCount + paragraphWordCount) > (currentSceneNumber * wordsPerScene)) {
            sectionsData.scenes.push({
              content: currentScene.join(' '),
              sceneNumber: currentSceneNumber,
              summary: `Scene ${currentSceneNumber} (automatically generated)`
            });
            currentScene = [];
            currentSceneNumber++;
          }
          
          currentScene.push(paragraph);
          wordCount += paragraphWordCount;
        }
        
        // Add the last scene if there's any content left
        if (currentScene.length > 0 && currentSceneNumber <= sceneCount) {
          sectionsData.scenes.push({
            content: currentScene.join(' '),
            sceneNumber: currentSceneNumber,
            summary: `Scene ${currentSceneNumber} (automatically generated)`
          });
        }
        
        // If we didn't create enough scenes, split the largest scenes
        while (sectionsData.scenes.length < sceneCount) {
          // Find the longest scene
          let longestSceneIndex = 0;
          let maxLength = 0;
          
          sectionsData.scenes.forEach((scene, index) => {
            if (scene.content.length > maxLength) {
              maxLength = scene.content.length;
              longestSceneIndex = index;
            }
          });
          
          // Split the longest scene in half
          const sceneToSplit = sectionsData.scenes[longestSceneIndex];
          const splitPoint = Math.floor(sceneToSplit.content.length / 2);
          const firstHalf = sceneToSplit.content.substring(0, splitPoint);
          const secondHalf = sceneToSplit.content.substring(splitPoint);
          
          // Update the scenes array
          const newScenes = [
            ...sectionsData.scenes.slice(0, longestSceneIndex),
            {
              ...sceneToSplit,
              content: firstHalf,
              summary: `Part 1 of split scene ${sceneToSplit.sceneNumber}`
            },
            {
              ...sceneToSplit,
              content: secondHalf,
              sceneNumber: sceneToSplit.sceneNumber + 0.5, // Temporary number
              summary: `Part 2 of split scene ${sceneToSplit.sceneNumber}`
            },
            ...sectionsData.scenes.slice(longestSceneIndex + 1)
          ];
          
          // Renumber all scenes
          sectionsData.scenes = newScenes.map((scene, index) => ({
            ...scene,
            sceneNumber: index + 1
          }));
        }
      } else {
        // Fall back to sentence-based splitting if no paragraphs found
        const sentences = story.split(/(?<=[.!?])\s+/).filter((s: string) => s.trim().length > 20);
        const sentencesPerScene = Math.max(1, Math.ceil(sentences.length / sceneCount));
        
        for (let i = 0; i < sceneCount && i * sentencesPerScene < sentences.length; i++) {
          const startIdx = i * sentencesPerScene;
          const endIdx = Math.min((i + 1) * sentencesPerScene, sentences.length);
          const sceneContent = sentences.slice(startIdx, endIdx).join(' ');
          
          sectionsData.scenes.push({
            content: sceneContent,
            sceneNumber: i + 1,
            summary: `Scene ${i + 1} (automatically generated)`
          });
        }
      }
    }

    // If sectionOnly flag is true, return just the sections without generating prompts
    if (sectionOnly) {
      return NextResponse.json({ scenes: sectionsData.scenes })
    }

    // Generate image prompts for each section with enhanced context
    const promptGenerationPromises = sectionsData.scenes.map(async (scene: Scene) => {
      const promptGenerationPrompt = `
You are an expert at creating image generation prompts for AI art tools like DALL-E, Midjourney, and Stable Diffusion.

SCENE SUMMARY:
${scene.summary || 'No summary available'}

FULL SCENE CONTEXT:
${scene.content}

Create a detailed, vivid image prompt that captures the essence of this scene. Focus on these elements:

1. CHARACTERS (if present):
   - Physical appearance, clothing, and distinguishing features
   - Emotional state and expressions
   - Posture and body language
   - Key actions or interactions

2. ENVIRONMENT:
   - Location and setting details
   - Time of day and lighting conditions
   - Weather and atmospheric effects
   - Notable objects or props

3. COMPOSITION:
   - Camera angle and perspective
   - Framing and focus
   - Depth of field
   - Rule of thirds or other compositional techniques

4. STYLE & MOOD:
   - Artistic style (e.g., cinematic, photorealistic, painterly)
   - Color palette and lighting
   - Emotional tone and atmosphere
   - Any specific art style references if relevant

5. ADDITIONAL NOTES:
   - Focus on visual elements that tell the story
   - Include subtle details that enhance the narrative
   - Consider the scene's role in the larger story
   - Ensure the prompt is optimized for AI image generation

IMPORTANT:
- Be specific and detailed in your descriptions
- Maintain consistency with the scene's content
- Focus on what can be visually represented
- Keep the prompt clear and well-structured
- Return ONLY the image prompt, no additional text or formatting.`

      const promptResult = await generateText({
        model: openai("gpt-4.1-mini-2025-04-14"),
        prompt: promptGenerationPrompt,
        temperature: 0.7,
      })

      return {
        content: scene.content,
        prompt: promptResult.text.trim(),
        sceneNumber: scene.sceneNumber,
        summary: scene.summary || ''
      }
    })

    const scenes = await Promise.all(promptGenerationPromises)

    return NextResponse.json({ scenes })
  } catch (error) {
    console.error("Error processing story:", error)
    return NextResponse.json({ error: "Failed to process story" }, { status: 500 })
  }
}
