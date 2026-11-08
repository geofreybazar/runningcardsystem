import { Bell, ChartColumn, Flame, ScrollText, Settings, Siren, Truck, Users } from "lucide-react";

const ALL = ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "RADIO_OPERATOR"];

/** Pages, their sidebar group, and the roles that see them. The backend enforces the same rules. */
export const NAV = [
  // The running card is the dispatcher's tool.
  { to: "/", label: "Running Card", icon: Flame, group: "Dispatch", roles: ["SUPER_ADMIN", "RADIO_OPERATOR"] },
  { to: "/incidents", label: "Incidents", icon: Siren, group: "Dispatch", roles: ALL },
  { to: "/notifications", label: "Notifications", icon: Bell, group: "Dispatch", roles: ALL },
  { to: "/statistics", label: "Statistics", icon: ChartColumn, group: "Dispatch", roles: ALL },
  { to: "/stations", label: "Stations & Trucks", icon: Truck, group: "Resources", roles: ALL },
  { to: "/users", label: "Users", icon: Users, group: "Administration", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/audit-log", label: "Audit log", icon: ScrollText, group: "Administration", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/settings", label: "Settings", icon: Settings, group: "Administration", roles: ["SUPER_ADMIN"] },
];
