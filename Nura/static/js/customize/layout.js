const widgets = new Map();
const Nura = window.Nura || {};

Nura.registerWidget = (widget) => {
  if (!widget || !/^[a-z0-9-]+$/.test(widget.id) || typeof widget.render !== "function") {
    throw new TypeError("A Nura widget requires a safe id and a render function.");
  }
  widgets.set(widget.id, widget);
};
window.Nura = Nura;

export function getWidgets() {
  return [...widgets.values()];
}

export function getWidgetMarkup() {
  const visibility = JSON.parse(localStorage.getItem("nura-widgets") || "{}");
  return getWidgets()
    .filter((widget) => visibility[widget.id] !== false)
    .map((widget) => widget.render())
    .join("");
}

export function setWidgetVisible(id, visible) {
  const visibility = JSON.parse(localStorage.getItem("nura-widgets") || "{}");
  visibility[id] = visible;
  localStorage.setItem("nura-widgets", JSON.stringify(visibility));
}

export function isWidgetVisible(id) {
  const visibility = JSON.parse(localStorage.getItem("nura-widgets") || "{}");
  return visibility[id] !== false;
}
