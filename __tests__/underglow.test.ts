import {
  DEFAULT_CHANNELS,
  channelsToHex,
  channelsToPosition,
  channelsToWire,
  parseChannels,
  positionToChannels,
} from '../src/utils/underglow';

describe('underglow colour maths', () => {
  it('maps the slider ends to blue and deep pink (never pure red)', () => {
    expect(positionToChannels(0)).toEqual({ r: 0, b: 255 }); // blue
    const hot = positionToChannels(1);
    expect(hot.r).toBe(255);
    expect(hot.b).toBeGreaterThan(0); // a blue floor remains -> not pure red
    expect(hot.b).toBeLessThan(255);
  });

  it('passes through magenta at the midpoint of the arc', () => {
    // hue 300° (magenta) sits 60/105 of the way along the 240→345 arc.
    expect(positionToChannels(60 / 105)).toEqual({ r: 255, b: 255 });
  });

  it('keeps every colour inside the red/blue plane (no green channel)', () => {
    for (let p = 0; p <= 1.0001; p += 0.1) {
      const { r, b } = positionToChannels(p);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(255);
      expect(b).toBeGreaterThanOrEqual(0);
      expect(b).toBeLessThanOrEqual(255);
    }
  });

  it('clamps positions outside 0..1', () => {
    expect(positionToChannels(-1)).toEqual({ r: 0, b: 255 });
    expect(positionToChannels(2)).toEqual(positionToChannels(1));
  });

  it('round-trips position -> channels -> position', () => {
    for (const p of [0, 0.25, 60 / 105, 0.8, 1]) {
      expect(channelsToPosition(positionToChannels(p))).toBeCloseTo(p, 2);
    }
  });

  it('encodes and parses the wire value', () => {
    expect(channelsToWire({ r: 255, b: 64 })).toBe('255,64');
    expect(parseChannels('255,64')).toEqual({ r: 255, b: 64 });
    expect(parseChannels(' 0 , 255 ')).toEqual({ r: 0, b: 255 });
  });

  it('rejects malformed stored values', () => {
    expect(parseChannels('')).toBeNull();
    expect(parseChannels('255')).toBeNull();
    expect(parseChannels('a,b')).toBeNull();
  });

  it('previews as #RR00BB hex with green pinned to 00', () => {
    expect(channelsToHex(DEFAULT_CHANNELS)).toBe('#0000FF'); // blue
    expect(channelsToHex({ r: 255, b: 255 })).toBe('#FF00FF'); // magenta
    expect(channelsToHex({ r: 255, b: 64 })).toBe('#FF0040');
  });
});
