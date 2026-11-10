/**
 * One status language for the whole app. Each tone has one operational meaning:
 * success = available / done, warning = responding / pending, danger = active incident / critical,
 * info = planned deployment / informational, neutral = closed / settled, muted = out of service / ended.
 */
export const STATUS_TONES = {
  success: { badge: "bg-success/12 text-success-foreground border-success/35", dot: "bg-success" },
  warning: { badge: "bg-warning/15 text-warning-foreground border-warning/45", dot: "bg-warning" },
  danger: { badge: "bg-danger/10 text-danger-foreground border-danger/35", dot: "bg-danger" },
  info: { badge: "bg-info/10 text-info-foreground border-info/35", dot: "bg-info" },
  neutral: { badge: "bg-secondary text-secondary-foreground border-border", dot: "bg-foreground/60" },
  muted: { badge: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground/60" },
};

export const INCIDENT_STATUS = {
  OPEN: { label: "Open", tone: "danger" },
  CLOSED: { label: "Closed", tone: "neutral" },
};

export const DEPLOYMENT_STATUS = {
  ACTIVE: { label: "Active", tone: "info" },
  ENDED: { label: "Ended", tone: "muted" },
};
