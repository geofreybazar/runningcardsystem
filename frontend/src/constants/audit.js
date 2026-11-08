/** Filters on the Audit log page: entity name → label. */
export const AUDIT_ENTITIES = {
  Session: "Sign-ins",
  Incident: "Incidents",
  User: "Accounts",
  Station: "Stations",
  Truck: "Trucks",
  Barangay: "Barangay pins",
  Settings: "Settings",
  Deployment: "Special deployments",
};

export const ACTION_LABELS = {
  SIGN_IN: "Signed in",
  SIGN_IN_FAILED: "Sign-in failed",
  SIGN_OUT: "Signed out",
  TOKEN_REUSED: "Session reuse detected",
  CHANGE_PASSWORD: "Changed own password",
  DISPATCH: "Dispatched",
  RAISE_ALARM: "Raised alarm",
  CLOSE: "Closed incident",
  SET_PIN: "Pinned barangay",
  ASSIGN: "Deployed trucks",
  RELEASE: "Released trucks",
  END: "Ended deployment",
  SET_POST: "Set truck post",
};

/** Actions an administrator should notice. */
export const WARNING_ACTIONS = new Set(["SIGN_IN_FAILED", "TOKEN_REUSED"]);
