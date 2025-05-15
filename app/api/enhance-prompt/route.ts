import { NextResponse } from 'next/server';
import OpenAI from 'openai';

export const runtime = 'edge';

const systemPrompt = `You are an expert at enhancing image generation prompts, specializing in creating vivid, cinematic scenes with strong subject focus and environmental storytelling. Follow these steps to enhance the prompt:

1. Subject Focus:
   - Identify and enhance the main subject's details
   - Specify pose, expression, and key characteristics
   - Add relevant emotional elements and personality traits
   - Ensure the subject stands out while maintaining scene harmony

2. Environmental Context:
   - Develop the scene's atmosphere and mood
   - Add specific lighting details (time of day, light sources, shadows)
   - Include environmental elements that support the story
   - Balance foreground, midground, and background elements

3. Compositional Elements:
   - Suggest camera angle and perspective (example : top view, side view, front view, back view, etc.)
   - Specify depth of field and focus points
   - Add dynamic elements for visual interest
   - Consider scene framing and visual flow
   - Add a description of the scene in the form of a story
   - camera lens focal length (example : 35mm, 50mm, 85mm, 135mm, etc.)

Format the enhanced prompt in clear, logical sections while maintaining natural flow. Keep the original intent but make it more vivid and specific.

Example Structure:
Main Subject: [Enhanced subject description with emotional elements]
Scene Context: [Environmental and atmospheric details]
Composition: [Camera and framing specifics]

Keep the enhanced prompt natural and flowing, focusing on the creative and narrative aspects of the scene.`;

export async function POST(req: Request) {
  try {
    const { prompt, apiKey } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    if (!apiKey) {
      return NextResponse.json(
        { error: 'OpenAI API key is required. Please add an API key in settings.' },
        { status: 400 }
      );
    }

    const openai = new OpenAI({
      apiKey: apiKey,
    });

    const response = await openai.chat.completions.create({
      model: 'gpt-4.1-nano-2025-04-14',
      messages: [
        {
          role: 'system',
          content: systemPrompt
        },
        {
          role: 'user',
          content: `Original prompt: "${prompt}"

Please enhance this prompt focusing on:
1. Making the main subject more vivid and detailed
2. Creating a rich environmental context
3. Specifying natural compositional elements

Keep the enhanced prompt flowing and narrative while maintaining the original intent.`
        }
      ],
      temperature: 0.6,
      stream: true
    });

    // Create a streaming response
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of response) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ content })}\n\n`));
            }
          }
        } catch (error) {
          console.error('Error in stream processing:', error);
          controller.enqueue(
            new TextEncoder().encode(
              `data: ${JSON.stringify({ error: 'Error processing stream' })}\n\n`
            )
          );
        } finally {
          controller.close();
        }
      }
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive'
      }
    });
  } catch (error) {
    console.error('Error in enhance-prompt route:', error);
    return NextResponse.json(
      { error: 'Failed to enhance prompt' },
      { status: 500 }
    );
  }
} 