export const TRUCK_TYPES = {
  ENGINE: "Engine / Pumper",
  TANKER: "Water Tanker",
  AERIAL_LADDER: "Aerial Ladder",
  RESCUE: "Rescue",
  AMBULANCE: "Ambulance",
  OTHER: "Other",
};

/** Types a truck can be given; Ambulance and Rescue stay above only to label older records. Mirrors stations.dto.ts. */
export const NEW_TRUCK_TYPES = ["ENGINE", "TANKER", "AERIAL_LADDER", "OTHER"];

export const OWNERSHIP = { BFP: "BFP", LGU: "LGU", VOLUNTEER: "Volunteer" };

export const TRUCK_STATUS = {
  AVAILABLE: { label: "Available", className: "bg-success/15 text-success border-success/30" },
  RESPONDING: { label: "Responding", className: "bg-warning/15 text-[oklch(0.5_0.13_60)] border-warning/40" },
  OUT_OF_SERVICE: { label: "Out of service", className: "bg-muted text-muted-foreground" },
};

export const toOptions = (labels) => Object.entries(labels).map(([value, l]) => ({ value, label: l.label ?? l }));
