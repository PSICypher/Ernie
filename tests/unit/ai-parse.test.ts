import { describe, expect, it } from 'vitest';
import { parseStructuredSuggestions } from '@/lib/ai-parse';

describe('parseStructuredSuggestions', () => {
  it('parses names and costs', () => {
    const text = `1. **Hotel A**\n£200 per night\n- Pros: Great pool\n- Cons: No breakfast`;
    const suggestions = parseStructuredSuggestions(text);
    expect(suggestions[0]?.name).toBe('Hotel A');
    expect(suggestions[0]?.cost).toBe(200);
  });
});
