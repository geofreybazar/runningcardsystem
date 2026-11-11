/**
 * Station distances are road km from the OSRM router. When it was unreachable the API sends the straight-line km and
 * `byRoad: false`; incidents saved before road distances have no `byRoad` and are not flagged.
 */
export const isStraightLine = (station) => station.byRoad === false;

/** True when any listed station's distance is the straight-line fallback, so the order may not match the roads. */
export const anyStraightLine = (stations) => stations.some(isStraightLine);

export const STRAIGHT_LINE_HINT = "Straight-line distance: road routing was unavailable";
