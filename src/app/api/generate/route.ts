import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const prompt = body.prompt;

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required', code: 'VALIDATION_ERROR' }, { status: 400 });
    }

    // Connect to your GPU server directly
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://129.212.188.102:30000/generate';
    console.log(`Sending AI generation request to: ${AI_ENGINE_URL}`);

    const response = await fetch(AI_ENGINE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AI Engine error: ${response.status}`, code: 'LLM_ERROR', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error proxying to AI Engine:', error);
    return NextResponse.json(
      { error: 'Failed to connect to AI Engine', code: 'NETWORK_ERROR', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
