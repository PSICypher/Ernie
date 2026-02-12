import { NextResponse } from 'next/server';
import { createRouteHandlerClient } from '@/lib/supabase-server';
import { extractFromUrl } from '@/lib/openai';

function stripHtml(input: string) {
  return input.replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function POST(request: Request) {
  const supabase = createRouteHandlerClient();
  const { data: { user }, error: authError } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { url, item_type } = body;
  if (!url || !item_type) {
    return NextResponse.json({ error: 'url and item_type are required' }, { status: 400 });
  }

  const response = await fetch(url);
  if (!response.ok) {
    return NextResponse.json({ error: `Failed to fetch URL (${response.status})` }, { status: 400 });
  }
  const html = await response.text();
  const text = stripHtml(html).slice(0, 12000);

  const prompt = `Extract structured data for item type ${item_type} from this page content:\n${text}`;
  const resultText = await extractFromUrl(prompt);

  let parsed: any = resultText;
  try {
    parsed = JSON.parse(resultText);
  } catch {
    parsed = { raw: resultText };
  }

  return NextResponse.json({ extracted: parsed, source_url: url });
}
