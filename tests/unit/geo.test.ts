import { describe, expect, it } from 'vitest';
import { parseLatLng } from '@/lib/geo';

describe('parseLatLng', () => {
  it('parses direct {lat,lng}', () => {
    expect(parseLatLng({ lat: 1, lng: 2 })).toEqual({ lat: 1, lng: 2 });
  });

  it('parses JSON string', () => {
    expect(parseLatLng(JSON.stringify({ lat: 10.5, lng: -80.25 }))).toEqual({ lat: 10.5, lng: -80.25 });
  });

  it('parses nested {coordinates:{lat,lng}}', () => {
    expect(parseLatLng({ coordinates: { lat: 3, lng: 4 } })).toEqual({ lat: 3, lng: 4 });
  });

  it('returns null for invalid input', () => {
    expect(parseLatLng(null)).toBeNull();
    expect(parseLatLng({})).toBeNull();
    expect(parseLatLng('{not json')).toBeNull();
    expect(parseLatLng({ lat: '1', lng: 2 })).toBeNull();
  });
});

