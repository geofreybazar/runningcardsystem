/** Office levels each role may hold (mirrors backend/src/auth/access.policy.ts). */
export const OFFICE_LEVELS = {
  SUPER_ADMIN: ["REGIONAL"],
  ADMIN: ["REGIONAL"],
  OPERATIONS: ["DISTRICT", "CITY", "REGIONAL"], // Regional Operations runs special deployments (last: new Operations users default to a district)
  RADIO_OPERATOR: ["REGIONAL", "DISTRICT", "CITY"],
};

export const OFFICE_LABELS = { REGIONAL: "Regional Headquarters", DISTRICT: "Fire District", CITY: "City Fire Station" };
