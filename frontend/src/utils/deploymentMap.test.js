import { test } from "node:test";
import assert from "node:assert/strict";
import { deployedTruckMarkers } from "./deploymentMap.js";

const unit = (id, extra = {}) => ({
  id,
  releasedAt: null,
  postLabel: null,
  postLat: null,
  postLng: null,
  truck: { callSign: `E-${id}` },
  station: { name: "Tondo FS", city: { name: "Manila" }, district: { color: "#c00" } },
  ...extra,
});

test("trucks still deployed are drawn at their post (or the event), with where and whose in the tooltip", () => {
  const deployment = {
    lat: 14.6,
    lng: 121,
    locationLabel: "Batasan",
    units: [unit(1), unit(2, { postLabel: "Quiapo Church", postLat: 14.59, postLng: 120.98 }), unit(3, { releasedAt: "x" })],
  };
  assert.deepEqual(
    deployedTruckMarkers(deployment).map((m) => [m.id, m.position, m.title, m.details]),
    [
      [1, { lat: 14.6, lng: 121 }, "E-1", ["Post: Batasan (event location)", "Tondo FS, Manila"]],
      [2, { lat: 14.59, lng: 120.98 }, "E-2", ["Post: Quiapo Church", "Tondo FS, Manila"]],
    ],
  );
});
