import { NextResponse } from 'next/server';
import { runAssistant, type AssistantContext } from '@/lib/assistant/engine';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  let body: { message?: string; context?: AssistantContext };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const message = (body.message ?? '').toString().slice(0, 600);
  if (!message.trim()) {
    return NextResponse.json({ error: 'message is required' }, { status: 400 });
  }

  const context: AssistantContext = {
    products: body.context?.products ?? [],
    cart: body.context?.cart ?? [],
    orders: body.context?.orders ?? [],
    focus: body.context?.focus ?? [],
  };

  // Deliberate small delay so the typing indicator reads as a real round trip.
  await new Promise((r) => setTimeout(r, 420));

  const result = runAssistant(message, context);
  return NextResponse.json(result);
}
