const DEFAULT_ACCENT = "#7cffb2";

export function applyTheme(theme) {
  document.documentElement.dataset.theme = theme === "aurora" ? "" : theme;
  localStorage.setItem("nura-theme", theme);
}

export function initializeTheme() {
  const theme = localStorage.getItem("nura-theme") || "aurora";
  applyTheme(theme);
  applyAccent(localStorage.getItem("nura-accent") || DEFAULT_ACCENT);
  return theme;
}

export function applyAccent(color) {
  document.documentElement.style.setProperty("--mint", color);
  localStorage.setItem("nura-accent", color);
}

export function initializeSliders() {
  document.documentElement.style.setProperty("--font-scale", `${Number(localStorage.getItem("nura-font") || 100) / 100}`);
  document.documentElement.style.setProperty("--radius", `${localStorage.getItem("nura-radius") || 25}px`);
  document.documentElement.style.setProperty("--glass", `${localStorage.getItem("nura-glass") || 18}px`);
  document.documentElement.dataset.density = localStorage.getItem("nura-density") || "comfortable";
}
