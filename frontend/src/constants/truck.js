export const TRUCK_TYPES = {
  ENGINE: "Engine / Pumper",
  TANKER: "Water Tanker",
  AERIAL_LADDER: "Aerial Ladder",
  RESCUE: "Rescue",
  AMBULANCE: "Ambulance",
  OTHER: "Other",
};

export const OWNERSHIP = { BFP: "BFP", LGU: "LGU" };

export const TRUCK_STATUS = {
  AVAILABLE: { label: "Available", className: "bg-success/15 text-success border-success/30" },
  RESPONDING: { label: "Responding", className: "bg-warning/15 text-[oklch(0.5_0.13_60)] border-warning/40" },
  OUT_OF_SERVICE: { label: "Out of service", className: "bg-muted text-muted-foreground" },
  DEPLOYED: { label: "Deployed", className: "bg-gold/20 text-foreground border-gold/50" }, // the gold accent: away on a planned event
};

/** Statuses station editors may set; DEPLOYED comes only from a special deployment. */
export const EDITABLE_TRUCK_STATUS = Object.fromEntries(Object.entries(TRUCK_STATUS).filter(([s]) => s !== "DEPLOYED"));

export const toOptions = (labels) => Object.entries(labels).map(([value, l]) => ({ value, label: l.label ?? l }));
