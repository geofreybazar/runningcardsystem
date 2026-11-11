import { afterEach, vi } from 'vitest';
import { haversineKm } from '../running-card/running-card.logic.js';
import { RoadDistanceService } from './road-distance.service.js';

const fire = { lat: 14.5986, lng: 120.9836 };
const a = { lat: 14.6, lng: 121.0 };
const b = { lat: 14.61, lng: 120.99 };
const reply = (body: object, status = 200) => vi.fn(async () => new Response(JSON.stringify(body), { status }));

describe('RoadDistanceService', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('asks OSRM for station -> fire road distances in one table request', async () => {
    const fetch = reply({ code: 'Ok', distances: [[2500], [4100]] });
    vi.stubGlobal('fetch', fetch);
    const out = await new RoadDistanceService('http://osrm:5000/').fromStations(fire, [a, b]);
    expect(out).toEqual([{ distance: 2.5, byRoad: true }, { distance: 4.1, byRoad: true }]);
    expect(String(fetch.mock.calls[0][0])).toBe(
      'http://osrm:5000/table/v1/driving/120.9836,14.5986;121,14.6;120.99,14.61?sources=1;2&destinations=0&annotations=distance',
    );
  });

  it('falls back to straight line for a station OSRM cannot reach', async () => {
    vi.stubGlobal('fetch', reply({ code: 'Ok', distances: [[2500], [null]] }));
    const out = await new RoadDistanceService('http://osrm:5000').fromStations(fire, [a, b]);
    expect(out[0]).toEqual({ distance: 2.5, byRoad: true });
    expect(out[1]).toEqual({ distance: haversineKm(fire, b), byRoad: false });
  });

  it.each([
    ['an error reply', () => reply({ code: 'InvalidQuery', message: 'Too many table coordinates' }, 400)],
    ['a network failure', () => vi.fn(async () => Promise.reject(new TypeError('fetch failed')))],
  ])('uses straight-line distances on %s', async (_, make) => {
    vi.stubGlobal('fetch', make());
    const out = await new RoadDistanceService('http://osrm:5000').fromStations(fire, [a]);
    expect(out).toEqual([{ distance: haversineKm(fire, a), byRoad: false }]);
  });

  it('uses straight-line distances without OSRM_URL, without calling out', async () => {
    const fetch = vi.fn();
    vi.stubGlobal('fetch', fetch);
    expect(await new RoadDistanceService(undefined).fromStations(fire, [a])).toEqual([{ distance: haversineKm(fire, a), byRoad: false }]);
    expect(fetch).not.toHaveBeenCalled();
  });
});
