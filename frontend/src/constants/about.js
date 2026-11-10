/** Credits and support text for the About page: edit here, in one place. */
export const ABOUT = {
  system: "BFP-NCR Running Card System",
  office: "Bureau of Fire Protection – National Capital Region",
  developer: "SFO1 Geofrey R Bazar",
  developerOffice: "Team Lead Database Management SDMS, ICTS, BFP-NHQ",
  support: [
    { topic: "Account access", text: "Contact your Information Technology and Communications Unit Office (sign-in problems, new accounts, password resets)." },
    { topic: "System problems", text: "Contact the BFP NCR Super Admin, SFO1 Geofrey R Bazar." },
  ],
  builtWith: ["React", "NestJS", "PostgreSQL", "Google Maps Platform"],
};

/** Set at build time by vite.config.js; the commit is null when the build had no git (e.g. Docker without GIT_COMMIT). */
export const BUILD = typeof __BUILD__ === "undefined" ? { version: "dev", date: null, commit: null } : __BUILD__;
