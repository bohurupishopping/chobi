import { NextResponse } from 'next/server';
import { imageStyles, enhancedPromptTemplate, compositionGuides } from '@/config/prompts';
import OpenAI from 'openai';

export const runtime = 'edge';

const getStyleSpecificSystemPrompt = (styleType: string, size: string) => {
  const compositionGuide = compositionGuides[size as keyof typeof compositionGuides] || compositionGuides['1024x1024'];
  const stylePrompt = imageStyles[styleType as keyof typeof imageStyles]?.prompt || '';
  const styleName = imageStyles[styleType as keyof typeof imageStyles]?.name || 'Default Style'; // Fetch style name

  let systemPrompt = enhancedPromptTemplate.replace(
    '<Detailed composition guidance>',
    `<Detailed composition guidance (consider ${compositionGuide}, ${stylePrompt})>`
  );

  // Replace the [Style Name] placeholder with the actual style name
  systemPrompt = systemPrompt.replace(
    '[Style Name]',
    styleName
  );

  return systemPrompt;
};

export async function POST(req: Request) {
  const { prompt, styleType, size = '1024x1024' } = await req.json();

  console.log('Enhance-prompt POST request received with:', { prompt, styleType, size });

  if (!process.env.OPENAI_API_KEY) {
    console.error('OpenAI API key not configured');
    return NextResponse.json(
      { error: 'OpenAI API key not configured' },
      { status: 500 }
    );
  }

  if (!prompt) {
    console.error('Prompt is required but missing');
    return NextResponse.json(
      { error: 'Prompt is required' },
      { status: 400 }
    );
  }

  try {
    const systemPrompt = getStyleSpecificSystemPrompt(styleType, size);
    console.log('Generated system prompt for style:', styleType, 'size:', size);
    console.log('System prompt content:', systemPrompt);

    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
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
          content: prompt
        }
      ],
      temperature: 0.7,
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
