export function saveSetting(name, value) {
  localStorage.setItem(`nura-${name}`, value);
}

export function settingEnabled(name, defaultValue = false) {
  const value = localStorage.getItem(`nura-${name}`);
  return value === null ? defaultValue : value === "on";
}
