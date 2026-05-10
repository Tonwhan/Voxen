import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!body || !body.parts) {
      return NextResponse.json({ error: 'Assembly parts are required' }, { status: 400 });
    }

    // Connect to your GPU server directly
    const AI_ENGINE_URL = process.env.AI_ENGINE_URL || 'http://165.245.132.104:7860/generate';
    // The export endpoint is on the same host but /export_step
    const exportUrl = AI_ENGINE_URL.replace('/generate', '/export_step');

    console.log(`Sending STEP export request to AI Engine: ${exportUrl}`);

    const response = await fetch(exportUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `AI Engine error: ${response.status}`, details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Error proxying STEP export to AI Engine:', error);
    return NextResponse.json(
      { error: 'Failed to connect to AI Engine for STEP export', details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
