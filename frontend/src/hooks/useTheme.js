import { useSyncExternalStore } from "react";
import { applyTheme } from "@/utils/theme.js";

const subscribe = (cb) => {
  window.addEventListener("rcs-theme", cb);
  return () => window.removeEventListener("rcs-theme", cb);
};

/** Current theme ("light" | "dark") and a toggle. */
function useTheme() {
  const theme = useSyncExternalStore(subscribe, () => (document.documentElement.classList.contains("dark") ? "dark" : "light"));
  return [theme, () => applyTheme(theme === "dark" ? "light" : "dark")];
}

export default useTheme;
