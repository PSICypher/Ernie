import OpenAI from 'openai';

const DEFAULT_MODEL = 'gpt-5';

function getClient() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error('OPENAI_API_KEY is not set');
  return new OpenAI({ apiKey });
}

async function runOpenAI({
  system,
  prompt,
  maxTokens
}: {
  system: string;
  prompt: string;
  maxTokens: number;
}) {
  const client = getClient();
  const model = process.env.OPENAI_MODEL || DEFAULT_MODEL;

  const response = await client.responses.create({
    model,
    max_output_tokens: maxTokens,
    input: [
      { role: 'system', content: system },
      { role: 'user', content: prompt }
    ]
  });

  const text = response.output_text;
  if (!text) {
    throw new Error('OpenAI response returned no text');
  }

  return text;
}

export async function conductResearch(prompt: string) {
  return runOpenAI({
    system:
      'You are a travel research assistant helping plan a family holiday. Provide specific, actionable recommendations with names of actual places, approximate costs in GBP, pros/cons, booking tips, and family-friendliness ratings. Be concise but thorough. Format responses with clear sections.',
    prompt,
    maxTokens: 2000
  });
}

export async function comparePlans(prompt: string) {
  return runOpenAI({
    system:
      'You are a travel planning expert. Analyze these holiday plan options and provide: 1) key differences summary 2) cost analysis 3) experience quality comparison 4) practical considerations 5) recommendation based on value for money. Be objective and highlight trade-offs clearly.',
    prompt,
    maxTokens: 1500
  });
}

export async function getItinerarySuggestions(prompt: string) {
  return runOpenAI({
    system:
      'You are a travel planning assistant. Based on the current itinerary, provide helpful suggestions. Consider timing, logistics, family-friendliness, value for money, local knowledge, and practical tips. Keep suggestions specific and actionable.',
    prompt,
    maxTokens: 1000
  });
}

export async function getCostOptimisationTips(prompt: string) {
  return runOpenAI({
    system:
      'You are a travel budget optimisation expert. Analyse the holiday cost breakdown and provide specific savings opportunities with estimated amounts in the trip currency, alternative options that maintain quality, timing-based savings, category-by-category recommendations, and a prioritised list of top actions ranked by savings potential. Be specific with numbers and format with clear headings and bullets.',
    prompt,
    maxTokens: 1500
  });
}

export async function planChangeResearch(prompt: string) {
  return runOpenAI({
    system:
      'You are helping modify a family holiday plan. Suggest 2-4 concrete alternatives with pros/cons, include estimated costs in GBP, and include an applyData object matching the database schema. Respond with valid JSON in the format: { "text": "...", "options": [ { "name": "", "type": "", "cost": 0, "currency": "GBP", "location": "", "description": "", "pros": [], "cons": [], "applyData": {} } ] }',
    prompt,
    maxTokens: 3000
  });
}

export async function extractFromUrl(prompt: string) {
  return runOpenAI({
    system:
      'Extract structured booking data from the provided page content. Return JSON only with fields relevant to the item type.',
    prompt,
    maxTokens: 1500
  });
}

export async function generateTripPlan(prompt: string) {
  return runOpenAI({
    system:
      'Generate a complete trip plan in JSON with days, accommodations, transport, and estimated costs. The JSON must match the schema described.',
    prompt,
    maxTokens: 4000
  });
}

export async function generatePackingList(prompt: string) {
  return runOpenAI({
    system:
      'Generate a packing list in JSON array format with { category, name, quantity } items. Use categories: Clothes, Toiletries, Electronics, Documents, Kids, Beach/Pool, Medications, Misc.',
    prompt,
    maxTokens: 2000
  });
}
