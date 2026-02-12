export interface Suggestion {
  name: string;
  cost?: number;
  pros?: string[];
  cons?: string[];
  description?: string;
}

export function parseStructuredSuggestions(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  const sections = text.split(/\n(?=\d+\.\s|\*\*[^*]+\*\*)/);

  for (const section of sections) {
    const nameMatch = section.match(/\*\*([^*]+)\*\*/);
    const name = nameMatch?.[1] || section.split('\n')[0]?.trim();
    if (!name) continue;

    const costMatch = section.match(/£(\d+(?:,\d{3})*(?:\.\d{2})?)/);
    const cost = costMatch ? parseFloat(costMatch[1].replace(/,/g, '')) : undefined;

    const pros = Array.from(section.matchAll(/(?:[-•✓✅])\s*(?:Pro|Pros|Advantage|Good)?:?\s*(.+)/gi)).map(
      (m) => m[1].trim()
    );
    const cons = Array.from(section.matchAll(/(?:[-•✗❌])\s*(?:Con|Cons|Disadvantage|Bad)?:?\s*(.+)/gi)).map(
      (m) => m[1].trim()
    );

    suggestions.push({ name, cost, pros, cons });
  }

  return suggestions.slice(0, 8);
}
