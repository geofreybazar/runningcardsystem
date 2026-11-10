import { Bell, CalendarRange, ChartColumn, Flame, Info, ScrollText, Settings, Siren, Truck, Users } from "lucide-react";

const ALL = ["SUPER_ADMIN", "ADMIN", "OPERATIONS", "RADIO_OPERATOR"];

/** Pages, their sidebar group, and the roles that see them. The backend enforces the same rules. */
export const NAV = [
  // The running card is the dispatcher's tool.
  { to: "/", label: "Running Card", icon: Flame, group: "Operations", roles: ["SUPER_ADMIN", "RADIO_OPERATOR"] },
  { to: "/incidents", label: "Incidents", icon: Siren, group: "Operations", roles: ALL },
  { to: "/notifications", label: "Notifications", icon: Bell, group: "Operations", roles: ALL },
    { to: "/stations", label: "Stations & Trucks", icon: Truck, group: "Resources", roles: ALL },
  // Planned events (ASEAN, SONA): everyone sees where trucks went; Regional Operations manages them.
  { to: "/deployments", label: "Special Deployments", icon: CalendarRange, group: "Resources", roles: ALL },
  { to: "/statistics", label: "Statistics", icon: ChartColumn, group: "Analysis", roles: ALL },
  { to: "/users", label: "Users", icon: Users, group: "Administration", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/audit-log", label: "Audit Log", icon: ScrollText, group: "Administration", roles: ["SUPER_ADMIN", "ADMIN"] },
  { to: "/settings", label: "Settings", icon: Settings, group: "Administration", roles: ["SUPER_ADMIN"] },
  { to: "/about", label: "About", icon: Info, group: "Help", roles: ALL },
];
