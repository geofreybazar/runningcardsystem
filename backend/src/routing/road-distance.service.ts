import { Injectable, Logger } from '@nestjs/common';
import { haversineKm, type LatLng } from '../running-card/running-card.logic.js';

/** Road km per station, and whether it came from the router (`byRoad`) or is the straight-line fallback. */
export interface StationDistance {
  distance: number;
  byRoad: boolean;
}

const TIMEOUT_MS = 2000;
const coord = (p: LatLng) => `${p.lng},${p.lat}`;

/**
 * Driving distance from each station to the fire, from the self-hosted OSRM router (`OSRM_URL`, OpenStreetMap roads).
 * One table request: the stations are the sources and the fire the only destination, so one-way streets count in the
 * direction a truck drives. The card must never fail because routing is down: without `OSRM_URL`, on an error or a
 * timeout, every station gets its straight-line distance instead, and a station OSRM can't reach gets its own.
 */
@Injectable()
export class RoadDistanceService {
  private readonly log = new Logger(RoadDistanceService.name);
  private down = false; // warn once per outage, not on every card

  private readonly baseUrl: string | undefined;

  constructor(baseUrl = process.env.OSRM_URL) {
    this.baseUrl = baseUrl?.replace(/\/+$/, '') || undefined;
  }

  async fromStations(fire: LatLng, stations: LatLng[]): Promise<StationDistance[]> {
    const straight = () => stations.map((s) => ({ distance: haversineKm(fire, s), byRoad: false }));
    if (!this.baseUrl || stations.length === 0) return straight();
    const sources = stations.map((_, i) => i + 1).join(';');
    const url = `${this.baseUrl}/table/v1/driving/${[fire, ...stations].map(coord).join(';')}?sources=${sources}&destinations=0&annotations=distance`;
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
      const body = (await res.json()) as { code?: string; message?: string; distances?: (number | null)[][] };
      if (!res.ok || body.code !== 'Ok' || body.distances?.length !== stations.length) throw new Error(body.message ?? body.code ?? `HTTP ${res.status}`);
      if (this.down) this.log.log('OSRM is answering again: road distances are back');
      this.down = false;
      return stations.map((s, i) => {
        const metres = body.distances![i][0];
        return metres == null ? { distance: haversineKm(fire, s), byRoad: false } : { distance: metres / 1000, byRoad: true };
      });
    } catch (err) {
      if (!this.down) this.log.warn(`OSRM unavailable, using straight-line distances: ${(err as Error).message}`);
      this.down = true;
      return straight();
    }
  }
}
