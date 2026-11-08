// Light/dark theme: the `dark` class on <html> switches the tokens in index.css. Remembered per browser.
const KEY = "rcs-theme";

export function storedTheme() {
  try {
    const saved = localStorage.getItem(KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    // storage blocked: fall back to the system setting
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export function applyTheme(theme) {
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(KEY, theme);
  } catch {
    // not remembered; still applied for this page
  }
  window.dispatchEvent(new CustomEvent("rcs-theme", { detail: theme }));
}
